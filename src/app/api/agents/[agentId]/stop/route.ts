import { NextResponse } from "next/server"
import { sessionManager } from "@/lib/agents/session-manager"
import { eventBus } from "@/lib/orchestrator/event-bus"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ agentId: string }> },
) {
  const { agentId } = await params

  const session = sessionManager.getSession(agentId)
  if (!session) {
    return NextResponse.json(
      { success: false, error: "No active session for this agent" },
      { status: 404 },
    )
  }

  sessionManager.stopAgent(agentId)
  eventBus.publish("agent:paused", { reason: "admin_stop" }, { agentId })

  return NextResponse.json({ success: true })
}
