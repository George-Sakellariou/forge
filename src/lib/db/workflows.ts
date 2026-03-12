import sql from "./index"

interface WorkflowRow {
  id: string
  project_id: string
  name: string
  description: string | null
  steps: unknown
  status: string
  current_step: string | null
  created_at: string
}

function mapRow(row: WorkflowRow) {
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

export async function findWorkflows(projectId?: string) {
  const rows = await sql<WorkflowRow[]>`
    SELECT * FROM workflows
    WHERE ${projectId ? sql`project_id = ${projectId}` : sql`TRUE`}
    ORDER BY created_at DESC
  `
  return rows.map(mapRow)
}

export async function findWorkflowById(id: string) {
  const rows = await sql<WorkflowRow[]>`
    SELECT * FROM workflows WHERE id = ${id} LIMIT 1
  `
  return rows.length > 0 ? mapRow(rows[0]) : null
}

export async function createWorkflow(data: {
  projectId: string
  name: string
  description?: string
  steps: unknown[]
}) {
  const rows = await sql<WorkflowRow[]>`
    INSERT INTO workflows (project_id, name, description, steps)
    VALUES (${data.projectId}, ${data.name}, ${data.description || null}, ${JSON.stringify(data.steps)})
    RETURNING *
  `
  return mapRow(rows[0])
}

export async function updateWorkflowStatus(id: string, status: string, currentStep?: string | null) {
  await sql`
    UPDATE workflows SET status = ${status}, current_step = ${currentStep ?? null}
    WHERE id = ${id}
  `
}
