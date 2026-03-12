import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { CreateProjectSchema } from "@/lib/types/project"

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false })

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    )
  }

  const projects = data.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    config: row.config || {},
    workingDirectory: row.working_directory,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))

  return NextResponse.json({ success: true, data: projects })
}

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = CreateProjectSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.message },
      { status: 400 },
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("projects")
    .insert({
      name: parsed.data.name,
      description: parsed.data.description,
      working_directory: parsed.data.workingDirectory,
      config: parsed.data.config || {},
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
