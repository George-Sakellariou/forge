"use client"

import { useEffect } from "react"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { AgentGrid } from "@/components/agents/agent-grid"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { AdminConsole } from "@/components/console/admin-console"
import { useAgentStore } from "@/stores/agent-store"
import type { Agent } from "@/lib/types/agent"

export function DashboardClient() {
  const agents = useAgentStore((s) => s.agents)
  const setAgents = useAgentStore((s) => s.setAgents)

  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await fetch("/api/agents")
        const json = await res.json()
        if (json.success && json.data) {
          setAgents(json.data as Agent[])
        }
      } catch {
        // Agents will be empty until Supabase is set up
      }
    }
    fetchAgents()
  }, [setAgents])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Monitor your AI workforce in real-time
        </p>
      </div>

      <StatsCards />

      <div>
        <h2 className="mb-4 text-lg font-semibold">Agents</h2>
        <AgentGrid agents={agents} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ActivityFeed />

        <div className="flex flex-col rounded-lg border border-forge-border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium">Admin Console</h3>
          <AdminConsole agents={agents} />
        </div>
      </div>
    </div>
  )
}
