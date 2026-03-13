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
      <div className="animate-fade-up">
        <h1 className="gradient-text text-2xl font-bold tracking-tight">
          Command Center
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Monitor and direct your AI workforce in real-time
        </p>
      </div>

      <StatsCards />

      <div>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Agent Fleet
        </h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-forge-accent" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-forge-error/20 py-12">
            <AlertCircle className="h-4 w-4 text-forge-error" />
            <p className="text-xs text-forge-error">{error}</p>
          </div>
        ) : (
          <AgentGrid agents={agents} />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ActivityFeed />

        <div className="glow-card flex flex-col rounded-xl border border-forge-border bg-card p-4">
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Admin Console
          </h3>
          <AdminConsole agents={agents} />
        </div>
      </div>
    </div>
  )
}
