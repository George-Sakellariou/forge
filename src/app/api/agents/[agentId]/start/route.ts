import { NextResponse } from "next/server"
import { findAgentById } from "@/lib/db/agents"
import { agentPool } from "@/lib/orchestrator/agent-pool"
import { validateWorkingDirectory } from "@/lib/tools/safety"
import { z } from "zod/v4"

const StartSchema = z.object({
  message: z.string().min(1),
  workingDirectory: z.string().min(1),
  projectId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ agentId: string }> },
) {
  const { agentId } = await params

  const body = await request.json()
  const parsed = StartSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.message }, { status: 400 })
  }

  const { message, workingDirectory, projectId, taskId } = parsed.data

  const dirCheck = validateWorkingDirectory(workingDirectory)
  if (!dirCheck.allowed) {
    return NextResponse.json({ success: false, error: dirCheck.reason }, { status: 403 })
  }

  const agent = await findAgentById(agentId)
  if (!agent) {
    return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 })
  }

  // runAgent handles both immediate execution and queuing internally
  agentPool.runAgent({ agent, message, workingDirectory, projectId, taskId })

  const poolStatus = agentPool.getStatus()
  const wasQueued = !poolStatus.runningAgentIds.includes(agent.id)

  return NextResponse.json({
    success: true,
    data: {
      agentId: agent.id,
      agentName: agent.name,
      status: wasQueued ? "queued" : "started",
      poolStatus,
    },
  }, { status: wasQueued ? 202 : 200 })
}
