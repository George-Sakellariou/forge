import { eventBus } from "@/lib/orchestrator/event-bus"
import { createSSEStream, sseResponse } from "@/lib/utils/sse"
import type { ForgeEvent } from "@/lib/types/events"

export async function GET() {
  const { stream, send, close } = createSSEStream()

  // Track sent event IDs to prevent duplicates
  const sentIds = new Set<string>()

  // Send recent events first
  const recent = eventBus.getRecentEvents(20)
  for (const event of recent) {
    sentIds.add(event.id)
    send(event.type, event)
  }

  // Subscribe to all new events, skipping already-sent
  const handler = (event: ForgeEvent) => {
    if (sentIds.has(event.id)) return
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
