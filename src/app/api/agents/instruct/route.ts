import { NextResponse } from "next/server"
import { sessionManager } from "@/lib/agents/session-manager"
import { eventBus } from "@/lib/orchestrator/event-bus"
import { z } from "zod/v4"

const InstructSchema = z.object({
  agentId: z.string().uuid(),
  message: z.string().min(1),
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = InstructSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.message },
      { status: 400 },
    )
  }

  const { agentId, message } = parsed.data

  const session = sessionManager.getSession(agentId)
  if (!session) {
    return NextResponse.json(
      { success: false, error: "No active session for this agent" },
      { status: 404 },
    )
  }

  // Publish admin instruction event
  eventBus.publish(
    "admin:instruction",
    { agentId, message, agentName: agentId },
    { agentId },
  )

  return NextResponse.json({ success: true })
}
