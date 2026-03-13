"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, AlertCircle, Database, Bot, Server } from "lucide-react"

interface SystemStatus {
  database: boolean
  agents: number
  apiKey: boolean
}

export default function SettingsPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null)

  useEffect(() => {
    async function checkStatus() {
      try {
        const [agentsRes, statsRes] = await Promise.all([
          fetch("/api/agents"),
          fetch("/api/stats"),
        ])
        const agentsJson = await agentsRes.json()
        const statsJson = await statsRes.json()

        setStatus({
          database: agentsJson.success,
          agents: agentsJson.success ? agentsJson.data.length : 0,
          apiKey: statsJson.success,
        })
      } catch {
        setStatus({ database: false, agents: 0, apiKey: false })
      }
    }
    checkStatus()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          System status and configuration
        </p>
      </div>

      <Card className="border-forge-border">
        <CardContent className="space-y-5 p-6">
          <h2 className="text-lg font-semibold">System Status</h2>

          <div className="space-y-3">
            <StatusRow
              icon={Database}
              label="PostgreSQL"
              ok={status?.database ?? false}
              detail={status?.database ? "Connected" : "Disconnected"}
            />
            <StatusRow
              icon={Bot}
              label="Agents"
              ok={(status?.agents ?? 0) > 0}
              detail={status ? `${status.agents} registered` : "Checking..."}
            />
            <StatusRow
              icon={Server}
              label="Anthropic API"
              ok={status?.apiKey ?? false}
              detail={status?.apiKey ? "Key configured" : "Check .env.local"}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-forge-border">
        <CardContent className="space-y-4 p-6">
          <h2 className="text-lg font-semibold">Configuration</h2>
          <p className="text-sm text-muted-foreground">
            All settings are configured via environment variables in{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">.env.local</code>
          </p>

          <div className="rounded-lg bg-secondary/50 p-4">
            <pre className="font-mono text-xs text-muted-foreground">
{`# .env.local
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://forge:forge_local_dev@127.0.0.1:5432/forge`}
            </pre>
          </div>

          <div className="rounded-lg bg-secondary/50 p-4">
            <h3 className="mb-2 text-sm font-medium">Quick Commands</h3>
            <pre className="font-mono text-xs text-muted-foreground">
{`docker compose up -d          # Start database
docker compose down            # Stop database
./scripts/backup.sh            # Backup database
./scripts/restore.sh           # Restore from backup`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatusRow({
  icon: Icon,
  label,
  ok,
  detail,
}: {
  icon: typeof Database
  label: string
  ok: boolean
  detail: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-forge-border bg-background px-4 py-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">{detail}</span>
      {ok ? (
        <CheckCircle2 className="h-4 w-4 text-forge-success" />
      ) : (
        <AlertCircle className="h-4 w-4 text-forge-warning" />
      )}
    </div>
  )
}
