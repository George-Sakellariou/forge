"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, AlertCircle } from "lucide-react"

export default function SettingsPage() {
  const [supabaseUrl, setSupabaseUrl] = useState("")
  const [supabaseKey, setSupabaseKey] = useState("")
  const [anthropicKey, setAnthropicKey] = useState("")
  const [saved, setSaved] = useState(false)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure API keys and preferences
        </p>
      </div>

      <Card className="border-forge-border">
        <CardContent className="space-y-6 p-6">
          <div>
            <h2 className="text-lg font-semibold">Environment Setup</h2>
            <p className="text-sm text-muted-foreground">
              These values should be set in your <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">.env.local</code> file.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Anthropic API Key</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="password"
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="border-forge-border bg-background font-mono text-sm"
                />
                {process.env.NEXT_PUBLIC_HAS_ANTHROPIC_KEY === "true" ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-forge-success" />
                ) : (
                  <AlertCircle className="h-5 w-5 shrink-0 text-forge-warning" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Set <code>ANTHROPIC_API_KEY</code> in .env.local
              </p>
            </div>

            <div className="space-y-2">
              <Label>Supabase URL</Label>
              <Input
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xxx.supabase.co"
                className="border-forge-border bg-background font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Set <code>NEXT_PUBLIC_SUPABASE_URL</code> in .env.local
              </p>
            </div>

            <div className="space-y-2">
              <Label>Supabase Anon Key</Label>
              <Input
                type="password"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                placeholder="eyJ..."
                className="border-forge-border bg-background font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Set <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in .env.local
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-secondary/50 p-4">
            <h3 className="text-sm font-medium">Quick Setup</h3>
            <pre className="mt-2 font-mono text-xs text-muted-foreground">
{`# .env.local
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
