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
