"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AgentGrid } from "@/components/agents/agent-grid"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { AdminConsole } from "@/components/console/admin-console"
import { useAgentStore } from "@/stores/agent-store"
import type { Agent } from "@/lib/types/agent"
import type { Project } from "@/lib/types/project"
import { FolderOpen, GitBranch } from "lucide-react"
import Link from "next/link"

export default function ProjectWorkspacePage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const agents = useAgentStore((s) => s.agents)
  const setAgents = useAgentStore((s) => s.setAgents)

  useEffect(() => {
    async function load() {
      try {
        const [agentsRes] = await Promise.all([
          fetch("/api/agents"),
        ])
        const agentsJson = await agentsRes.json()
        if (agentsJson.success) setAgents(agentsJson.data)
      } catch {
        // Handle error
      }
    }
    load()
  }, [projectId, setAgents])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {project?.name || "Project Workspace"}
          </h1>
          {project?.workingDirectory && (
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <FolderOpen className="h-3.5 w-3.5" />
              <span className="font-mono">{project.workingDirectory}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/projects/${projectId}/workflow`}>
            <Button variant="outline" size="sm" className="border-forge-border">
              <GitBranch className="mr-1.5 h-3.5 w-3.5" />
              Workflows
            </Button>
          </Link>
        </div>
      </div>

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
