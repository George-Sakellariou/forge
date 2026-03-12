import { EventEmitter } from "node:events"
import type { EventType, ForgeEvent } from "@/lib/types/events"
import { v4 as uuidv4 } from "uuid"

class ForgeEventBus extends EventEmitter {
  private recentEvents: ForgeEvent[] = []
  private maxRecentEvents = 200
  private persistQueue: ForgeEvent[] = []
  private persistTimer: NodeJS.Timeout | null = null

  emit(type: string, event: ForgeEvent): boolean {
    this.recentEvents.push(event)
    if (this.recentEvents.length > this.maxRecentEvents) {
      this.recentEvents = this.recentEvents.slice(-this.maxRecentEvents)
    }
    return super.emit(type, event) || super.emit("*", event)
  }

  publish(
    type: EventType,
    payload: Record<string, unknown> = {},
    ids?: { projectId?: string; taskId?: string; agentId?: string },
  ): ForgeEvent {
    const event: ForgeEvent = {
      id: uuidv4(),
      projectId: ids?.projectId ?? null,
      taskId: ids?.taskId ?? null,
      agentId: ids?.agentId ?? null,
      type,
      payload,
      createdAt: new Date().toISOString(),
    }
    this.emit(type, event)

    // Queue for persistence (batch writes)
    this.queuePersist(event)

    return event
  }

  getRecentEvents(limit = 50): ForgeEvent[] {
    return this.recentEvents.slice(-limit)
  }

  getRecentEventsByAgent(agentId: string, limit = 50): ForgeEvent[] {
    return this.recentEvents
      .filter((e) => e.agentId === agentId)
      .slice(-limit)
  }

  getRecentEventsByProject(projectId: string, limit = 50): ForgeEvent[] {
    return this.recentEvents
      .filter((e) => e.projectId === projectId)
      .slice(-limit)
  }

  private queuePersist(event: ForgeEvent): void {
    // Only persist significant events, not high-frequency ones like tool_result
    const persistableTypes = new Set([
      "agent:started",
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
      "workflow:completed",
      "workflow:failed",
      "admin:instruction",
      "system:error",
    ])

    if (!persistableTypes.has(event.type)) return

    this.persistQueue.push(event)

    // Batch flush every 2 seconds
    if (!this.persistTimer) {
      this.persistTimer = setTimeout(() => {
        this.flushPersistQueue()
        this.persistTimer = null
      }, 2000)
    }
  }

  private async flushPersistQueue(): Promise<void> {
    if (this.persistQueue.length === 0) return

    const batch = [...this.persistQueue]
    this.persistQueue = []

    try {
      // Dynamic import to avoid circular dependencies
      const { createAdminClient } = await import("@/lib/supabase/admin")
      const supabase = createAdminClient()

      const rows = batch.map((event) => ({
        id: event.id,
        project_id: event.projectId,
        task_id: event.taskId,
        agent_id: event.agentId,
        type: event.type,
        payload: event.payload,
        created_at: event.createdAt,
      }))

      await supabase.from("events").insert(rows)
    } catch {
      // Non-critical - events are already in memory
      // Re-queue failed events for next batch
      this.persistQueue.unshift(...batch)
    }
  }
}

// Singleton
export const eventBus = new ForgeEventBus()
