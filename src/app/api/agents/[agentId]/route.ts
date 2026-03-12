import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ agentId: string }> },
) {
  const { agentId } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("id", agentId)
    .single()

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.code === "PGRST116" ? 404 : 500 },
    )
  }

  const agent = {
    id: data.id,
    name: data.name,
    role: data.role,
    systemPrompt: data.system_prompt,
    model: data.model,
    tools: data.tools || [],
    mcpServers: data.mcp_servers || [],
    config: data.config || {},
    isBuiltin: data.is_builtin,
    createdAt: data.created_at,
  }

  return NextResponse.json({ success: true, data: agent })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ agentId: string }> },
) {
  const { agentId } = await params
  const supabase = await createClient()

  const { error } = await supabase
    .from("agents")
    .delete()
    .eq("id", agentId)

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true })
}
