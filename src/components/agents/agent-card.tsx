"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
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

const roleColors: Record<string, string> = {
  architect: "#8b5cf6",
  lead: "#f59e0b",
  backend: "#3b82f6",
  frontend: "#ec4899",
  tester: "#22c55e",
  e2e: "#14b8a6",
  security: "#ef4444",
  devops: "#f97316",
}

interface AgentCardProps {
  agent: Agent
}

export function AgentCard({ agent }: AgentCardProps) {
  const session = useAgentStore((s) => s.sessions[agent.id])

  const Icon = roleIcons[agent.role] || Bot
  const color = roleColors[agent.role] || "#6366f1"
  const status = session?.status || "idle"

  return (
    <Link href={`/agents/${agent.id}`}>
      <Card className="border-forge-border bg-card transition-colors hover:border-forge-accent/30 hover:bg-secondary/30">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${color}15` }}
              >
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
              <div>
                <h3 className="font-medium text-foreground">{agent.name}</h3>
                <p className="text-xs capitalize text-muted-foreground">
                  {agent.role} &middot; {agent.model.split("-").slice(1, 3).join(" ")}
                </p>
              </div>
            </div>
            <AgentStatusBadge status={status} />
          </div>

          {session && session.status !== "idle" && (
            <div className="mt-3 flex items-center gap-4 border-t border-forge-border pt-3 text-xs text-muted-foreground">
              <span>
                Tokens: <span className="font-mono text-foreground">{formatTokens(session.tokensUsed)}</span>
              </span>
              <span>
                Cost: <span className="font-mono text-foreground">{formatCost(session.costUsd)}</span>
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
