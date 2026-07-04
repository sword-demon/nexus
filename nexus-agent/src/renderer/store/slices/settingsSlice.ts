/**
 * Settings slice — API key presence (Phase 4).
 *
 * The actual key is never stored in the renderer: it lives only in the
 * SettingsModal input field and the main-process memory. This slice
 * tracks presence ('unset' | 'configured' | 'unknown') so the UI can
 * show a status badge without ever seeing the key bytes.
 */

import type { StateCreator } from 'zustand'
import type { ApiKeyStatus } from '../../../shared/types/ipc'

export interface SettingsSlice {
  apiKeyStatus: ApiKeyStatus

  setApiKeyStatusLocal: (status: ApiKeyStatus) => void
  refreshApiKeyStatus: () => Promise<void>
  submitApiKey: (apiKey: string) => Promise<void>
  clearStoredApiKey: () => Promise<void>
}

export const initialSettingsState: { apiKeyStatus: ApiKeyStatus } = {
  apiKeyStatus: 'unknown',
}

export type SettingsSliceCreator = StateCreator<SettingsSlice, [], [], SettingsSlice>

export const createSettingsSlice: SettingsSliceCreator = (set) => ({
  ...initialSettingsState,

  setApiKeyStatusLocal: (status) => set({ apiKeyStatus: status }),

  refreshApiKeyStatus: async () => {
    if (typeof window === 'undefined' || !window.nexus) {
      set({ apiKeyStatus: 'unknown' })
      return
    }
    const res = await window.nexus.getApiKeyStatus()
    if (res.status === 'error') {
      set({ apiKeyStatus: 'unknown' })
      return
    }
    set({ apiKeyStatus: res.status })
  },

  submitApiKey: async (apiKey: string) => {
    if (typeof window === 'undefined' || !window.nexus) return
    const res = await window.nexus.setApiKey(apiKey)
    if (res.status === 'error') throw new Error(res.error)
    set({ apiKeyStatus: 'configured' })
  },

  clearStoredApiKey: async () => {
    if (typeof window === 'undefined' || !window.nexus) return
    const res = await window.nexus.clearApiKey()
    if (res.status === 'error') throw new Error(res.error)
    set({ apiKeyStatus: 'unset' })
  },
})
