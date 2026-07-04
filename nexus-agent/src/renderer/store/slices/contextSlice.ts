/**
 * Prompt context slice (Phase 5).
 *
 * Holds the most recently loaded `PromptContext` — CLAUDE.md / AGENTS.md /
 * skill catalog for the currently active project. Loader never throws, so
 * errors are surfaced in `contextLoadError`. The slice does not mutate
 * the context payload; UI components derive filtered views from
 * `promptContext`.
 */

import type { StateCreator } from 'zustand'
import type {
  PromptContextDto,
  SkillDto,
  SkillLoadErrorDto,
} from '../../../shared/types/ipc'

const EMPTY_SKILLS: SkillDto[] = []
const EMPTY_LOAD_ERRORS: SkillLoadErrorDto[] = []

export interface ContextSlice {
  promptContext: PromptContextDto | null
  contextLoading: boolean
  contextLoadError: string | null

  setPromptContext: (context: PromptContextDto) => void
  loadContextFromDisk: (projectPath: string) => Promise<void>
  clearPromptContext: () => void
}

export const initialContextState = {
  promptContext: null,
  contextLoading: false,
  contextLoadError: null,
} as const

export type ContextSliceCreator = StateCreator<ContextSlice, [], [], ContextSlice>

export const createContextSlice: ContextSliceCreator = (set) => ({
  ...initialContextState,

  setPromptContext: (context) =>
    set({ promptContext: context, contextLoadError: null }),

  loadContextFromDisk: async (projectPath: string) => {
    if (typeof window === 'undefined' || !window.nexus) {
      set({ contextLoading: false, contextLoadError: null })
      return
    }
    set({ contextLoading: true, contextLoadError: null })
    const res = await window.nexus.loadContext({ projectPath })
    if (res.status === 'ok') {
      set({
        promptContext: res.context,
        contextLoading: false,
        contextLoadError: null,
      })
      return
    }
    set({ contextLoading: false, contextLoadError: res.error })
  },

  clearPromptContext: () =>
    set({ promptContext: null, contextLoadError: null, contextLoading: false }),
})

export function selectSkills(state: ContextSlice): SkillDto[] {
  return state.promptContext?.skills ?? EMPTY_SKILLS
}

export function selectLoadErrors(state: ContextSlice): SkillLoadErrorDto[] {
  return state.promptContext?.loadErrors ?? EMPTY_LOAD_ERRORS
}

export function selectValidSkills(state: ContextSlice): SkillDto[] {
  return state.promptContext?.skills ?? EMPTY_SKILLS
}
