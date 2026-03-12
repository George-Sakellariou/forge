import { create } from "zustand"
import type { Agent, AgentStatus } from "@/lib/types/agent"

interface AgentStreamEvent {
  id: string
  type: string
  data: Record<string, unknown>
  timestamp: string
}

interface AgentSessionState {
  status: AgentStatus
  output: string
  events: AgentStreamEvent[]
  tokensUsed: number
  costUsd: number
  isStreaming: boolean
}

interface AgentStore {
  agents: Agent[]
  sessions: Record<string, AgentSessionState>
  selectedAgentId: string | null

  setAgents: (agents: Agent[]) => void
  setSelectedAgent: (id: string | null) => void
  updateSession: (agentId: string, updates: Partial<AgentSessionState>) => void
  appendOutput: (agentId: string, text: string) => void
  addEvent: (agentId: string, event: AgentStreamEvent) => void
  clearSession: (agentId: string) => void
  startStreaming: (agentId: string) => void
  stopStreaming: (agentId: string) => void
}

const defaultSession: AgentSessionState = {
  status: "idle",
  output: "",
  events: [],
  tokensUsed: 0,
  costUsd: 0,
  isStreaming: false,
}

export const useAgentStore = create<AgentStore>((set) => ({
  agents: [],
  sessions: {},
  selectedAgentId: null,

  setAgents: (agents) => set({ agents }),

  setSelectedAgent: (id) => set({ selectedAgentId: id }),

  updateSession: (agentId, updates) =>
    set((state) => ({
      sessions: {
        ...state.sessions,
        [agentId]: {
          ...(state.sessions[agentId] || defaultSession),
          ...updates,
        },
      },
    })),

  appendOutput: (agentId, text) =>
    set((state) => {
      const session = state.sessions[agentId] || defaultSession
      return {
        sessions: {
          ...state.sessions,
          [agentId]: { ...session, output: session.output + text },
        },
      }
    }),

  addEvent: (agentId, event) =>
    set((state) => {
      const session = state.sessions[agentId] || defaultSession
      return {
        sessions: {
          ...state.sessions,
          [agentId]: {
            ...session,
            events: [...session.events.slice(-200), event],
          },
        },
      }
    }),

  clearSession: (agentId) =>
    set((state) => ({
      sessions: {
        ...state.sessions,
        [agentId]: { ...defaultSession },
      },
    })),

  startStreaming: (agentId) =>
    set((state) => ({
      sessions: {
        ...state.sessions,
        [agentId]: {
          ...(state.sessions[agentId] || defaultSession),
          isStreaming: true,
          status: "working",
        },
      },
    })),

  stopStreaming: (agentId) =>
    set((state) => ({
      sessions: {
        ...state.sessions,
        [agentId]: {
          ...(state.sessions[agentId] || defaultSession),
          isStreaming: false,
          status: "idle",
        },
      },
    })),
}))
