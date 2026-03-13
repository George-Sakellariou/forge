"use client"

import { useEffect, useState } from "react"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { AgentGrid } from "@/components/agents/agent-grid"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { AdminConsole } from "@/components/console/admin-console"
import { useAgentStore } from "@/stores/agent-store"
import type { Agent } from "@/lib/types/agent"
import { AlertCircle, Loader2 } from "lucide-react"

export function DashboardClient() {
  const agents = useAgentStore((s) => s.agents)
  const setAgents = useAgentStore((s) => s.setAgents)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await fetch("/api/agents")
        const json = await res.json()
        if (json.success && json.data) {
          setAgents(json.data as Agent[])
        } else {
          setError("Failed to load agents")
        }
      } catch {
        setError("Cannot connect to server. Is the database running?")
      } finally {
        setLoading(false)
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
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-forge-accent" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-forge-error/30 py-12">
            <AlertCircle className="h-5 w-5 text-forge-error" />
            <p className="text-sm text-forge-error">{error}</p>
          </div>
        ) : (
          <AgentGrid agents={agents} />
        )}
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
