import { NextResponse } from "next/server"
import { findTasks, createTask, updateTask } from "@/lib/db/tasks"
import { CreateTaskSchema } from "@/lib/types/task"
import { eventBus } from "@/lib/orchestrator/event-bus"
import { z } from "zod/v4"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  try {
    const tasks = await findTasks({
      projectId: searchParams.get("projectId") || undefined,
      agentId: searchParams.get("agentId") || undefined,
      status: searchParams.get("status") || undefined,
    })
    return NextResponse.json({ success: true, data: tasks })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = CreateTaskSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.message }, { status: 400 })
  }

  try {
    const task = await createTask({
      projectId: parsed.data.projectId,
      agentId: parsed.data.agentId,
      parentTaskId: parsed.data.parentTaskId,
      title: parsed.data.title,
      description: parsed.data.description,
      priority: parsed.data.priority,
      input: parsed.data.input,
    })

    eventBus.publish("task:created", { taskTitle: task.title }, {
      projectId: task.projectId,
      taskId: task.id,
      agentId: task.agentId || undefined,
    })

    return NextResponse.json({ success: true, data: task }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

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

  try {
    const { id, ...updates } = parsed.data
    const task = await updateTask(id, updates)

    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 })
    }

    if (updates.status === "completed") {
      eventBus.publish("task:completed", { taskTitle: task.title }, {
        projectId: task.projectId,
        taskId: task.id,
        agentId: task.agentId || undefined,
      })
    } else if (updates.status === "failed") {
      eventBus.publish("task:failed", { taskTitle: task.title }, {
        projectId: task.projectId,
        taskId: task.id,
        agentId: task.agentId || undefined,
      })
    }

    return NextResponse.json({ success: true, data: task })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
