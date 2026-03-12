import { z } from "zod/v4"

export const ProjectStatus = z.enum([
  "planning",
  "active",
  "paused",
  "completed",
])
export type ProjectStatus = z.infer<typeof ProjectStatus>

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().nullable(),
  status: ProjectStatus.default("planning"),
  config: z.record(z.string(), z.unknown()).default({}),
  workingDirectory: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type Project = z.infer<typeof ProjectSchema>

export const CreateProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  workingDirectory: z.string().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
})
export type CreateProject = z.infer<typeof CreateProjectSchema>
