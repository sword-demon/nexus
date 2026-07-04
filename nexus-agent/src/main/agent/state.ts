import type { AgentEvent, AgentStatus } from '../../shared/types/ipc'

export interface AgentState {
  status: AgentStatus
}

const ALLOWED: Partial<Record<AgentStatus, AgentStatus[]>> = {
  idle: ['thinking', 'error'],
  thinking: ['streaming', 'error'],
  streaming: ['executing', 'done', 'error'],
  executing: ['streaming', 'error'],
  done: ['idle'],
  error: ['idle'],
}

export function transitionAgentStatus(current: AgentStatus, next: AgentStatus): AgentStatus {
  if (current === next || ALLOWED[current]?.includes(next)) return next
  throw new Error(`Invalid agent status transition: ${current} -> ${next}`)
}

export function sendAgentStatus(
  state: AgentState,
  turnId: string,
  next: AgentStatus,
  sendEvent: (event: AgentEvent) => void,
): void {
  state.status = transitionAgentStatus(state.status, next)
  sendEvent({ type: 'status', turnId, status: next })
}
