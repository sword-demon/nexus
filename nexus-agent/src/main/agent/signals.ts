export interface AgentSignal {
  readonly signal: AbortSignal
  readonly aborted: boolean
  abort: () => void
}

export function createAgentSignal(): AgentSignal {
  const controller = new AbortController()
  return {
    signal: controller.signal,
    get aborted() {
      return controller.signal.aborted
    },
    abort: () => controller.abort(),
  }
}
