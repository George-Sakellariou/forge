"use client"

import { useEffect, useState, useCallback } from "react"
import { AgentOutput } from "@/components/agents/agent-output"
import { AgentStatusBadge } from "@/components/agents/agent-status-badge"
import { PromptInput } from "@/components/console/prompt-input"
import { Button } from "@/components/ui/button"
import { useAgentStore } from "@/stores/agent-store"
import { useProjectStore } from "@/stores/project-store"
import { formatCost, formatTokens } from "@/lib/agents/cost-tracker"
import type { Agent } from "@/lib/types/agent"
import { ArrowLeft, RotateCcw, Zap, DollarSign, FolderOpen } from "lucide-react"
import Link from "next/link"
import { v4 as uuidv4 } from "uuid"

interface AgentDetailClientProps {
  agentId: string
}

export function AgentDetailClient({ agentId }: AgentDetailClientProps) {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [workingDir, setWorkingDir] = useState("")
  const [loading, setLoading] = useState(true)
  const activeProjectWorkingDir = useProjectStore((s) => s.activeProjectWorkingDir)
  const activeProjectName = useProjectStore((s) => s.activeProjectName)

  const session = useAgentStore((s) => s.sessions[agentId])
  const appendOutput = useAgentStore((s) => s.appendOutput)
  const addEvent = useAgentStore((s) => s.addEvent)
  const updateSession = useAgentStore((s) => s.updateSession)
  const startStreaming = useAgentStore((s) => s.startStreaming)
  const stopStreaming = useAgentStore((s) => s.stopStreaming)
  const clearSession = useAgentStore((s) => s.clearSession)

  // Pre-fill working directory from active project
  useEffect(() => {
    if (activeProjectWorkingDir && !workingDir) {
      setWorkingDir(activeProjectWorkingDir)
    }
  }, [activeProjectWorkingDir]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    async function fetchAgent() {
      try {
        const res = await fetch(`/api/agents/${agentId}`)
        const json = await res.json()
        if (json.success && json.data) {
          setAgent(json.data)
        }
      } catch {
        // Handle error
      } finally {
        setLoading(false)
      }
    }
    fetchAgent()
  }, [agentId])

  const handleSSEEvent = useCallback(
    (eventType: string, data: Record<string, unknown>) => {
      switch (eventType) {
        case "text_delta":
          appendOutput(agentId, data.text as string)
          break

        case "tool_use_start":
          addEvent(agentId, {
            id: uuidv4(),
            type: "tool_use_start",
            data,
            timestamp: new Date().toISOString(),
          })
          appendOutput(
            agentId,
            `\n[Tool: ${data.toolName}]\n`,
          )
          break

        case "tool_result":
          addEvent(agentId, {
            id: uuidv4(),
            type: "tool_result",
            data,
            timestamp: new Date().toISOString(),
          })
          break

        case "usage":
          updateSession(agentId, {
            tokensUsed:
              ((data.totalInputTokens as number) || 0) +
              ((data.totalOutputTokens as number) || 0),
            costUsd: (data.totalCost as number) || 0,
          })
          break

        case "error":
          appendOutput(agentId, `\nError: ${data.error}\n`)
          updateSession(agentId, { status: "error" })
          break
      }
    },
    [agentId, appendOutput, addEvent, updateSession],
  )

  const handleSend = useCallback(
    async (message: string) => {
      if (!agent) return

      startStreaming(agentId)
      appendOutput(agentId, `\n\n> ${message}\n\n`)

      try {
        const res = await fetch(`/api/agents/${agentId}/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            workingDirectory: workingDir || undefined,
          }),
        })

        if (!res.ok || !res.body) {
          const errorText = await res.text()
          appendOutput(agentId, `Error: ${errorText}\n`)
          stopStreaming(agentId)
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // Parse SSE events from buffer
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          let eventType = ""
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7)
            } else if (line.startsWith("data: ") && eventType) {
              try {
                const data = JSON.parse(line.slice(6))
                handleSSEEvent(eventType, data)
              } catch {
                // Ignore parse errors
              }
              eventType = ""
            }
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        appendOutput(agentId, `\nConnection error: ${message}\n`)
      } finally {
        stopStreaming(agentId)
      }
    },
    [agent, agentId, workingDir, startStreaming, stopStreaming, appendOutput, handleSSEEvent],
  )

  const handleStop = useCallback(async () => {
    try {
      await fetch(`/api/agents/${agentId}/stop`, { method: "POST" })
    } catch {
      // Best effort
    }
    stopStreaming(agentId)
  }, [agentId, stopStreaming])

  const handleClear = useCallback(() => {
    clearSession(agentId)
  }, [agentId, clearSession])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading agent...</p>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Agent not found</p>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/agents">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold">{agent.name}</h1>
              <AgentStatusBadge status={session?.status || "idle"} />
            </div>
            <p className="text-sm text-muted-foreground">
              {agent.role} &middot; {agent.model}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {session && (
            <>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Zap className="h-3.5 w-3.5" />
                <span className="font-mono">
                  {formatTokens(session.tokensUsed)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5" />
                <span className="font-mono">
                  {formatCost(session.costUsd)}
                </span>
              </div>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="border-forge-border"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
      </div>

      {/* Working directory input */}
      <div className="flex items-center gap-2 rounded-lg border border-forge-border/50 bg-secondary/20 px-3 py-2">
        <FolderOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <label className="shrink-0 text-xs text-muted-foreground">
          {activeProjectName ? `${activeProjectName}:` : "Working Dir:"}
        </label>
        <input
          type="text"
          value={workingDir}
          onChange={(e) => setWorkingDir(e.target.value)}
          placeholder="~/Projects/my-project"
          className="flex-1 rounded border-none bg-transparent px-1 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>

      {/* Output area */}
      <AgentOutput agentId={agentId} />

      {/* Input */}
      <PromptInput
        onSubmit={handleSend}
        onStop={handleStop}
        isStreaming={session?.isStreaming}
        placeholder={`Instruct ${agent.name}...`}
      />
    </div>
  )
}
