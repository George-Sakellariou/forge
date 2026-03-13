import { sessionManager } from "@/lib/agents/session-manager"
import { runAgentLoop, type AgentLoopEvent } from "@/lib/agents/agent-loop"
import { createAgentLoopConfig } from "@/lib/agents/agent-factory"
import { eventBus } from "./event-bus"
import type { Agent } from "@/lib/types/agent"

const DEFAULT_MAX_CONCURRENT = 5

export interface AgentRunRequest {
  agent: Agent
  message: string
  workingDirectory: string
  projectId?: string
  taskId?: string
  onEvent?: (event: AgentLoopEvent) => void
}

export class AgentPool {
  private maxConcurrent: number
  private queue: AgentRunRequest[] = []
  private running = new Set<string>()

  constructor(maxConcurrent = DEFAULT_MAX_CONCURRENT) {
    this.maxConcurrent = maxConcurrent
  }

  get activeCount(): number {
    return this.running.size
  }

  get queuedCount(): number {
    return this.queue.length
  }

  canStartAgent(): boolean {
    return this.running.size < this.maxConcurrent
  }

  async runAgent(request: AgentRunRequest): Promise<void> {
    const { agent } = request

    // Prevent duplicate runs of the same agent
    if (this.running.has(agent.id)) {
      eventBus.publish("agent:error", {
        agentName: agent.name,
        error: "Agent is already running. Stop it first before starting a new run.",
      }, { agentId: agent.id, projectId: request.projectId })
      return
    }

    if (!this.canStartAgent()) {
      // Queue the request
      this.queue.push(request)
      eventBus.publish("agent:started", {
        agentName: agent.name,
        queued: true,
        queuePosition: this.queue.length,
      }, { agentId: agent.id, projectId: request.projectId })
      return
    }

    await this.executeAgent(request)
  }

  private async executeAgent(request: AgentRunRequest): Promise<void> {
    const { agent, message, workingDirectory, projectId, taskId, onEvent } = request

    this.running.add(agent.id)
    sessionManager.createSession(agent.id, projectId, workingDirectory)
    sessionManager.setStatus(agent.id, "working")

    const config = createAgentLoopConfig(agent, {
      workingDirectory,
      projectId,
    })

    eventBus.publish("agent:started", {
      agentName: agent.name,
      message: message.slice(0, 200),
      taskId,
    }, { agentId: agent.id, projectId })

    const abortController = sessionManager.getAbortController(agent.id)

    try {
      await runAgentLoop(config, message, (event) => {
        onEvent?.(event)

        // Track usage in session
        if (event.type === "usage") {
          sessionManager.updateSession(agent.id, {
            tokensUsed:
              ((event.data.totalInputTokens as number) || 0) +
              ((event.data.totalOutputTokens as number) || 0),
            costUsd: (event.data.totalCost as number) || 0,
          })
        }

        // Forward key events to event bus
        if (event.type === "tool_use_start") {
          eventBus.publish("agent:tool_use", {
            agentName: agent.name,
            ...event.data,
          }, { agentId: agent.id, projectId, taskId })
        } else if (event.type === "error") {
          eventBus.publish("agent:error", {
            agentName: agent.name,
            ...event.data,
          }, { agentId: agent.id, projectId, taskId })
        }
      }, abortController.signal)

      sessionManager.setStatus(agent.id, "idle")
      eventBus.publish("agent:completed", { agentName: agent.name, taskId }, {
        agentId: agent.id,
        projectId,
        taskId,
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      sessionManager.setStatus(agent.id, "error")
      eventBus.publish("agent:error", {
        agentName: agent.name,
        error: errorMsg,
        taskId,
      }, { agentId: agent.id, projectId, taskId })
    } finally {
      this.running.delete(agent.id)
      this.processQueue()
    }
  }

  private processQueue(): void {
    while (this.canStartAgent() && this.queue.length > 0) {
      const next = this.queue.shift()
      if (next) {
        this.executeAgent(next)
      }
    }
  }

  stopAgent(agentId: string): void {
    sessionManager.stopAgent(agentId)
    this.running.delete(agentId)
    // Remove from queue if queued
    this.queue = this.queue.filter((r) => r.agent.id !== agentId)
    this.processQueue()
  }

  stopAll(): void {
    for (const agentId of this.running) {
      sessionManager.stopAgent(agentId)
    }
    this.running.clear()
    this.queue = []
  }

  getStatus() {
    return {
      active: this.activeCount,
      queued: this.queuedCount,
      maxConcurrent: this.maxConcurrent,
      runningAgentIds: Array.from(this.running),
    }
  }
}

export const agentPool = new AgentPool()
