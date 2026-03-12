import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { CreateAgentSchema } from "@/lib/types/agent"

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    )
  }

  // Map snake_case DB fields to camelCase
  const agents = data.map((row) => ({
    id: row.id,
    name: row.name,
    role: row.role,
    systemPrompt: row.system_prompt,
    model: row.model,
    tools: row.tools || [],
    mcpServers: row.mcp_servers || [],
    config: row.config || {},
    isBuiltin: row.is_builtin,
    createdAt: row.created_at,
  }))

  return NextResponse.json({ success: true, data: agents })
}

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = CreateAgentSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.message },
      { status: 400 },
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("agents")
    .insert({
      name: parsed.data.name,
      role: parsed.data.role,
      system_prompt: parsed.data.systemPrompt,
      model: parsed.data.model,
      tools: parsed.data.tools,
      mcp_servers: parsed.data.mcpServers,
      config: parsed.data.config,
      is_builtin: parsed.data.isBuiltin,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true, data }, { status: 201 })
}
