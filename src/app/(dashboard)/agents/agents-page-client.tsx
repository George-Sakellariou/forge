"use client"

import { useEffect } from "react"
import { AgentGrid } from "@/components/agents/agent-grid"
import { useAgentStore } from "@/stores/agent-store"
import type { Agent } from "@/lib/types/agent"

export function AgentsPageClient() {
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
        // Will work once Supabase is configured
      }
    }
    fetchAgents()
  }, [setAgents])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agents</h1>
        <p className="text-sm text-muted-foreground">
          Your AI workforce. Click an agent to start a session.
        </p>
      </div>

      <AgentGrid agents={agents} />
    </div>
  )
}
