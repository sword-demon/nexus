/**
 * Agent state slice — agent status, streamed tokens, message history.
 *
 * Phase 2: state shape is finalized and the slice is wired into the store.
 * The streaming delta buffer is populated by agent push events (Phase 6/7).
 * For now `setAgentStatus` is enough to drive the StatusIndicator through
 * its full state machine.
 */

import type { StateCreator } from 'zustand'
import type { AgentStatus, MessageDto } from '../../../shared/types/ipc'

export interface AgentSlice {
  agentStatus: AgentStatus
  /** Current message history for the active session. Empty until Phase 7. */
  messages: MessageDto[]
  /** Token buffer for the assistant message currently being streamed. */
  streamingText: string
  /** Active turn id, set when sendMessage resolves; cleared on end_turn. */
  currentTurnId: string | null

  setAgentStatus: (status: AgentStatus) => void
  setStreamingText: (text: string) => void
  appendStreamingDelta: (delta: string) => void
  setCurrentTurnId: (turnId: string | null) => void
  setMessages: (messages: MessageDto[]) => void
  appendMessage: (message: MessageDto) => void
  appendLocalUserMessage: (content: string) => void
  commitStreamingMessage: (turnId: string) => void
  appendAssistantError: (turnId: string, content: string) => void
  resetAgentSession: () => void
}

export const initialAgentState = {
  agentStatus: 'idle' as AgentStatus,
  messages: [] as MessageDto[],
  streamingText: '',
  currentTurnId: null,
}

export type AgentSliceCreator = StateCreator<AgentSlice, [], [], AgentSlice>

export const createAgentSlice: AgentSliceCreator = (set) => ({
  ...initialAgentState,

  setAgentStatus: (status) => set({ agentStatus: status }),
  setStreamingText: (text) => set({ streamingText: text }),
  appendStreamingDelta: (delta) =>
    set((state) => ({ streamingText: state.streamingText + delta })),
  setCurrentTurnId: (turnId) => set({ currentTurnId: turnId }),
  setMessages: (messages) => set({ messages }),
  appendMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  appendLocalUserMessage: (content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: `local-user-${Date.now()}`,
          sessionId: state.currentTurnId ?? 'local',
          role: 'user',
          content,
          toolUseId: null,
          createdAt: Date.now(),
        },
      ],
    })),
  commitStreamingMessage: (turnId) =>
    set((state) => {
      if (!state.streamingText.trim()) return { streamingText: '' }
      return {
        streamingText: '',
        messages: [
          ...state.messages,
          {
            id: `${turnId}-assistant-${Date.now()}`,
            sessionId: turnId,
            role: 'assistant',
            content: state.streamingText,
            toolUseId: null,
            createdAt: Date.now(),
          },
        ],
      }
    }),
  appendAssistantError: (turnId, content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: `${turnId}-error-${Date.now()}`,
          sessionId: turnId,
          role: 'assistant',
          content,
          toolUseId: null,
          createdAt: Date.now(),
        },
      ],
    })),
  resetAgentSession: () =>
    set({
      agentStatus: 'idle',
      messages: [],
      streamingText: '',
      currentTurnId: null,
    }),
})
