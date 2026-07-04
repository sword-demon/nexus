import '@anthropic-ai/sdk/shims/node'
import { APIUserAbortError } from '@anthropic-ai/sdk'
import type { Messages } from '@anthropic-ai/sdk/resources/beta/prompt-caching/messages'
import { logger } from '../logger'
import type { AgentEvent, PromptContextDto } from '../../shared/types/ipc'
import { dispatchToolCall, toToolResultEvent } from './dispatcher'
import { sendAgentStatus, type AgentState } from './state'
import { streamMessage } from './stream'
import type { AgentInputMessage, StreamUsage, ToolCall } from './types'

const MAX_STEPS = 8

export interface RunTurnParams {
  turnId: string
  projectRoot: string
  promptContext: PromptContextDto
  messages: AgentInputMessage[]
  allowedTools?: string[] | null
  signal?: AbortSignal
  onEvent: (event: AgentEvent) => void
}

export interface RunTurnResult {
  model: string
  firstTokenMs: number | null
  usage: StreamUsage
  steps: number
}

export async function runTurn(params: RunTurnParams): Promise<RunTurnResult> {
  const state: AgentState = { status: 'idle' }
  const messages = [...params.messages]
  const usage = emptyUsage()
  let model = process.env.NEXUS_ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022'
  let firstTokenMs: number | null = null

  sendAgentStatus(state, params.turnId, 'thinking', params.onEvent)

  for (let step = 1; step <= MAX_STEPS; step += 1) {
    throwIfAborted(params.signal)
    const toolCalls: ToolCall[] = []

    sendAgentStatus(state, params.turnId, 'streaming', params.onEvent)
    const result = await streamMessage({
      turnId: params.turnId,
      promptContext: params.promptContext,
      messages,
      allowedTools: params.allowedTools,
      signal: params.signal,
      onEvent: (event) => {
        if (event.type === 'tool_use') {
          toolCalls.push({ id: event.toolUseId, name: event.toolName, input: event.input })
          params.onEvent(event)
          return
        }
        if (event.type !== 'end_turn') params.onEvent(event)
      },
    })

    model = result.model
    firstTokenMs ??= result.firstTokenMs
    addUsage(usage, result.usage)
    messages.push(result.assistantMessage)
    await logger.info('agent-loop', JSON.stringify({ turnId: params.turnId, step, toolCalls: toolCalls.length }))

    if (toolCalls.length === 0) {
      params.onEvent({ type: 'end_turn', turnId: params.turnId })
      sendAgentStatus(state, params.turnId, 'done', params.onEvent)
      return { model, firstTokenMs, usage, steps: step }
    }

    sendAgentStatus(state, params.turnId, 'executing', params.onEvent)
    messages.push({
      role: 'user',
      content: await dispatchTools(params.turnId, params.projectRoot, toolCalls, params.allowedTools, params.onEvent),
    })
  }

  throw new Error(`Agent loop exceeded ${MAX_STEPS} steps`)
}

async function dispatchTools(
  turnId: string,
  projectRoot: string,
  toolCalls: ToolCall[],
  allowedTools: string[] | null | undefined,
  sendEvent: (event: AgentEvent) => void,
): Promise<Messages.PromptCachingBetaToolResultBlockParam[]> {
  const blocks: Messages.PromptCachingBetaToolResultBlockParam[] = []
  for (const toolCall of toolCalls) {
    const result = await dispatchToolCall(toolCall, {
      projectRoot,
      allowedTools,
      permission: { turnId, onEvent: sendEvent },
    })
    sendEvent(toToolResultEvent(turnId, toolCall, result))
    blocks.push({
      type: 'tool_result',
      tool_use_id: toolCall.id,
      content: result.ok ? JSON.stringify(result.output) : result.error,
      is_error: !result.ok,
    })
  }
  return blocks
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new APIUserAbortError()
}

function addUsage(total: StreamUsage, next: StreamUsage): void {
  total.inputTokens += next.inputTokens
  total.outputTokens += next.outputTokens
  total.cacheCreationInputTokens = addNullable(total.cacheCreationInputTokens, next.cacheCreationInputTokens)
  total.cacheReadInputTokens = addNullable(total.cacheReadInputTokens, next.cacheReadInputTokens)
}

function addNullable(left: number | null, right: number | null): number | null {
  if (left === null && right === null) return null
  return (left ?? 0) + (right ?? 0)
}

function emptyUsage(): StreamUsage {
  return {
    inputTokens: 0,
    outputTokens: 0,
    cacheCreationInputTokens: null,
    cacheReadInputTokens: null,
  }
}
