"use client"

import { useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useEventStore } from "@/stores/event-store"
import { formatTimestamp } from "@/lib/utils/format"
import { Bot, Wrench, AlertCircle, CheckCircle2, Play } from "lucide-react"
import { cn } from "@/lib/utils"

const eventIcons: Record<string, { icon: typeof Bot; color: string }> = {
  "agent:started": { icon: Play, color: "text-forge-accent" },
  "agent:completed": { icon: CheckCircle2, color: "text-forge-success" },
  "agent:error": { icon: AlertCircle, color: "text-forge-error" },
  "agent:tool_use": { icon: Wrench, color: "text-forge-warning" },
  "agent:tool_result": { icon: Wrench, color: "text-forge-muted" },
}

function getEventDisplay(event: { type: string; payload: Record<string, unknown> }) {
  const agentName = (event.payload.agentName as string) || "Unknown"

  switch (event.type) {
    case "agent:started":
      return `${agentName} started working`
    case "agent:completed":
      return `${agentName} completed`
    case "agent:error":
      return `${agentName} error: ${event.payload.error || "unknown"}`
    case "agent:tool_use":
      return `${agentName} using ${event.payload.toolName}`
    case "agent:tool_result":
      return `${agentName} tool result: ${event.payload.toolName}`
    default:
      return `${event.type}`
  }
}

export function ActivityFeed() {
  const events = useEventStore((s) => s.events)
  const isConnected = useEventStore((s) => s.isConnected)
  const addEvent = useEventStore((s) => s.addEvent)
  const setConnected = useEventStore((s) => s.setConnected)

  useEffect(() => {
    const eventSource = new EventSource("/api/events/stream")

    eventSource.onopen = () => setConnected(true)
    eventSource.onerror = () => setConnected(false)

    // Listen to all event types
    const eventTypes = [
      "agent:started",
      "agent:completed",
      "agent:error",
      "agent:tool_use",
      "agent:tool_result",
    ]

    for (const type of eventTypes) {
      eventSource.addEventListener(type, (e) => {
        try {
          const data = JSON.parse(e.data)
          addEvent(data)
        } catch {
          // Ignore parse errors
        }
      })
    }

    return () => eventSource.close()
  }, [addEvent, setConnected])

  return (
    <div className="flex flex-col rounded-lg border border-forge-border bg-card">
      <div className="flex items-center justify-between border-b border-forge-border px-4 py-3">
        <h3 className="text-sm font-medium">Activity Feed</h3>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              isConnected ? "bg-forge-success status-pulse" : "bg-forge-muted",
            )}
          />
          <span className="text-xs text-muted-foreground">
            {isConnected ? "Live" : "Disconnected"}
          </span>
        </div>
      </div>
      <ScrollArea className="h-64">
        <div className="space-y-1 p-3">
          {events.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No activity yet. Start an agent to see events.
            </p>
          ) : (
            events
              .slice()
              .reverse()
              .map((event) => {
                const config =
                  eventIcons[event.type] || { icon: Bot, color: "text-forge-muted" }
                const Icon = config.icon
                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-secondary/50"
                  >
                    <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${config.color}`} />
                    <span className="flex-1 text-foreground/80">
                      {getEventDisplay(event)}
                    </span>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {formatTimestamp(event.createdAt)}
                    </span>
                  </div>
                )
              })
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
