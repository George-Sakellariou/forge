"use client"

import { Bot, Activity, DollarSign, FolderOpen } from "lucide-react"
import { useAgentStore } from "@/stores/agent-store"
import { useProjectStore } from "@/stores/project-store"
import { formatCost, formatTokens } from "@/lib/agents/cost-tracker"

export function Topbar() {
  const sessions = useAgentStore((s) => s.sessions)
  const activeProjectName = useProjectStore((s) => s.activeProjectName)

  const sessionValues = Object.values(sessions)
  const activeCount = sessionValues.filter((s) => s.status === "working").length
  const totalTokens = sessionValues.reduce((sum, s) => sum + s.tokensUsed, 0)
  const totalCost = sessionValues.reduce((sum, s) => sum + s.costUsd, 0)

  return (
    <header className="glass-panel flex h-12 items-center justify-between px-6">
      <div className="flex items-center gap-5">
        {activeProjectName && (
          <div className="flex items-center gap-2 rounded-md bg-forge-accent/5 px-2.5 py-1">
            <FolderOpen className="h-3.5 w-3.5 text-forge-accent" />
            <span className="text-xs font-medium text-forge-accent-bright">
              {activeProjectName}
            </span>
          </div>
        )}
        <Metric icon={Bot} label="Active" value={String(activeCount)} color="text-forge-accent" active={activeCount > 0} />
        <Metric icon={Activity} label="Tokens" value={formatTokens(totalTokens)} color="text-forge-success" />
        <Metric icon={DollarSign} label="Cost" value={formatCost(totalCost)} color="text-forge-warning" />
      </div>
    </header>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
  color,
  active,
}: {
  icon: typeof Bot
  label: string
  value: string
  color: string
  active?: boolean
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className={`h-3.5 w-3.5 ${color} ${active ? "drop-shadow-[0_0_4px_rgba(129,140,248,0.5)]" : "opacity-60"}`} />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-medium text-foreground/90">{value}</span>
    </div>
  )
}
