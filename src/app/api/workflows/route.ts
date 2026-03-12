import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod/v4"

const CreateWorkflowSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  steps: z.array(
    z.object({
      id: z.string(),
      agentRole: z.string(),
      action: z.string(),
      prompt: z.string(),
      dependsOn: z.array(z.string()).default([]),
      config: z.record(z.string(), z.unknown()).optional(),
    }),
  ),
})

function mapWorkflowRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    description: row.description,
    steps: row.steps,
    status: row.status,
    currentStep: row.current_step,
    createdAt: row.created_at,
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId")

  const supabase = await createClient()
  let query = supabase
    .from("workflows")
    .select("*")
    .order("created_at", { ascending: false })

  if (projectId) query = query.eq("project_id", projectId)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: data.map(mapWorkflowRow) })
}

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = CreateWorkflowSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.message }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("workflows")
    .insert({
      project_id: parsed.data.projectId,
      name: parsed.data.name,
      description: parsed.data.description,
      steps: parsed.data.steps,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: mapWorkflowRow(data) }, { status: 201 })
}
