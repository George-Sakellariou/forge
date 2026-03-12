import sql from "./index"
import type { Project, ProjectStatus } from "@/lib/types/project"

interface ProjectRow {
  id: string
  name: string
  description: string | null
  status: string
  config: unknown
  working_directory: string | null
  created_at: string
  updated_at: string
}

function mapRow(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status as ProjectStatus,
    config: (row.config as Record<string, unknown>) || {},
    workingDirectory: row.working_directory,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function findAllProjects(): Promise<Project[]> {
  const rows = await sql<ProjectRow[]>`
    SELECT * FROM projects ORDER BY updated_at DESC
  `
  return rows.map(mapRow)
}

export async function findProjectById(id: string): Promise<Project | null> {
  const rows = await sql<ProjectRow[]>`
    SELECT * FROM projects WHERE id = ${id} LIMIT 1
  `
  return rows.length > 0 ? mapRow(rows[0]) : null
}

export async function createProject(data: {
  name: string
  description?: string
  workingDirectory?: string
  config?: Record<string, unknown>
}): Promise<Project> {
  const rows = await sql<ProjectRow[]>`
    INSERT INTO projects (name, description, working_directory, config)
    VALUES (
      ${data.name},
      ${data.description || null},
      ${data.workingDirectory || null},
      ${JSON.stringify(data.config || {})}
    )
    RETURNING *
  `
  return mapRow(rows[0])
}
