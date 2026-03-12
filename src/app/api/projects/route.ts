import { NextResponse } from "next/server"
import { findAllProjects, createProject } from "@/lib/db/projects"
import { CreateProjectSchema } from "@/lib/types/project"

export async function GET() {
  try {
    const projects = await findAllProjects()
    return NextResponse.json({ success: true, data: projects })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = CreateProjectSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.message }, { status: 400 })
  }

  try {
    const project = await createProject({
      name: parsed.data.name,
      description: parsed.data.description,
      workingDirectory: parsed.data.workingDirectory,
      config: parsed.data.config,
    })
    return NextResponse.json({ success: true, data: project }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
