import { z } from "zod/v4"

export const EventType = z.enum([
  "agent:started",
  "agent:output",
  "agent:tool_use",
  "agent:tool_result",
  "agent:completed",
  "agent:error",
  "agent:paused",
  "agent:resumed",
  "task:created",
  "task:assigned",
  "task:started",
  "task:completed",
  "task:failed",
  "workflow:started",
  "workflow:step_complete",
  "workflow:step_failed",
  "workflow:step_skipped",
  "workflow:completed",
  "workflow:failed",
  "admin:instruction",
  "system:error",
])
export type EventType = z.infer<typeof EventType>

export const ForgeEventSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid().nullable(),
  taskId: z.string().uuid().nullable(),
  agentId: z.string().uuid().nullable(),
  type: EventType,
  payload: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string().datetime(),
})
export type ForgeEvent = z.infer<typeof ForgeEventSchema>

export interface SSEMessage {
  event: EventType
  data: Record<string, unknown>
  id?: string
}
