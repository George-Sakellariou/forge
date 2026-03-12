import type { AgentStatus } from "@/lib/types/agent"
import { cn } from "@/lib/utils"

const statusConfig: Record<
  AgentStatus,
  { label: string; dotColor: string; textColor: string; pulse?: boolean }
> = {
  idle: {
    label: "Idle",
    dotColor: "bg-forge-muted",
    textColor: "text-forge-muted",
  },
  working: {
    label: "Working",
    dotColor: "bg-forge-success",
    textColor: "text-forge-success",
    pulse: true,
  },
  paused: {
    label: "Paused",
    dotColor: "bg-forge-warning",
    textColor: "text-forge-warning",
  },
  error: {
    label: "Error",
    dotColor: "bg-forge-error",
    textColor: "text-forge-error",
  },
  stopped: {
    label: "Stopped",
    dotColor: "bg-forge-muted",
    textColor: "text-forge-muted",
  },
}

interface AgentStatusBadgeProps {
  status: AgentStatus
}

export function AgentStatusBadge({ status }: AgentStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={cn(
          "h-2 w-2 rounded-full",
          config.dotColor,
          config.pulse && "status-pulse",
        )}
      />
      <span className={cn("text-xs font-medium", config.textColor)}>
        {config.label}
      </span>
    </div>
  )
}
