import type { Agent, AgentModel } from "@/lib/types/agent"
import type { AgentLoopConfig } from "./agent-loop"
import { BUILT_IN_AGENTS } from "./agent-definitions"

const DEFAULT_MAX_TOKENS = 8192
const DEFAULT_TEMPERATURE = 0.7
const DEFAULT_MAX_TURNS = 50

export function createAgentLoopConfig(
  agent: Agent,
  overrides?: {
    workingDirectory?: string
    projectId?: string
    maxTurns?: number
  },
): AgentLoopConfig {
  return {
    model: agent.model as AgentModel,
    systemPrompt: agent.systemPrompt,
    tools: agent.tools,
    maxTokens: (agent.config as Record<string, unknown>)?.maxTokens as number ?? DEFAULT_MAX_TOKENS,
    temperature: (agent.config as Record<string, unknown>)?.temperature as number ?? DEFAULT_TEMPERATURE,
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
