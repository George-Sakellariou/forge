import { NextResponse } from "next/server"
import { findAllAgents, createAgent } from "@/lib/db/agents"
import { CreateAgentSchema } from "@/lib/types/agent"

export async function GET() {
  try {
    const agents = await findAllAgents()
    return NextResponse.json({ success: true, data: agents })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = CreateAgentSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.message }, { status: 400 })
  }

  try {
    const agent = await createAgent({
      name: parsed.data.name,
      role: parsed.data.role,
      systemPrompt: parsed.data.systemPrompt,
      model: parsed.data.model,
      tools: parsed.data.tools,
      mcpServers: parsed.data.mcpServers,
      config: parsed.data.config,
      isBuiltin: parsed.data.isBuiltin,
    })
    return NextResponse.json({ success: true, data: agent }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
