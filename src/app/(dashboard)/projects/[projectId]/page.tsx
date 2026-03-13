"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AgentGrid } from "@/components/agents/agent-grid"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { AdminConsole } from "@/components/console/admin-console"
import { useAgentStore } from "@/stores/agent-store"
import { useProjectStore } from "@/stores/project-store"
import type { Project } from "@/lib/types/project"
import {
  FolderOpen,
  GitBranch,
  Loader2,
  AlertCircle,
  Zap,
  DollarSign,
  ListChecks,
  Activity,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"
import { formatCost, formatTokens } from "@/lib/agents/cost-tracker"
import { formatRelativeTime } from "@/lib/utils/format"

interface ProjectStats {
  tasks: Record<string, number>
  tokens: number
  costUsd: number
  eventCounts: Record<string, number>
  recentEvents: Array<{
    id: string
    type: string
    payload: Record<string, unknown>
    agentId: string | null
    createdAt: string
  }>
}

export default function ProjectWorkspacePage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [stats, setStats] = useState<ProjectStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const agents = useAgentStore((s) => s.agents)
  const setAgents = useAgentStore((s) => s.setAgents)
  const setActiveProject = useProjectStore((s) => s.setActiveProject)

  const loadData = useCallback(async () => {
    try {
      const [projectsRes, agentsRes, statsRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/agents"),
        fetch(`/api/projects/${projectId}/stats`),
      ])
      const projectsJson = await projectsRes.json()
      const agentsJson = await agentsRes.json()
      const statsJson = await statsRes.json()

      if (agentsJson.success) setAgents(agentsJson.data)
      if (statsJson.success) setStats(statsJson.data)

      if (projectsJson.success) {
        const found = projectsJson.data.find(
          (p: Project) => p.id === projectId,
        )
        if (found) {
          setProject(found)
          setActiveProject(found.id, found.name, found.workingDirectory)
        } else {
          setError("Project not found")
        }
      }
    } catch {
      setError("Failed to load project")
    } finally {
      setLoading(false)
    }
  }, [projectId, setAgents, setActiveProject])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Auto-refresh stats every 15s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/stats`)
        const json = await res.json()
        if (json.success) setStats(json.data)
      } catch {
        // Non-critical
      }
    }, 15000)
    return () => clearInterval(interval)
  }, [projectId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-forge-accent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-6 w-6 text-forge-error" />
        <p className="mt-2 text-sm text-forge-error">{error}</p>
      </div>
    )
  }

  const totalTasks = stats
    ? Object.values(stats.tasks).reduce((a, b) => a + b, 0)
    : 0
  const totalEvents = stats
    ? Object.values(stats.eventCounts).reduce((a, b) => a + b, 0)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="gradient-text text-2xl font-bold tracking-tight">
              {project?.name || "Project"}
            </h1>
            <span className="rounded-full border border-forge-border bg-secondary/50 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {project?.status}
            </span>
          </div>
          {project?.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {project.description}
            </p>
          )}
          {project?.workingDirectory && (
            <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
              <FolderOpen className="h-3 w-3" />
              <span className="font-mono">{project.workingDirectory}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="border-forge-border"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>
          <Link href={`/projects/${projectId}/workflow`}>
            <Button variant="outline" size="sm" className="border-forge-border">
              <GitBranch className="mr-1.5 h-3.5 w-3.5" />
              Workflows
            </Button>
          </Link>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard
          icon={ListChecks}
          label="Tasks"
          value={String(totalTasks)}
          detail={totalTasks > 0 ? `${stats?.tasks.completed || 0} done, ${stats?.tasks.running || 0} running` : "No tasks yet"}
          gradient="from-indigo-500/20 to-purple-500/20"
          iconColor="text-indigo-400"
        />
        <MetricCard
          icon={Zap}
          label="Tokens"
          value={formatTokens(stats?.tokens || 0)}
          detail="Consumed by agents"
          gradient="from-amber-500/20 to-orange-500/20"
          iconColor="text-amber-400"
        />
        <MetricCard
          icon={DollarSign}
          label="Cost"
          value={formatCost(stats?.costUsd || 0)}
          detail="Total API spend"
          gradient="from-rose-500/20 to-pink-500/20"
          iconColor="text-rose-400"
        />
        <MetricCard
          icon={Activity}
          label="Events"
          value={String(totalEvents)}
          detail={totalEvents > 0 ? `${stats?.recentEvents.length || 0} recent` : "No activity yet"}
          gradient="from-emerald-500/20 to-teal-500/20"
          iconColor="text-emerald-400"
        />
      </div>

      {/* Agent Fleet */}
      <div>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Agent Fleet
        </h2>
        <AgentGrid agents={agents} />
      </div>

      {/* Activity + Console */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <ActivityFeed projectId={projectId} />
        </div>
        <div className="glow-card flex flex-col rounded-xl border border-forge-border bg-card p-4">
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Admin Console
          </h3>
          <AdminConsole agents={agents} />
        </div>
      </div>

      {/* Recent Activity Log */}
      {stats && stats.recentEvents.length > 0 && (
        <div className="glow-card rounded-xl border border-forge-border bg-card">
          <div className="border-b border-forge-border/50 px-4 py-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Project Event Log
            </h3>
          </div>
          <div className="max-h-60 overflow-y-auto">
            <div className="divide-y divide-forge-border/20">
              {stats.recentEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-3 px-4 py-2 text-xs">
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${getEventDotColor(event.type)}`} />
                  <span className="flex-1 text-foreground/70">
                    {formatEventType(event.type)}
                    {event.payload.agentName && (
                      <span className="ml-1 font-medium text-foreground/90">
                        {event.payload.agentName as string}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground/50">
                    {formatRelativeTime(event.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  gradient,
  iconColor,
}: {
  icon: typeof Zap
  label: string
  value: string
  detail: string
  gradient: string
  iconColor: string
}) {
  return (
    <div className="glow-card rounded-xl border border-forge-border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg bg-gradient-to-br ${gradient} p-2.5`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <p className="text-lg font-bold tracking-tight">{value}</p>
          <p className="text-[11px] text-muted-foreground">{label}</p>
        </div>
      </div>
      <p className="mt-2 truncate text-[10px] text-muted-foreground/60">{detail}</p>
    </div>
  )
}

function getEventDotColor(type: string): string {
  if (type.includes("error") || type.includes("failed")) return "bg-rose-400"
  if (type.includes("completed") || type.includes("complete")) return "bg-emerald-400"
  if (type.includes("started")) return "bg-indigo-400"
  if (type.includes("tool")) return "bg-amber-400"
  return "bg-slate-500"
}

function formatEventType(type: string): string {
  return type.replace(/[_:]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}
