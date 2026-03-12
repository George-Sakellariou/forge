"use client"

import { Bot, Activity, DollarSign } from "lucide-react"
import { useAgentStore } from "@/stores/agent-store"
import { formatCost, formatTokens } from "@/lib/agents/cost-tracker"

export function Topbar() {
  const sessions = useAgentStore((s) => s.sessions)

  const sessionValues = Object.values(sessions)
  const activeCount = sessionValues.filter((s) => s.status === "working").length
  const totalTokens = sessionValues.reduce((sum, s) => sum + s.tokensUsed, 0)
  const totalCost = sessionValues.reduce((sum, s) => sum + s.costUsd, 0)

  return (
    <header className="flex h-14 items-center justify-between border-b border-forge-border bg-card px-6">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-sm">
          <Bot className="h-4 w-4 text-forge-accent" />
          <span className="text-muted-foreground">Active:</span>
          <span className="font-mono font-medium text-foreground">
            {activeCount}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4 text-forge-success" />
          <span className="text-muted-foreground">Tokens:</span>
          <span className="font-mono font-medium text-foreground">
            {formatTokens(totalTokens)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="h-4 w-4 text-forge-warning" />
          <span className="text-muted-foreground">Cost:</span>
          <span className="font-mono font-medium text-foreground">
            {formatCost(totalCost)}
          </span>
        </div>
      </div>
    </header>
  )
}
