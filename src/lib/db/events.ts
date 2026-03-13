import sql from "./index"

export async function insertEvents(
  events: Array<{
    id: string
    projectId: string | null
    taskId: string | null
    agentId: string | null
    type: string
    payload: Record<string, unknown>
    createdAt: string
  }>,
): Promise<void> {
  if (events.length === 0) return

  await sql`
    INSERT INTO events ${sql(
      events.map((e) => ({
        id: e.id,
        project_id: e.projectId,
        task_id: e.taskId,
        agent_id: e.agentId,
        type: e.type,
        payload: JSON.stringify(e.payload),
        created_at: e.createdAt,
      })),
    )}
  `
}

export async function findRecentEvents(limit = 50) {
  const rows = await sql`
    SELECT * FROM events ORDER BY created_at DESC LIMIT ${limit}
  `
  return [...rows]
}

export async function findEventsByProject(projectId: string, limit = 50) {
  const rows = await sql`
    SELECT * FROM events
    WHERE project_id = ${projectId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `
  return [...rows]
}

export async function getProjectEventCounts(projectId: string) {
  const rows = await sql<{ type: string; count: string }[]>`
    SELECT type, COUNT(*)::text as count
    FROM events
    WHERE project_id = ${projectId}
    GROUP BY type
  `
  const counts: Record<string, number> = {}
  for (const row of rows) {
    counts[row.type] = parseInt(row.count, 10)
  }
  return counts
}
