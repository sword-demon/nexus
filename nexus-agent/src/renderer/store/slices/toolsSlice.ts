/**
 * Tools + permissions state slice.
 *
 * `pendingTools` mirrors what the ToolPanel shows: tool calls awaiting /
 * finished in the current turn. `permissions` carries the in-flight
 * permission requests that PermissionPrompt renders.
 *
 * Phase 2: state shape and reducers only. Phase 7 populates pendingTools
 * from agent events; Phase 10 wires permissions through the UI.
 */

import type { StateCreator } from 'zustand'
import type { PermissionRequestDto } from '../../../shared/types/ipc'

export type PendingToolStatus = 'pending' | 'running' | 'done' | 'rejected' | 'error'

export interface PendingTool {
  toolUseId: string
  toolName: string
  input: unknown
  status: PendingToolStatus
  output?: unknown
  error?: string
  startedAt: number
  finishedAt?: number
}

export interface ToolsSlice {
  pendingTools: PendingTool[]
  /** Active permission requests awaiting a user decision. */
  permissions: PermissionRequestDto[]

  setPendingTools: (tools: PendingTool[]) => void
  upsertPendingTool: (tool: PendingTool) => void
  patchPendingTool: (
    toolUseId: string,
    patch: Partial<Omit<PendingTool, 'toolUseId' | 'startedAt'>>,
  ) => void

  setPermissions: (permissions: PermissionRequestDto[]) => void
  addPermission: (permission: PermissionRequestDto) => void
  resolvePermission: (id: string) => void

  resetToolsSession: () => void
}

export const initialToolsState = {
  pendingTools: [] as PendingTool[],
  permissions: [] as PermissionRequestDto[],
}

export type ToolsSliceCreator = StateCreator<ToolsSlice, [], [], ToolsSlice>

export const createToolsSlice: ToolsSliceCreator = (set) => ({
  ...initialToolsState,

  setPendingTools: (tools) => set({ pendingTools: tools }),
  upsertPendingTool: (tool) =>
    set((state) => {
      const idx = state.pendingTools.findIndex((t) => t.toolUseId === tool.toolUseId)
      if (idx === -1) {
        return { pendingTools: [...state.pendingTools, tool] }
      }
      const next = state.pendingTools.slice()
      next[idx] = tool
      return { pendingTools: next }
    }),
  patchPendingTool: (toolUseId, patch) =>
    set((state) => ({
      pendingTools: state.pendingTools.map((t) =>
        t.toolUseId === toolUseId ? { ...t, ...patch } : t,
      ),
    })),

  setPermissions: (permissions) => set({ permissions }),
  addPermission: (permission) =>
    set((state) => ({ permissions: [...state.permissions, permission] })),
  resolvePermission: (id) =>
    set((state) => ({
      permissions: state.permissions.filter((p) => p.id !== id),
    })),

  resetToolsSession: () => set({ pendingTools: [], permissions: [] }),
})