/**
 * Project state slice — known projects + the currently selected one.
 *
 * Phase 2: state shape and reducer-style setters only. Phase 3 wires
 * `loadProjects` / `addProject` / `removeProject` against the SQLite DAO
 * through `window.nexus`.
 */

import type { StateCreator } from 'zustand'
import type { ProjectDto, SessionDto } from '../../../shared/types/ipc'

export interface ProjectSlice {
  projects: ProjectDto[]
  currentProjectId: string | null
  /** Sessions for `currentProjectId`. Empty until Phase 3. */
  sessions: SessionDto[]

  setProjects: (projects: ProjectDto[]) => void
  setCurrentProjectId: (id: string | null) => void
  setSessions: (sessions: SessionDto[]) => void
  upsertProject: (project: ProjectDto) => void
  removeProjectById: (id: string) => void
}

export const initialProjectState = {
  projects: [] as ProjectDto[],
  currentProjectId: null as string | null,
  sessions: [] as SessionDto[],
}

export type ProjectSliceCreator = StateCreator<ProjectSlice, [], [], ProjectSlice>

export const createProjectSlice: ProjectSliceCreator = (set) => ({
  ...initialProjectState,

  setProjects: (projects) => set({ projects }),
  setCurrentProjectId: (id) => set({ currentProjectId: id, sessions: [] }),
  setSessions: (sessions) => set({ sessions }),
  upsertProject: (project) =>
    set((state) => {
      const existing = state.projects.findIndex((p) => p.id === project.id)
      if (existing === -1) {
        return { projects: [...state.projects, project] }
      }
      const next = state.projects.slice()
      next[existing] = project
      return { projects: next }
    }),
  removeProjectById: (id) =>
    set((state) => {
      const next = state.projects.filter((p) => p.id !== id)
      const clearedCurrent = state.currentProjectId === id ? null : state.currentProjectId
      return {
        projects: next,
        currentProjectId: clearedCurrent,
        sessions: clearedCurrent === null ? [] : state.sessions,
      }
    }),
})