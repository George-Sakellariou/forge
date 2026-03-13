"use client"

import { useEffect, useRef } from "react"
import { useAgentStore } from "@/stores/agent-store"
import { Wrench, AlertCircle, CheckCircle2, Terminal } from "lucide-react"

interface AgentOutputProps {
  agentId: string
}

export function AgentOutput({ agentId }: AgentOutputProps) {
  const session = useAgentStore((s) => s.sessions[agentId])
  const bottomRef = useRef<HTMLDivElement>(null)

  const output = session?.output || ""
  const events = session?.events || []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [output, events.length])

  const toolEvents = events.filter(
    (e) => e.type === "tool_use_start" || e.type === "tool_result",
  )

  return (
    <div className="glow-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-forge-border bg-card">
      <div className="flex shrink-0 items-center justify-between border-b border-forge-border/50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Output
          </h3>
        </div>
        {session?.isStreaming && (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-forge-success status-pulse" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-forge-success">
              Streaming
            </span>
          </div>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="p-4">
          {!output && toolEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="rounded-xl bg-secondary/30 p-4">
                <Terminal className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Send a message to start the agent.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {output && (
                <div className="terminal-output text-foreground/85">{output}</div>
              )}
              {toolEvents.length > 0 && (
                <div className="mt-4 space-y-1.5 border-t border-forge-border/30 pt-4">
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Tool Activity
                  </h4>
                  {toolEvents.map((event) => {
                    const isToolUse = event.type === "tool_use_start"
                    const isError = (event.data as Record<string, unknown>).isError
                    return (
                      <div
                        key={event.id}
                        className="flex items-start gap-2 rounded-lg bg-secondary/30 px-3 py-2 text-xs"
                      >
                        {isToolUse ? (
                          <Wrench className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
                        ) : isError ? (
                          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-rose-400" />
                        ) : (
                          <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                        )}
                        <div className="flex-1 overflow-hidden">
                          <span className="font-mono font-medium text-foreground/80">
                            {(event.data as Record<string, unknown>).toolName as string}
                          </span>
                          {isToolUse && (event.data as Record<string, unknown>).input ? (
                            <pre className="mt-1 truncate text-muted-foreground/70">
                              {JSON.stringify(
                                (event.data as Record<string, unknown>).input,
                                null,
                                2,
                              ).slice(0, 200)}
                            </pre>
                          ) : null}
                          {!isToolUse && (event.data as Record<string, unknown>).content ? (
                            <pre className="mt-1 max-h-24 overflow-hidden truncate text-muted-foreground/70">
                              {((event.data as Record<string, unknown>).content as string).slice(0, 300)}
                            </pre>
                          ) : null}
                        </div>
                        {!isToolUse && (event.data as Record<string, unknown>).durationMs ? (
                          <span className="shrink-0 font-mono text-[10px] text-muted-foreground/50">
                            {String((event.data as Record<string, unknown>).durationMs)}ms
                          </span>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  )
}
