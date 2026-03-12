import { z } from "zod/v4"
import type { AgentRole } from "./agent"

export const WorkflowStatus = z.enum([
  "draft",
  "running",
  "paused",
  "completed",
  "failed",
])
export type WorkflowStatus = z.infer<typeof WorkflowStatus>

export interface WorkflowStep {
  id: string
  agentRole: AgentRole
  action: string
  prompt: string
  dependsOn: string[]
  config?: Record<string, unknown>
}

export const WorkflowSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().nullable(),
  steps: z.array(z.record(z.string(), z.unknown())),
  status: WorkflowStatus.default("draft"),
  currentStep: z.string().nullable(),
  createdAt: z.string().datetime(),
})
export type Workflow = z.infer<typeof WorkflowSchema>
