import { findAgentById } from "@/lib/db/agents"
import { runAgentLoop } from "@/lib/agents/agent-loop"
import { createAgentLoopConfig } from "@/lib/agents/agent-factory"
import { sessionManager } from "@/lib/agents/session-manager"
import { eventBus } from "@/lib/orchestrator/event-bus"
import { createSSEStream, sseResponse } from "@/lib/utils/sse"
import { validateWorkingDirectory } from "@/lib/tools/safety"
import { z } from "zod/v4"

const StreamRequestSchema = z.object({
  message: z.string().min(1),
  workingDirectory: z.string().optional(),
  projectId: z.string().uuid().optional(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ agentId: string }> },
) {
  const { agentId } = await params

  const body = await request.json()
  const parsed = StreamRequestSchema.safeParse(body)

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const { message, workingDirectory, projectId } = parsed.data

  // Safety: validate working directory
  if (workingDirectory) {
    const dirCheck = validateWorkingDirectory(workingDirectory)
    if (!dirCheck.allowed) {
      return new Response(JSON.stringify({ error: dirCheck.reason }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    }
  }

  // Fetch agent from DB
  const agent = await findAgentById(agentId)
  if (!agent) {
    return new Response(JSON.stringify({ error: "Agent not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    })
  }

  const config = createAgentLoopConfig(agent, {
    workingDirectory: workingDirectory || process.cwd(),
    projectId,
  })

  sessionManager.createSession(agentId, projectId, workingDirectory)
  sessionManager.setStatus(agentId, "working")

  const { stream, send, close } = createSSEStream()

  eventBus.publish("agent:started", { agentName: agent.name, message }, {
    agentId,
    projectId,
  })

  const abortController = sessionManager.getAbortController(agentId)

  runAgentLoop(config, message, (event) => {
    send(event.type, event.data)

    if (event.type === "tool_use_start") {
      eventBus.publish("agent:tool_use", { agentName: agent.name, ...event.data }, { agentId, projectId })
    } else if (event.type === "tool_result") {
      eventBus.publish("agent:tool_result", { agentName: agent.name, ...event.data }, { agentId, projectId })
    } else if (event.type === "error") {
      eventBus.publish("agent:error", { agentName: agent.name, ...event.data }, { agentId, projectId })
    }
  }, abortController.signal).then(() => {
    sessionManager.setStatus(agentId, "idle")
    eventBus.publish("agent:completed", { agentName: agent.name }, { agentId, projectId })
    send("done", { status: "completed" })
    close()
  }).catch((err) => {
    const errorMsg = err instanceof Error ? err.message : String(err)
    sessionManager.setStatus(agentId, "error")
    eventBus.publish("agent:error", { agentName: agent.name, error: errorMsg }, { agentId, projectId })
    send("error", { error: errorMsg })
    close()
  })

  return sseResponse(stream)
}
