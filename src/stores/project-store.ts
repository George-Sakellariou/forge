import { create } from "zustand"
import type { Project } from "@/lib/types/project"

interface ProjectStore {
  projects: Project[]
  activeProjectId: string | null
  activeProjectName: string | null
  activeProjectWorkingDir: string | null

  setProjects: (projects: Project[]) => void
  setActiveProject: (id: string | null, name?: string | null, workingDirectory?: string | null) => void
  addProject: (project: Project) => void
  clearActiveProject: () => void
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  activeProjectId: null,
  activeProjectName: null,
  activeProjectWorkingDir: null,

  setProjects: (projects) => set({ projects }),
  setActiveProject: (id, name, workingDirectory) =>
    set({
      activeProjectId: id,
      activeProjectName: name ?? null,
      activeProjectWorkingDir: workingDirectory ?? null,
    }),
  addProject: (project) =>
    set((state) => ({ projects: [...state.projects, project] })),
  clearActiveProject: () =>
    set({ activeProjectId: null, activeProjectName: null, activeProjectWorkingDir: null }),
}))
