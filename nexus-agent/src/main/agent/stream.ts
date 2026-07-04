import '@anthropic-ai/sdk/shims/node'
import {
  APIConnectionError,
  APIConnectionTimeoutError,
  APIError,
  APIUserAbortError,
  AuthenticationError,
} from '@anthropic-ai/sdk'
import type { Messages } from '@anthropic-ai/sdk/resources/beta/prompt-caching/messages'
import { buildSystemPrompt } from './cache'
import { getAnthropicClient } from './client'
import { logger } from '../logger'
import { AGENT_TOOLS } from './tools/index'
import {
  AgentConfigError,
  type AgentErrorInfo,
  type AgentInputMessage,
  type StreamMessageParams,
  type StreamMessageResult,
  type StreamUsage,
} from './types'

const DEFAULT_MODEL = process.env.NEXUS_ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022'
const MAX_TOKENS = 1024
const PROMPT_CACHING_BETA = 'prompt-caching-2024-07-31'

interface PendingToolUse {
  id: string
  name: string
  initialInput: unknown
  partialJson: string
}

type AssistantBlock =
  | Messages.PromptCachingBetaTextBlockParam
  | Messages.PromptCachingBetaToolUseBlockParam

export async function streamMessage(params: StreamMessageParams): Promise<StreamMessageResult> {
  const startedAt = Date.now()
  let firstTokenMs: number | null = null
  let usage: StreamUsage = emptyUsage()
  const pendingTools = new Map<number, PendingToolUse>()
  const assistantBlocks = new Map<number, AssistantBlock>()

  await logger.info('api', `stream start turn=${params.turnId}`)
  const stream = await getAnthropicClient().beta.promptCaching.messages.create(
    {
      model: DEFAULT_MODEL,
      max_tokens: MAX_TOKENS,
      messages: toSdkMessages(params.messages),
      system: buildSystemPrompt(params.promptContext),
      tools: toolsFor(params.allowedTools),
      betas: [PROMPT_CACHING_BETA],
      stream: true,
    },
    { signal: params.signal },
  )
  await logger.info('api', `stream opened turn=${params.turnId}`)

  for await (const event of stream) {
    switch (event.type) {
      case 'message_start':
        usage = usageFromStart(event.message.usage)
        break
      case 'message_delta':
        usage = { ...usage, outputTokens: event.usage.output_tokens }
        break
      case 'content_block_start':
        if (event.content_block.type === 'text') {
          assistantBlocks.set(event.index, { type: 'text', text: event.content_block.text })
        } else if (event.content_block.type === 'tool_use') {
          assistantBlocks.set(event.index, {
            type: 'tool_use',
            id: event.content_block.id,
            name: event.content_block.name,
            input: event.content_block.input,
          })
          pendingTools.set(event.index, {
            id: event.content_block.id,
            name: event.content_block.name,
            initialInput: event.content_block.input,
            partialJson: '',
          })
        }
        break
      case 'content_block_delta':
        if (event.delta.type === 'text_delta') {
          firstTokenMs ??= Date.now() - startedAt
          const block = assistantBlocks.get(event.index)
          if (block?.type === 'text') block.text += event.delta.text
          params.onEvent({ type: 'text_delta', turnId: params.turnId, delta: event.delta.text })
        } else if (event.delta.type === 'input_json_delta') {
          const tool = pendingTools.get(event.index)
          if (tool) tool.partialJson += event.delta.partial_json
        }
        break
      case 'content_block_stop': {
        const tool = pendingTools.get(event.index)
        if (tool) {
          const input = parseToolInput(tool)
          const block = assistantBlocks.get(event.index)
          if (block?.type === 'tool_use') block.input = input
          firstTokenMs ??= Date.now() - startedAt
          params.onEvent({
            type: 'tool_use',
            turnId: params.turnId,
            toolUseId: tool.id,
            toolName: tool.name,
            input,
          })
          pendingTools.delete(event.index)
        }
        break
      }
      case 'message_stop':
        params.onEvent({ type: 'end_turn', turnId: params.turnId })
        break
      default:
        break
    }
  }
  if (params.signal?.aborted) throw new APIUserAbortError()

  return {
    model: DEFAULT_MODEL,
    firstTokenMs,
    usage,
    assistantMessage: { role: 'assistant', content: assistantContent(assistantBlocks) },
  }
}

export function mapAgentError(error: unknown): AgentErrorInfo {
  if (error instanceof AgentConfigError) {
    return { code: error.code, message: error.message }
  }
  if (error instanceof APIUserAbortError) {
    return { code: 'aborted', message: 'Anthropic request was aborted' }
  }
  if (error instanceof AuthenticationError) {
    return { code: 'auth', message: 'Anthropic API key was rejected', status: error.status }
  }
  if (error instanceof APIConnectionTimeoutError || error instanceof APIConnectionError) {
    return { code: 'network', message: 'Network error while calling Anthropic' }
  }
  if (error instanceof APIError) {
    if (error.status && error.status >= 500) {
      return { code: 'server', message: 'Anthropic server error', status: error.status }
    }
    return { code: `http_${error.status ?? 'unknown'}`, message: 'Anthropic API request failed', status: error.status }
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return { code: 'aborted', message: 'Anthropic request was aborted' }
  }
  if (error instanceof Error && error.name === 'ProjectTrustError') {
    return { code: 'project_trust', message: error.message }
  }
  return { code: 'unknown', message: 'Anthropic request failed' }
}

function toSdkMessages(messages: AgentInputMessage[]): Messages.PromptCachingBetaMessageParam[] {
  return messages
}

function toolsFor(allowedTools: string[] | null | undefined) {
  if (!allowedTools) return AGENT_TOOLS
  const allowed = new Set(allowedTools.map((tool) => tool.toLowerCase()))
  return AGENT_TOOLS.filter((tool) => allowed.has(tool.name))
}

function assistantContent(blocks: Map<number, AssistantBlock>): AgentInputMessage['content'] {
  const content = Array.from(blocks.entries())
    .sort(([left], [right]) => left - right)
    .map(([, block]) => block)
  return content.length > 0 ? content : ''
}

function parseToolInput(tool: PendingToolUse): unknown {
  if (!tool.partialJson.trim()) return tool.initialInput
  try {
    return JSON.parse(tool.partialJson)
  } catch {
    return tool.initialInput
  }
}

function usageFromStart(usage: Messages.PromptCachingBetaUsage): StreamUsage {
  return {
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    cacheCreationInputTokens: usage.cache_creation_input_tokens,
    cacheReadInputTokens: usage.cache_read_input_tokens,
  }
}

function emptyUsage(): StreamUsage {
  return {
    inputTokens: 0,
    outputTokens: 0,
    cacheCreationInputTokens: null,
    cacheReadInputTokens: null,
  }
}
