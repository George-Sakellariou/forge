"use client"

import { useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useEventStore } from "@/stores/event-store"
import { formatTimestamp } from "@/lib/utils/format"
import { Bot, Wrench, AlertCircle, CheckCircle2, Play } from "lucide-react"
import { cn } from "@/lib/utils"

const eventIcons: Record<string, { icon: typeof Bot; color: string }> = {
  "agent:started": { icon: Play, color: "text-indigo-400" },
  "agent:completed": { icon: CheckCircle2, color: "text-emerald-400" },
  "agent:error": { icon: AlertCircle, color: "text-rose-400" },
  "agent:tool_use": { icon: Wrench, color: "text-amber-400" },
  "agent:tool_result": { icon: Wrench, color: "text-slate-500" },
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
    <div className="glow-card flex flex-col rounded-xl border border-forge-border bg-card">
      <div className="flex items-center justify-between border-b border-forge-border/50 px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Activity Feed
        </h3>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              isConnected ? "bg-forge-success status-pulse" : "bg-slate-600",
            )}
          />
          <span className="text-[10px] font-medium text-muted-foreground">
            {isConnected ? "Live" : "Disconnected"}
          </span>
        </div>
      </div>
      <ScrollArea className="h-64">
        <div className="space-y-0.5 p-2">
          {events.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">
              No activity yet. Start an agent to see events.
            </p>
          ) : (
            events
              .slice()
              .reverse()
              .map((event) => {
                const config =
                  eventIcons[event.type] || { icon: Bot, color: "text-slate-500" }
                const Icon = config.icon
                return (
                  <div
                    key={event.id}
                    className="group flex items-start gap-3 rounded-lg px-3 py-2 text-xs transition-colors hover:bg-secondary/30"
                  >
                    <Icon className={`mt-0.5 h-3 w-3 shrink-0 ${config.color}`} />
                    <span className="flex-1 text-foreground/70 group-hover:text-foreground/90">
                      {getEventDisplay(event)}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground/60">
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
