import { z } from "zod/v4"

export const AgentRole = z.enum([
  "architect",
  "lead",
  "backend",
  "frontend",
  "tester",
  "e2e",
  "security",
  "devops",
])
export type AgentRole = z.infer<typeof AgentRole>

export const AgentStatus = z.enum([
  "idle",
  "working",
  "paused",
  "error",
  "stopped",
])
export type AgentStatus = z.infer<typeof AgentStatus>

export const AgentModel = z.enum([
  "claude-opus-4-6",
  "claude-sonnet-4-6",
  "claude-haiku-4-5-20251001",
])
export type AgentModel = z.infer<typeof AgentModel>

export const AgentConfigSchema = z.object({
  temperature: z.number().min(0).max(1).default(0.7),
  maxTokens: z.number().min(1).max(64000).default(8192),
})
export type AgentConfig = z.infer<typeof AgentConfigSchema>

export const AgentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  role: AgentRole,
  systemPrompt: z.string().min(1),
  model: AgentModel,
  tools: z.array(z.string()).default([]),
  mcpServers: z.array(z.record(z.string(), z.unknown())).default([]),
  config: AgentConfigSchema.default({ temperature: 0.7, maxTokens: 8192 }),
  isBuiltin: z.boolean().default(false),
  createdAt: z.string().datetime(),
})
export type Agent = z.infer<typeof AgentSchema>

export const CreateAgentSchema = AgentSchema.omit({
  id: true,
  createdAt: true,
})
export type CreateAgent = z.infer<typeof CreateAgentSchema>

export interface AgentSession {
  agentId: string
  projectId?: string
  taskId?: string
  status: AgentStatus
  messages: AgentMessage[]
  tokensUsed: number
  costUsd: number
  startedAt: string
  workingDirectory?: string
}

export interface AgentMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  toolCalls?: ToolCall[]
  toolResults?: ToolResult[]
  timestamp: string
  tokensUsed?: number
}

export interface ToolCall {
  id: string
  name: string
  input: Record<string, unknown>
}

export interface ToolResult {
  toolUseId: string
  content: string
  isError?: boolean
}
