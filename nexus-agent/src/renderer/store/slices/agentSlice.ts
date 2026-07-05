/**
 * Agent state slice — agent status, streamed tokens, message history.
 *
 * Phase 2: state shape is finalized and the slice is wired into the store.
 * Phase 7 wires streaming events.
 * Phase 15 adds `sessionCostUsd` (live session total) and ensures each
 * locally-constructed message satisfies the 5-field cost shape required by
 * the IPC `MessageDto`.
 */

import type { StateCreator } from 'zustand'
import type { AgentStatus, MessageDto } from '../../../shared/types/ipc'

const NULL_COST: Pick<MessageDto, 'inputTokens' | 'outputTokens' | 'cacheCreationTokens' | 'cacheReadTokens' | 'costUsd'> = {
  inputTokens: null,
  outputTokens: null,
  cacheCreationTokens: null,
  cacheReadTokens: null,
  costUsd: null,
}

export interface AgentSlice {
  agentStatus: AgentStatus
  /** Current message history for the active session. Empty until Phase 7. */
  messages: MessageDto[]
  /** Token buffer for the assistant message currently being streamed. */
  streamingText: string
  /** Active turn id, set when sendMessage resolves; cleared on end_turn. */
  currentTurnId: string | null
  /** v1.0: live sum of `costUsd` across assistant messages in the session. */
  sessionCostUsd: number

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
  sessionCostUsd: 0,
}

export type AgentSliceCreator = StateCreator<AgentSlice, [], [], AgentSlice>

export const createAgentSlice: AgentSliceCreator = (set) => ({
  ...initialAgentState,

  setAgentStatus: (status) => set({ agentStatus: status }),
  setStreamingText: (text) => set({ streamingText: text }),
  appendStreamingDelta: (delta) =>
    set((state) => ({ streamingText: state.streamingText + delta })),
  setCurrentTurnId: (turnId) => set({ currentTurnId: turnId }),
  setMessages: (messages) =>
    set({ messages, sessionCostUsd: sumAssistantCost(messages) }),
  appendMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
      sessionCostUsd: state.sessionCostUsd + costOf(message),
    })),
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
          ...NULL_COST,
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
            ...NULL_COST,
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
          ...NULL_COST,
        },
      ],
    })),
  resetAgentSession: () =>
    set({
      agentStatus: 'idle',
      messages: [],
      streamingText: '',
      currentTurnId: null,
      sessionCostUsd: 0,
    }),
})

function costOf(message: MessageDto): number {
  if (message.role !== 'assistant') return 0
  return message.costUsd ?? 0
}

function sumAssistantCost(messages: MessageDto[]): number {
  let total = 0
  for (const message of messages) {
    if (message.role === 'assistant' && typeof message.costUsd === 'number') {
      total += message.costUsd
    }
  }
  return Math.round(total * 1_000_000) / 1_000_000
}