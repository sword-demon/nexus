import type { Messages } from '@anthropic-ai/sdk/resources/beta/prompt-caching/messages'
import type { AgentEvent, PromptContextDto } from '../../shared/types/ipc'

export type AgentInputMessage = Messages.PromptCachingBetaMessageParam

export interface ToolCall {
  id: string
  name: string
  input: unknown
}

export interface StreamUsage {
  inputTokens: number
  outputTokens: number
  cacheCreationInputTokens: number | null
  cacheReadInputTokens: number | null
}

export interface StreamMessageParams {
  turnId: string
  promptContext: PromptContextDto
  messages: AgentInputMessage[]
  allowedTools?: string[] | null
  signal?: AbortSignal
  onEvent: (event: AgentEvent) => void
}

export interface StreamMessageResult {
  model: string
  firstTokenMs: number | null
  usage: StreamUsage
  assistantMessage: AgentInputMessage
}

export interface AgentErrorInfo {
  code: string
  message: string
  status?: number
}

export class AgentConfigError extends Error {
  readonly code = 'api_key_missing'

  constructor(message = 'Anthropic API key is not configured') {
    super(message)
    this.name = 'AgentConfigError'
  }
}
