"use client"

import { useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAgentStore } from "@/stores/agent-store"
import { Wrench, AlertCircle, CheckCircle2 } from "lucide-react"

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
    <div className="flex flex-1 flex-col rounded-lg border border-forge-border bg-background">
      <div className="flex items-center justify-between border-b border-forge-border px-4 py-2">
        <h3 className="text-sm font-medium">Output</h3>
        {session?.isStreaming && (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-forge-success status-pulse" />
            <span className="text-xs text-forge-success">Streaming</span>
          </div>
        )}
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4">
          {!output && toolEvents.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Send a message to start the agent.
            </p>
          ) : (
            <div className="space-y-2">
              {/* Interleave text and tool events */}
              {output && (
                <div className="terminal-output text-foreground/90">{output}</div>
              )}
              {toolEvents.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-forge-border pt-4">
                  <h4 className="text-xs font-medium text-muted-foreground">
                    Tool Activity
                  </h4>
                  {toolEvents.map((event) => {
                    const isToolUse = event.type === "tool_use_start"
                    const isError = (event.data as Record<string, unknown>).isError
                    return (
                      <div
                        key={event.id}
                        className="flex items-start gap-2 rounded-md bg-secondary/50 px-3 py-2 text-xs"
                      >
                        {isToolUse ? (
                          <Wrench className="mt-0.5 h-3 w-3 shrink-0 text-forge-warning" />
                        ) : isError ? (
                          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-forge-error" />
                        ) : (
                          <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-forge-success" />
                        )}
                        <div className="flex-1 overflow-hidden">
                          <span className="font-mono font-medium text-foreground">
                            {(event.data as Record<string, unknown>).toolName as string}
                          </span>
                          {isToolUse && (event.data as Record<string, unknown>).input ? (
                            <pre className="mt-1 truncate text-muted-foreground">
                              {JSON.stringify(
                                (event.data as Record<string, unknown>).input,
                                null,
                                2,
                              ).slice(0, 200)}
                            </pre>
                          ) : null}
                          {!isToolUse && (event.data as Record<string, unknown>).content ? (
                            <pre className="mt-1 max-h-24 overflow-hidden truncate text-muted-foreground">
                              {((event.data as Record<string, unknown>).content as string).slice(0, 300)}
                            </pre>
                          ) : null}
                        </div>
                        {!isToolUse && (event.data as Record<string, unknown>).durationMs ? (
                          <span className="shrink-0 text-muted-foreground">
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
      </ScrollArea>
    </div>
  )
}
