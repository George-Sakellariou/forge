"use client"

import { Bot, ListChecks, DollarSign, Zap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useAgentStore } from "@/stores/agent-store"
import { formatCost, formatTokens } from "@/lib/agents/cost-tracker"

export function StatsCards() {
  const sessions = useAgentStore((s) => s.sessions)

  const sessionValues = Object.values(sessions)
  const activeCount = sessionValues.filter((s) => s.status === "working").length
  const totalTokens = sessionValues.reduce((sum, s) => sum + s.tokensUsed, 0)
  const totalCost = sessionValues.reduce((sum, s) => sum + s.costUsd, 0)

  const stats = [
    {
      label: "Active Agents",
      value: String(activeCount),
      icon: Bot,
      color: "text-forge-accent",
      bgColor: "bg-forge-accent/10",
    },
    {
      label: "Sessions",
      value: String(sessionValues.length),
      icon: ListChecks,
      color: "text-forge-success",
      bgColor: "bg-forge-success/10",
    },
    {
      label: "Tokens Used",
      value: formatTokens(totalTokens),
      icon: Zap,
      color: "text-forge-warning",
      bgColor: "bg-forge-warning/10",
    },
    {
      label: "Total Cost",
      value: formatCost(totalCost),
      icon: DollarSign,
      color: "text-forge-error",
      bgColor: "bg-forge-error/10",
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-forge-border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className={`rounded-lg p-2.5 ${stat.bgColor}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
