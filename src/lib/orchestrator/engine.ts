import { eventBus } from "./event-bus"
import type { AgentLoopConfig } from "@/lib/agents/agent-loop"

export interface OrchestrationContext {
  projectId: string
  workingDirectory: string
}

/**
 * Core orchestration engine - manages project execution lifecycle.
 * Phase 2: Will handle task decomposition, multi-agent coordination, and workflow execution.
 */
export class OrchestrationEngine {
  private context: OrchestrationContext

  constructor(context: OrchestrationContext) {
    this.context = context
  }

  async start(): Promise<void> {
    eventBus.publish("workflow:started", {
      projectId: this.context.projectId,
    })
  }

  async stop(): Promise<void> {
    eventBus.publish("workflow:completed", {
      projectId: this.context.projectId,
    })
  }
}
