/**
 * App-wide Zustand store.
 *
 * Phase 2: combines the three slices (agent / project / tools). UI state
 * that does not belong to any slice lives directly here (toolPanelOpen,
 * settingsOpen, sidebarCollapsed, currentTheme).
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { StateCreator } from 'zustand'
import { createAgentSlice, type AgentSlice } from './slices/agentSlice'
import { createContextSlice, type ContextSlice } from './slices/contextSlice'
import { createProjectSlice, type ProjectSlice } from './slices/projectSlice'
import { createSettingsSlice, type SettingsSlice } from './slices/settingsSlice'
import { createToolsSlice, type ToolsSlice } from './slices/toolsSlice'

export type ThemeKey = 'dark' | 'light' | 'warm'

export interface UiSlice {
  toolPanelOpen: boolean
  settingsOpen: boolean
  sidebarCollapsed: boolean
  currentTheme: ThemeKey

  setToolPanelOpen: (open: boolean) => void
  toggleToolPanel: () => void
  setSettingsOpen: (open: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  setCurrentTheme: (theme: ThemeKey) => void
}

export type AppStore = AgentSlice &
  ProjectSlice &
  ToolsSlice &
  SettingsSlice &
  ContextSlice &
  UiSlice

const createUiSlice: StateCreator<AppStore, [], [], UiSlice> = (set, get) => ({
  toolPanelOpen: true,
  settingsOpen: false,
  sidebarCollapsed: false,
  currentTheme: 'dark',

  setToolPanelOpen: (open) => set({ toolPanelOpen: open }),
  toggleToolPanel: () => set({ toolPanelOpen: !get().toolPanelOpen }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
  setCurrentTheme: (theme) => set({ currentTheme: theme }),
})

// ponytail: slice creators are typed against their own slice state; cast
// `set`/`get` so all four slices share one underlying store. Runtime behavior
// is unchanged — each `set` call only mutates the slice's keys.
export const useAppStore = create<AppStore>()(
  devtools(
    (set, get, store) => ({
      ...createAgentSlice(set as never, get as never, store as never),
      ...createProjectSlice(set as never, get as never, store as never),
      ...createToolsSlice(set as never, get as never, store as never),
      ...createSettingsSlice(set as never, get as never, store as never),
      ...createContextSlice(set as never, get as never, store as never),
      ...createUiSlice(set, get, store),
    }),
    { name: 'nexus-app-store' },
  ),
)