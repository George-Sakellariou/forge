"use client"

import { Card, CardContent } from "@/components/ui/card"
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
  CheckCircle2,
  Loader2,
  Circle,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { WorkflowStep } from "@/lib/types/workflow"

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

const statusConfig = {
  pending: { icon: Circle, color: "text-forge-muted", border: "border-forge-border" },
  running: { icon: Loader2, color: "text-forge-accent", border: "border-forge-accent" },
  completed: { icon: CheckCircle2, color: "text-forge-success", border: "border-forge-success" },
  failed: { icon: AlertCircle, color: "text-forge-error", border: "border-forge-error" },
}

interface WorkflowNodeProps {
  step: WorkflowStep
  status: "pending" | "running" | "completed" | "failed"
  index: number
}

export function WorkflowNode({ step, status, index }: WorkflowNodeProps) {
  const Icon = roleIcons[step.agentRole] || Bot
  const config = statusConfig[status]
  const StatusIcon = config.icon

  return (
    <Card className={cn("border-2 bg-card transition-colors", config.border)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground">
                #{index + 1}
              </span>
              <h4 className="text-sm font-medium">{step.action}</h4>
              <StatusIcon
                className={cn(
                  "ml-auto h-4 w-4",
                  config.color,
                  status === "running" && "animate-spin",
                )}
              />
            </div>
            <p className="mt-1 text-xs capitalize text-muted-foreground">
              {step.agentRole}
            </p>
            <p className="mt-2 line-clamp-2 text-xs text-foreground/60">
              {step.prompt.slice(0, 120)}...
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
