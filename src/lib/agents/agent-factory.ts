import type { Agent, AgentModel, AgentRole } from "@/lib/types/agent"
import type { AgentLoopConfig } from "./agent-loop"
import { BUILT_IN_AGENTS, TOKEN_EFFICIENCY_SUFFIX } from "./agent-definitions"

const DEFAULT_MAX_TURNS = 25

/**
 * Role-optimized defaults to minimize token waste.
 *
 * - Execution agents (backend, frontend, devops, tester, e2e) use lower temperature
 *   for deterministic output and lower maxTokens since they produce code, not essays.
 * - Planning agents (architect, lead) keep higher maxTokens for detailed specs.
 * - Security auditor uses moderate settings — needs thorough but focused output.
 */
const ROLE_DEFAULTS: Record<AgentRole, { maxTokens: number; temperature: number }> = {
  architect:  { maxTokens: 6144, temperature: 0.5 },
  lead:       { maxTokens: 6144, temperature: 0.5 },
  backend:    { maxTokens: 4096, temperature: 0.3 },
  frontend:   { maxTokens: 4096, temperature: 0.3 },
  tester:     { maxTokens: 4096, temperature: 0.2 },
  e2e:        { maxTokens: 4096, temperature: 0.2 },
  security:   { maxTokens: 4096, temperature: 0.3 },
  devops:     { maxTokens: 4096, temperature: 0.2 },
}

export function createAgentLoopConfig(
  agent: Agent,
  overrides?: {
    workingDirectory?: string
    projectId?: string
    maxTurns?: number
  },
): AgentLoopConfig {
  const agentConfig = agent.config as Record<string, unknown> | undefined
  const roleDefaults = ROLE_DEFAULTS[agent.role as AgentRole] ?? { maxTokens: 4096, temperature: 0.3 }

  return {
    model: agent.model as AgentModel,
    systemPrompt: agent.systemPrompt + TOKEN_EFFICIENCY_SUFFIX,
    tools: agent.tools,
    maxTokens: (agentConfig?.maxTokens as number) ?? roleDefaults.maxTokens,
    temperature: (agentConfig?.temperature as number) ?? roleDefaults.temperature,
    maxTurns: overrides?.maxTurns ?? DEFAULT_MAX_TURNS,
    workingDirectory: overrides?.workingDirectory ?? process.cwd(),
    agentId: agent.id,
    projectId: overrides?.projectId,
  }
}

export function getBuiltInAgentAsDbRow(index: number) {
  const def = BUILT_IN_AGENTS[index]
  if (!def) return null

  return {
    name: def.name,
    role: def.role,
    system_prompt: def.systemPrompt,
    model: def.model,
    tools: def.tools,
    mcp_servers: [],
    config: {},
    is_builtin: true,
  }
}
