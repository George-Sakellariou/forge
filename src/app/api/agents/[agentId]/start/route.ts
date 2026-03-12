import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { agentPool } from "@/lib/orchestrator/agent-pool"
import { validateWorkingDirectory } from "@/lib/tools/safety"
import type { Agent } from "@/lib/types/agent"
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
    return NextResponse.json(
      { success: false, error: parsed.error.message },
      { status: 400 },
    )
  }

  const { message, workingDirectory, projectId, taskId } = parsed.data

  // Safety check
  const dirCheck = validateWorkingDirectory(workingDirectory)
  if (!dirCheck.allowed) {
    return NextResponse.json(
      { success: false, error: dirCheck.reason },
      { status: 403 },
    )
  }

  // Fetch agent
  const supabase = await createClient()
  const { data: agentRow, error } = await supabase
    .from("agents")
    .select("*")
    .eq("id", agentId)
    .single()

  if (error || !agentRow) {
    return NextResponse.json(
      { success: false, error: "Agent not found" },
      { status: 404 },
    )
  }

  const agent: Agent = {
    id: agentRow.id,
    name: agentRow.name,
    role: agentRow.role,
    systemPrompt: agentRow.system_prompt,
    model: agentRow.model,
    tools: agentRow.tools || [],
    mcpServers: agentRow.mcp_servers || [],
    config: agentRow.config || {},
    isBuiltin: agentRow.is_builtin,
    createdAt: agentRow.created_at,
  }

  // Check pool capacity
  if (!agentPool.canStartAgent()) {
    return NextResponse.json(
      {
        success: false,
        error: "Agent pool at capacity. Agent has been queued.",
        queued: true,
        poolStatus: agentPool.getStatus(),
      },
      { status: 202 },
    )
  }

  // Start via pool (non-blocking)
  agentPool.runAgent({
    agent,
    message,
    workingDirectory,
    projectId,
    taskId,
  })

  return NextResponse.json({
    success: true,
    data: {
      agentId: agent.id,
      agentName: agent.name,
      status: "started",
      poolStatus: agentPool.getStatus(),
    },
  })
}
