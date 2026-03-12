import { create } from "zustand"
import type { ForgeEvent } from "@/lib/types/events"

interface EventStore {
  events: ForgeEvent[]
  isConnected: boolean

  addEvent: (event: ForgeEvent) => void
  setEvents: (events: ForgeEvent[]) => void
  setConnected: (connected: boolean) => void
  clearEvents: () => void
}

export const useEventStore = create<EventStore>((set) => ({
  events: [],
  isConnected: false,

  addEvent: (event) =>
    set((state) => ({
      events: [...state.events.slice(-500), event],
    })),

  setEvents: (events) => set({ events }),

  setConnected: (connected) => set({ isConnected: connected }),

  clearEvents: () => set({ events: [] }),
}))
