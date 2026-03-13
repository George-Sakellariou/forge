import { eventBus } from "@/lib/orchestrator/event-bus"
import { createSSEStream, sseResponse } from "@/lib/utils/sse"
import type { ForgeEvent } from "@/lib/types/events"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId")

  const { stream, send, close } = createSSEStream()

  // Track sent event IDs to prevent duplicates
  const sentIds = new Set<string>()

  // Send recent events first (filtered if projectId specified)
  const recent = eventBus.getRecentEvents(20)
  for (const event of recent) {
    if (projectId && event.projectId !== projectId) continue
    sentIds.add(event.id)
    send(event.type, event)
  }

  // Subscribe to all new events, skipping already-sent and filtering by project
  const handler = (event: ForgeEvent) => {
    if (sentIds.has(event.id)) return
    if (projectId && event.projectId !== projectId) return
    sentIds.add(event.id)
    send(event.type, event)
  }
  eventBus.on("*", handler)

  // Auto-cleanup after 5 minutes (reconnect expected)
  setTimeout(() => {
    eventBus.removeListener("*", handler)
    close()
  }, 5 * 60 * 1000)

  return sseResponse(stream)
}
