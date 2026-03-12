import { NextResponse } from "next/server"
import { findWorkflows, createWorkflow } from "@/lib/db/workflows"
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId") || undefined

  try {
    const workflows = await findWorkflows(projectId)
    return NextResponse.json({ success: true, data: workflows })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = CreateWorkflowSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.message }, { status: 400 })
  }

  try {
    const workflow = await createWorkflow({
      projectId: parsed.data.projectId,
      name: parsed.data.name,
      description: parsed.data.description,
      steps: parsed.data.steps,
    })
    return NextResponse.json({ success: true, data: workflow }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
