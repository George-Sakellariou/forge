"use client"

import { Bot, ListChecks, DollarSign, Zap } from "lucide-react"
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
      gradient: "from-indigo-500/20 to-purple-500/20",
      iconColor: "text-indigo-400",
      glowColor: "shadow-indigo-500/10",
    },
    {
      label: "Sessions",
      value: String(sessionValues.length),
      icon: ListChecks,
      gradient: "from-emerald-500/20 to-teal-500/20",
      iconColor: "text-emerald-400",
      glowColor: "shadow-emerald-500/10",
    },
    {
      label: "Tokens Used",
      value: formatTokens(totalTokens),
      icon: Zap,
      gradient: "from-amber-500/20 to-orange-500/20",
      iconColor: "text-amber-400",
      glowColor: "shadow-amber-500/10",
    },
    {
      label: "Total Cost",
      value: formatCost(totalCost),
      icon: DollarSign,
      gradient: "from-rose-500/20 to-pink-500/20",
      iconColor: "text-rose-400",
      glowColor: "shadow-rose-500/10",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="animate-fade-up glow-card rounded-xl border border-forge-border bg-card p-4"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="flex items-center gap-3">
            <div className={`rounded-lg bg-gradient-to-br ${stat.gradient} p-2.5 shadow-lg ${stat.glowColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
