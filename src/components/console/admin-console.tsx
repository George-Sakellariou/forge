"use client"

import { useState, useCallback } from "react"
import { PromptInput } from "./prompt-input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAgentStore } from "@/stores/agent-store"
import type { Agent } from "@/lib/types/agent"

interface AdminConsoleProps {
  agents: Agent[]
}

interface ConsoleMessage {
  id: string
  agentId: string
  agentName: string
  message: string
  timestamp: string
  status: "sent" | "delivered" | "error"
}

export function AdminConsole({ agents }: AdminConsoleProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>("")
  const [messages, setMessages] = useState<ConsoleMessage[]>([])
  const sessions = useAgentStore((s) => s.sessions)

  const activeAgents = agents.filter((a) => sessions[a.id]?.status === "working")

  const handleSend = useCallback(
    async (message: string) => {
      if (!selectedAgentId) return

      const targetName =
        agents.find((a) => a.id === selectedAgentId)?.name || "Agent"

      const consoleMsg: ConsoleMessage = {
        id: crypto.randomUUID(),
        agentId: selectedAgentId,
        agentName: targetName,
        message,
        timestamp: new Date().toISOString(),
        status: "sent",
      }

      setMessages((prev) => [...prev, consoleMsg])

      try {
        const res = await fetch("/api/agents/instruct", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentId: selectedAgentId, message }),
        })

        if (!res.ok) {
          const json = await res.json().catch(() => ({ error: "Request failed" }))
          const errorMsg: ConsoleMessage = {
            id: crypto.randomUUID(),
            agentId: selectedAgentId,
            agentName: "System",
            message: json.error || `Error ${res.status}`,
            timestamp: new Date().toISOString(),
            status: "error",
          }
          setMessages((prev) => [
            ...prev.map((m) =>
              m.id === consoleMsg.id ? { ...m, status: "error" as const } : m,
            ),
            errorMsg,
          ])
          return
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === consoleMsg.id ? { ...m, status: "delivered" as const } : m,
          ),
        )
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === consoleMsg.id ? { ...m, status: "error" as const } : m,
          ),
        )
      }
    },
    [selectedAgentId, agents],
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Target:</span>
        <Select value={selectedAgentId} onValueChange={(v) => setSelectedAgentId(v ?? "")}>
          <SelectTrigger className="w-48 border-forge-border bg-background">
            <SelectValue placeholder="Select agent..." />
          </SelectTrigger>
          <SelectContent>
            {agents.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                <span className="flex items-center gap-2">
                  {agent.name}
                  {sessions[agent.id]?.status === "working" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-forge-success" />
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {activeAgents.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {activeAgents.length} agent{activeAgents.length !== 1 ? "s" : ""} active
          </span>
        )}
      </div>

      <ScrollArea className="h-40 rounded-lg border border-forge-border bg-background p-3">
        {messages.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Send instructions to running agents from here.
          </p>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="flex items-start gap-2 text-xs"
              >
                <span className="shrink-0 font-mono text-muted-foreground">
                  {new Date(msg.timestamp).toLocaleTimeString("en-US", {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="font-medium text-forge-accent">
                  &rarr; {msg.agentName}:
                </span>
                <span className="flex-1 text-foreground">{msg.message}</span>
                <span
                  className={
                    msg.status === "error"
                      ? "text-forge-error"
                      : msg.status === "delivered"
                        ? "text-forge-success"
                        : "text-forge-muted"
                  }
                >
                  {msg.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <PromptInput
        onSubmit={handleSend}
        placeholder="Send instruction to selected agent..."
        disabled={!selectedAgentId}
      />
    </div>
  )
}
