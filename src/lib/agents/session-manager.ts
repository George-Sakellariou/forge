import type { AgentSession, AgentStatus } from "@/lib/types/agent"

type SessionEventHandler = (agentId: string, session: AgentSession) => void

class SessionManager {
  private sessions = new Map<string, AgentSession>()
  private abortControllers = new Map<string, AbortController>()
  private listeners = new Set<SessionEventHandler>()
  private pendingMessages = new Map<string, string[]>()

  /** Queue a message to be injected into the agent's next turn */
  queueMessage(agentId: string, message: string): void {
    const queue = this.pendingMessages.get(agentId) || []
    queue.push(message)
    this.pendingMessages.set(agentId, queue)
  }

  /** Drain all pending messages for an agent (returns empty array if none) */
  drainMessages(agentId: string): string[] {
    const queue = this.pendingMessages.get(agentId) || []
    this.pendingMessages.delete(agentId)
    return queue
  }

  createSession(agentId: string, projectId?: string, workingDirectory?: string): AgentSession {
    const session: AgentSession = {
      agentId,
      projectId,
      status: "idle",
      messages: [],
      tokensUsed: 0,
      costUsd: 0,
      startedAt: new Date().toISOString(),
      workingDirectory,
    }
    this.sessions.set(agentId, session)
    this.notify(agentId, session)
    return session
  }

  getSession(agentId: string): AgentSession | undefined {
    return this.sessions.get(agentId)
  }

  getAllSessions(): AgentSession[] {
    return Array.from(this.sessions.values())
  }

  updateSession(agentId: string, updates: Partial<AgentSession>): AgentSession | undefined {
    const session = this.sessions.get(agentId)
    if (!session) return undefined

    const updated: AgentSession = { ...session, ...updates }
    this.sessions.set(agentId, updated)
    this.notify(agentId, updated)
    return updated
  }

  setStatus(agentId: string, status: AgentStatus): void {
    this.updateSession(agentId, { status })
  }

  getAbortController(agentId: string): AbortController {
    let controller = this.abortControllers.get(agentId)
    if (!controller || controller.signal.aborted) {
      controller = new AbortController()
      this.abortControllers.set(agentId, controller)
    }
    return controller
  }

  stopAgent(agentId: string): void {
    const controller = this.abortControllers.get(agentId)
    if (controller) {
      controller.abort()
      this.abortControllers.delete(agentId)
    }
    this.setStatus(agentId, "stopped")
  }

  removeSession(agentId: string): void {
    this.stopAgent(agentId)
    this.sessions.delete(agentId)
  }

  subscribe(handler: SessionEventHandler): () => void {
    this.listeners.add(handler)
    return () => this.listeners.delete(handler)
  }

  private notify(agentId: string, session: AgentSession): void {
    for (const listener of this.listeners) {
      listener(agentId, session)
    }
  }
}

// Singleton for the process
export const sessionManager = new SessionManager()
