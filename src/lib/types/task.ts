import { z } from "zod/v4"

export const TaskStatus = z.enum([
  "pending",
  "assigned",
  "running",
  "completed",
  "failed",
  "blocked",
])
export type TaskStatus = z.infer<typeof TaskStatus>

export const TaskSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  agentId: z.string().uuid().nullable(),
  parentTaskId: z.string().uuid().nullable(),
  title: z.string().min(1),
  description: z.string().nullable(),
  status: TaskStatus.default("pending"),
  priority: z.number().int().default(0),
  input: z.record(z.string(), z.unknown()).default({}),
  output: z.record(z.string(), z.unknown()).default({}),
  sessionId: z.string().nullable(),
  tokensUsed: z.number().int().default(0),
  costUsd: z.number().default(0),
  startedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
})
export type Task = z.infer<typeof TaskSchema>

export const CreateTaskSchema = z.object({
  projectId: z.string().uuid(),
  agentId: z.string().uuid().optional(),
  parentTaskId: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.number().int().optional(),
  input: z.record(z.string(), z.unknown()).optional(),
})
export type CreateTask = z.infer<typeof CreateTaskSchema>
