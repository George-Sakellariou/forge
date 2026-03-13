import sql from "./index"
import type { Task, TaskStatus } from "@/lib/types/task"

interface TaskRow {
  id: string
  project_id: string
  agent_id: string | null
  parent_task_id: string | null
  title: string
  description: string | null
  status: string
  priority: number
  input: unknown
  output: unknown
  session_id: string | null
  tokens_used: number
  cost_usd: string
  started_at: string | null
  completed_at: string | null
  created_at: string
}

function mapRow(row: TaskRow): Task {
  return {
    id: row.id,
    projectId: row.project_id,
    agentId: row.agent_id,
    parentTaskId: row.parent_task_id,
    title: row.title,
    description: row.description,
    status: row.status as TaskStatus,
    priority: row.priority,
    input: (row.input as Record<string, unknown>) || {},
    output: (row.output as Record<string, unknown>) || {},
    sessionId: row.session_id,
    tokensUsed: row.tokens_used,
    costUsd: Number(row.cost_usd),
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  }
}

export async function findTasks(filters?: {
  projectId?: string
  agentId?: string
  status?: string
}): Promise<Task[]> {
  const rows = await sql<TaskRow[]>`
    SELECT * FROM tasks
    WHERE ${filters?.projectId ? sql`project_id = ${filters.projectId}` : sql`TRUE`}
      AND ${filters?.agentId ? sql`agent_id = ${filters.agentId}` : sql`TRUE`}
      AND ${filters?.status ? sql`status = ${filters.status}` : sql`TRUE`}
    ORDER BY priority DESC, created_at DESC
  `
  return rows.map(mapRow)
}

export async function createTask(data: {
  projectId: string
  agentId?: string
  parentTaskId?: string
  title: string
  description?: string
  priority?: number
  input?: Record<string, unknown>
}): Promise<Task> {
  const rows = await sql<TaskRow[]>`
    INSERT INTO tasks (project_id, agent_id, parent_task_id, title, description, priority, input)
    VALUES (
      ${data.projectId},
      ${data.agentId || null},
      ${data.parentTaskId || null},
      ${data.title},
      ${data.description || null},
      ${data.priority ?? 0},
      ${JSON.stringify(data.input || {})}
    )
    RETURNING *
  `
  return mapRow(rows[0])
}

export async function updateTask(
  id: string,
  updates: {
    status?: string
    agentId?: string
    output?: Record<string, unknown>
    tokensUsed?: number
    costUsd?: number
  },
): Promise<Task | null> {
  const isStarting = updates.status === "running"
  const isEnding = updates.status === "completed" || updates.status === "failed"

  const rows = await sql<TaskRow[]>`
    UPDATE tasks SET
      status = COALESCE(${updates.status ?? null}, status),
      agent_id = COALESCE(${updates.agentId ?? null}, agent_id),
      output = CASE WHEN ${updates.output !== undefined} THEN ${JSON.stringify(updates.output ?? {})}::jsonb ELSE output END,
      tokens_used = COALESCE(${updates.tokensUsed ?? null}::integer, tokens_used),
      cost_usd = COALESCE(${updates.costUsd ?? null}::numeric, cost_usd),
      started_at = CASE WHEN ${isStarting} THEN now() ELSE started_at END,
      completed_at = CASE WHEN ${isEnding} THEN now() ELSE completed_at END
    WHERE id = ${id}
    RETURNING *
  `
  return rows.length > 0 ? mapRow(rows[0]) : null
}

export async function getTaskStats(projectId?: string): Promise<Record<string, number>> {
  const rows = await sql<{ status: string; count: string }[]>`
    SELECT status, COUNT(*)::text as count FROM tasks
    WHERE ${projectId ? sql`project_id = ${projectId}` : sql`TRUE`}
    GROUP BY status
  `
  const stats: Record<string, number> = { pending: 0, running: 0, completed: 0, failed: 0 }
  for (const row of rows) {
    stats[row.status] = parseInt(row.count, 10)
  }
  return stats
}

export async function getProjectCostSummary(projectId: string) {
  const rows = await sql<{ total_tokens: string; total_cost: string }[]>`
    SELECT
      COALESCE(SUM(tokens_used), 0)::text as total_tokens,
      COALESCE(SUM(cost_usd), 0)::text as total_cost
    FROM tasks
    WHERE project_id = ${projectId}
  `
  return {
    totalTokens: parseInt(rows[0]?.total_tokens || "0", 10),
    totalCost: parseFloat(rows[0]?.total_cost || "0"),
  }
}
