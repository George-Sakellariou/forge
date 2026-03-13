import type { AgentStatus } from "@/lib/types/agent"
import { cn } from "@/lib/utils"

const statusConfig: Record<
  AgentStatus,
  { label: string; dotColor: string; bgColor: string; textColor: string; pulse?: boolean }
> = {
  idle: {
    label: "Idle",
    dotColor: "bg-slate-500",
    bgColor: "bg-slate-500/5",
    textColor: "text-slate-500",
  },
  working: {
    label: "Working",
    dotColor: "bg-forge-success",
    bgColor: "bg-forge-success/10",
    textColor: "text-forge-success",
    pulse: true,
  },
  paused: {
    label: "Paused",
    dotColor: "bg-forge-warning",
    bgColor: "bg-forge-warning/10",
    textColor: "text-forge-warning",
  },
  error: {
    label: "Error",
    dotColor: "bg-forge-error",
    bgColor: "bg-forge-error/10",
    textColor: "text-forge-error",
  },
  stopped: {
    label: "Stopped",
    dotColor: "bg-slate-500",
    bgColor: "bg-slate-500/5",
    textColor: "text-slate-500",
  },
}

interface AgentStatusBadgeProps {
  status: AgentStatus
}

export function AgentStatusBadge({ status }: AgentStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <div className={cn("flex items-center gap-1.5 rounded-full px-2 py-0.5", config.bgColor)}>
      <div
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          config.dotColor,
          config.pulse && "status-pulse",
        )}
      />
      <span className={cn("text-[10px] font-semibold uppercase tracking-wide", config.textColor)}>
        {config.label}
      </span>
    </div>
  )
}
