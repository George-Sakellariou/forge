"use client"

import { useEffect } from "react"
import { useEventStore } from "@/stores/event-store"
import { formatTimestamp } from "@/lib/utils/format"
import { Bot, Wrench, AlertCircle, CheckCircle2, Play, GitBranch, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

const eventIcons: Record<string, { icon: typeof Bot; color: string }> = {
  "agent:started": { icon: Play, color: "text-indigo-400" },
  "agent:completed": { icon: CheckCircle2, color: "text-emerald-400" },
  "agent:error": { icon: AlertCircle, color: "text-rose-400" },
  "agent:tool_use": { icon: Wrench, color: "text-amber-400" },
  "agent:tool_result": { icon: Wrench, color: "text-slate-500" },
  "workflow:started": { icon: GitBranch, color: "text-indigo-400" },
  "workflow:completed": { icon: GitBranch, color: "text-emerald-400" },
  "workflow:failed": { icon: GitBranch, color: "text-rose-400" },
  "workflow:step_complete": { icon: CheckCircle2, color: "text-teal-400" },
  "workflow:step_failed": { icon: AlertCircle, color: "text-rose-400" },
  "admin:instruction": { icon: MessageSquare, color: "text-purple-400" },
  "task:created": { icon: Play, color: "text-cyan-400" },
  "task:completed": { icon: CheckCircle2, color: "text-emerald-400" },
  "task:failed": { icon: AlertCircle, color: "text-rose-400" },
}

function getEventDisplay(event: { type: string; payload: Record<string, unknown> }) {
  const agentName = (event.payload.agentName as string) || ""
  const prefix = agentName ? `${agentName} — ` : ""

  switch (event.type) {
    case "agent:started":
      return `${prefix}started working`
    case "agent:completed":
      return `${prefix}completed`
    case "agent:error":
      return `${prefix}error: ${event.payload.error || "unknown"}`
    case "agent:tool_use":
      return `${prefix}using ${event.payload.toolName}`
    case "agent:tool_result":
      return `${prefix}${event.payload.toolName} done`
    case "workflow:started":
      return `Workflow started: ${event.payload.workflowName || "—"}`
    case "workflow:completed":
      return `Workflow completed`
    case "workflow:failed":
      return `Workflow failed`
    case "workflow:step_complete":
      return `Step complete: ${event.payload.agentRole || ""}`
    case "workflow:step_failed":
      return `Step failed: ${event.payload.agentRole || ""}`
    case "admin:instruction":
      return `Admin instruction → ${agentName}`
    case "task:created":
      return `Task created: ${event.payload.title || "—"}`
    case "task:completed":
      return `Task completed: ${event.payload.title || "—"}`
    case "task:failed":
      return `Task failed: ${event.payload.title || "—"}`
    default:
      return event.type.replace(/[_:]/g, " ")
  }
}

interface ActivityFeedProps {
  projectId?: string
}

export function ActivityFeed({ projectId }: ActivityFeedProps) {
  const events = useEventStore((s) => s.events)
  const isConnected = useEventStore((s) => s.isConnected)
  const addEvent = useEventStore((s) => s.addEvent)
  const setConnected = useEventStore((s) => s.setConnected)

  useEffect(() => {
    const url = projectId
      ? `/api/events/stream?projectId=${projectId}`
      : "/api/events/stream"
    const eventSource = new EventSource(url)

    eventSource.onopen = () => setConnected(true)
    eventSource.onerror = () => setConnected(false)

    const eventTypes = [
      "agent:started",
      "agent:completed",
      "agent:error",
      "agent:tool_use",
      "agent:tool_result",
      "workflow:started",
      "workflow:completed",
      "workflow:failed",
      "workflow:step_complete",
      "workflow:step_failed",
      "admin:instruction",
      "task:created",
      "task:completed",
      "task:failed",
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
  }, [addEvent, setConnected, projectId])

  // Filter events to project if scoped
  const filteredEvents = projectId
    ? events.filter((e) => e.projectId === projectId)
    : events

  return (
    <div className="glow-card flex flex-col rounded-xl border border-forge-border bg-card">
      <div className="flex items-center justify-between border-b border-forge-border/50 px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {projectId ? "Project Activity" : "Activity Feed"}
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
      <div className="h-64 overflow-y-auto">
        <div className="space-y-0.5 p-2">
          {filteredEvents.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">
              {projectId
                ? "No activity for this project yet."
                : "No activity yet. Start an agent to see events."}
            </p>
          ) : (
            filteredEvents
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
      </div>
    </div>
  )
}
