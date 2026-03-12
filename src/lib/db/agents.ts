import sql from "./index"
import type { Agent, AgentModel, AgentRole } from "@/lib/types/agent"

interface AgentRow {
  id: string
  name: string
  role: string
  system_prompt: string
  model: string
  tools: string[]
  mcp_servers: unknown
  config: unknown
  is_builtin: boolean
  created_at: string
}

function mapRow(row: AgentRow): Agent {
  return {
    id: row.id,
    name: row.name,
    role: row.role as AgentRole,
    systemPrompt: row.system_prompt,
    model: row.model as AgentModel,
    tools: row.tools || [],
    mcpServers: (row.mcp_servers as Record<string, unknown>[]) || [],
    config: (row.config as { temperature: number; maxTokens: number }) || { temperature: 0.7, maxTokens: 8192 },
    isBuiltin: row.is_builtin,
    createdAt: row.created_at,
  }
}

export async function findAllAgents(): Promise<Agent[]> {
  const rows = await sql<AgentRow[]>`
    SELECT * FROM agents ORDER BY created_at ASC
  `
  return rows.map(mapRow)
}

export async function findAgentById(id: string): Promise<Agent | null> {
  const rows = await sql<AgentRow[]>`
    SELECT * FROM agents WHERE id = ${id} LIMIT 1
  `
  return rows.length > 0 ? mapRow(rows[0]) : null
}

export async function createAgent(data: {
  name: string
  role: string
  systemPrompt: string
  model: string
  tools: string[]
  mcpServers?: unknown[]
  config?: unknown
  isBuiltin?: boolean
}): Promise<Agent> {
  const rows = await sql<AgentRow[]>`
    INSERT INTO agents (name, role, system_prompt, model, tools, mcp_servers, config, is_builtin)
    VALUES (
      ${data.name},
      ${data.role},
      ${data.systemPrompt},
      ${data.model},
      ${sql.array(data.tools)},
      ${JSON.stringify(data.mcpServers || [])},
      ${JSON.stringify(data.config || {})},
      ${data.isBuiltin || false}
    )
    RETURNING *
  `
  return mapRow(rows[0])
}

export async function deleteAgent(id: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM agents WHERE id = ${id}
  `
  return result.count > 0
}
