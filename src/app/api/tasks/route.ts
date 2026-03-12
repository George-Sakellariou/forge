import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { CreateTaskSchema } from "@/lib/types/task"
import { eventBus } from "@/lib/orchestrator/event-bus"
import { z } from "zod/v4"

function mapTaskRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    projectId: row.project_id,
    agentId: row.agent_id,
    parentTaskId: row.parent_task_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    input: row.input || {},
    output: row.output || {},
    sessionId: row.session_id,
    tokensUsed: row.tokens_used,
    costUsd: Number(row.cost_usd),
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId")
  const agentId = searchParams.get("agentId")
  const status = searchParams.get("status")

  const supabase = await createClient()
  let query = supabase.from("tasks").select("*").order("priority", { ascending: false }).order("created_at", { ascending: false })

  if (projectId) query = query.eq("project_id", projectId)
  if (agentId) query = query.eq("agent_id", agentId)
  if (status) query = query.eq("status", status)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: data.map(mapTaskRow) })
}

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = CreateTaskSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.message }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      project_id: parsed.data.projectId,
      agent_id: parsed.data.agentId,
      parent_task_id: parsed.data.parentTaskId,
      title: parsed.data.title,
      description: parsed.data.description,
      priority: parsed.data.priority ?? 0,
      input: parsed.data.input || {},
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  const task = mapTaskRow(data)

  eventBus.publish("task:created", { taskTitle: task.title }, {
    projectId: task.projectId as string,
    taskId: task.id as string,
    agentId: task.agentId as string | undefined,
  })

  return NextResponse.json({ success: true, data: task }, { status: 201 })
}

// PATCH for updating tasks (status, assignment, output)
export async function PATCH(request: Request) {
  const body = await request.json()

  const UpdateSchema = z.object({
    id: z.string().uuid(),
    status: z.string().optional(),
    agentId: z.string().uuid().optional(),
    output: z.record(z.string(), z.unknown()).optional(),
    tokensUsed: z.number().int().optional(),
    costUsd: z.number().optional(),
  })

  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.message }, { status: 400 })
  }

  const { id, ...updates } = parsed.data
  const dbUpdates: Record<string, unknown> = {}

  if (updates.status) {
    dbUpdates.status = updates.status
    if (updates.status === "running") dbUpdates.started_at = new Date().toISOString()
    if (updates.status === "completed" || updates.status === "failed") {
      dbUpdates.completed_at = new Date().toISOString()
    }
  }
  if (updates.agentId) dbUpdates.agent_id = updates.agentId
  if (updates.output) dbUpdates.output = updates.output
  if (updates.tokensUsed !== undefined) dbUpdates.tokens_used = updates.tokensUsed
  if (updates.costUsd !== undefined) dbUpdates.cost_usd = updates.costUsd

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("tasks")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  const task = mapTaskRow(data)

  if (updates.status === "completed") {
    eventBus.publish("task:completed", { taskTitle: task.title }, {
      projectId: task.projectId as string,
      taskId: task.id as string,
      agentId: task.agentId as string | undefined,
    })
  } else if (updates.status === "failed") {
    eventBus.publish("task:failed", { taskTitle: task.title }, {
      projectId: task.projectId as string,
      taskId: task.id as string,
      agentId: task.agentId as string | undefined,
    })
  } else if (updates.agentId) {
    eventBus.publish("task:assigned", { taskTitle: task.title }, {
      projectId: task.projectId as string,
      taskId: task.id as string,
      agentId: updates.agentId,
    })
  }

  return NextResponse.json({ success: true, data: task })
}
