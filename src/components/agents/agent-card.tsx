"use client"

import Link from "next/link"
import { AgentStatusBadge } from "./agent-status-badge"
import { useAgentStore } from "@/stores/agent-store"
import { formatCost, formatTokens } from "@/lib/agents/cost-tracker"
import type { Agent } from "@/lib/types/agent"
import {
  Building2,
  Crown,
  Server,
  Palette,
  TestTubes,
  MonitorCheck,
  ShieldCheck,
  Container,
  Bot,
} from "lucide-react"
import { cn } from "@/lib/utils"

const roleIcons: Record<string, typeof Bot> = {
  architect: Building2,
  lead: Crown,
  backend: Server,
  frontend: Palette,
  tester: TestTubes,
  e2e: MonitorCheck,
  security: ShieldCheck,
  devops: Container,
}

const roleThemes: Record<string, { color: string; gradient: string; glow: string }> = {
  architect: { color: "#a78bfa", gradient: "from-violet-500/15 to-purple-600/15", glow: "hover:shadow-violet-500/10" },
  lead: { color: "#fbbf24", gradient: "from-amber-500/15 to-yellow-600/15", glow: "hover:shadow-amber-500/10" },
  backend: { color: "#60a5fa", gradient: "from-blue-500/15 to-cyan-600/15", glow: "hover:shadow-blue-500/10" },
  frontend: { color: "#f472b6", gradient: "from-pink-500/15 to-rose-600/15", glow: "hover:shadow-pink-500/10" },
  tester: { color: "#34d399", gradient: "from-emerald-500/15 to-green-600/15", glow: "hover:shadow-emerald-500/10" },
  e2e: { color: "#2dd4bf", gradient: "from-teal-500/15 to-cyan-600/15", glow: "hover:shadow-teal-500/10" },
  security: { color: "#f87171", gradient: "from-red-500/15 to-orange-600/15", glow: "hover:shadow-red-500/10" },
  devops: { color: "#fb923c", gradient: "from-orange-500/15 to-amber-600/15", glow: "hover:shadow-orange-500/10" },
}

interface AgentCardProps {
  agent: Agent
}

export function AgentCard({ agent }: AgentCardProps) {
  const session = useAgentStore((s) => s.sessions[agent.id])

  const Icon = roleIcons[agent.role] || Bot
  const theme = roleThemes[agent.role] || { color: "#818cf8", gradient: "from-indigo-500/15 to-purple-600/15", glow: "hover:shadow-indigo-500/10" }
  const status = session?.status || "idle"
  const isWorking = status === "working"

  return (
    <Link href={`/agents/${agent.id}`}>
      <div
        className={cn(
          "glow-card relative overflow-hidden rounded-xl border border-forge-border bg-card p-4 transition-all duration-300",
          theme.glow,
          isWorking && "border-forge-accent/20 accent-glow",
        )}
      >
        {/* Subtle gradient overlay at top */}
        <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-16 rounded-t-xl bg-gradient-to-b opacity-50", theme.gradient)} />

        {/* Scan line for working agents */}
        {isWorking && <div className="scan-line" />}

        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg", theme.gradient)}
              style={{ boxShadow: `0 4px 12px ${theme.color}15` }}
            >
              <Icon className="h-5 w-5" style={{ color: theme.color }} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{agent.name}</h3>
              <p className="text-[11px] text-muted-foreground">
                <span className="capitalize">{agent.role}</span>
                <span className="mx-1.5 text-forge-border">&middot;</span>
                <span className="font-mono">{agent.model.includes("opus") ? "Opus" : "Sonnet"}</span>
              </p>
            </div>
          </div>
          <AgentStatusBadge status={status} />
        </div>

        {session && session.status !== "idle" && (
          <div className="relative mt-3 flex items-center gap-4 border-t border-forge-border/50 pt-3 text-[11px] text-muted-foreground">
            <span>
              Tokens: <span className="font-mono text-foreground/80">{formatTokens(session.tokensUsed)}</span>
            </span>
            <span>
              Cost: <span className="font-mono text-foreground/80">{formatCost(session.costUsd)}</span>
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}
