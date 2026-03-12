import { create } from "zustand"
import type { Project } from "@/lib/types/project"

interface ProjectStore {
  projects: Project[]
  activeProjectId: string | null

  setProjects: (projects: Project[]) => void
  setActiveProject: (id: string | null) => void
  addProject: (project: Project) => void
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  activeProjectId: null,

  setProjects: (projects) => set({ projects }),
  setActiveProject: (id) => set({ activeProjectId: id }),
  addProject: (project) =>
    set((state) => ({ projects: [...state.projects, project] })),
}))
