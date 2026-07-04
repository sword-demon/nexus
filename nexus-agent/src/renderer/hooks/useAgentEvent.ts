import { useEffect } from 'react'
import { useAppStore } from '@/store/appStore'

export function useAgentEvent(): void {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.nexus) return undefined

    return window.nexus.onAgentEvent((event) => {
      const store = useAppStore.getState()

      switch (event.type) {
        case 'status':
          store.setAgentStatus(event.status)
          if (event.status === 'done' || event.status === 'error') {
            store.setCurrentTurnId(null)
          }
          break
        case 'text_delta':
          store.appendStreamingDelta(event.delta)
          break
        case 'tool_use':
          store.upsertPendingTool({
            toolUseId: event.toolUseId,
            toolName: event.toolName,
            input: event.input,
            status: 'running',
            startedAt: Date.now(),
          })
          break
        case 'tool_result':
          store.patchPendingTool(event.toolUseId, {
            status: event.ok ? 'done' : event.error === 'rejected' ? 'rejected' : 'error',
            output: event.output,
            error: event.error,
            finishedAt: Date.now(),
          })
          break
        case 'permission_request':
          store.addPermission(event.request)
          store.setAgentStatus('awaiting-permission')
          break
        case 'error':
          store.appendAssistantError(event.turnId, event.message)
          store.setAgentStatus('error')
          void refreshCurrentSessionMessages()
          break
        case 'end_turn':
          store.commitStreamingMessage(event.turnId)
          store.setCurrentTurnId(null)
          void refreshCurrentSessionMessages()
          break
        default:
          break
      }
    })
  }, [])
}

async function refreshCurrentSessionMessages(): Promise<void> {
  if (typeof window === 'undefined' || !window.nexus) return
  const store = useAppStore.getState()
  if (!store.currentProjectId) return
  const sessionsRes = await window.nexus.getSessions({ projectId: store.currentProjectId })
  store.setSessions(sessionsRes.sessions)
  const session = sessionsRes.sessions[0]
  if (!session) {
    store.setMessages([])
    return
  }
  const messagesRes = await window.nexus.getMessages({ sessionId: session.id })
  store.setMessages(messagesRes.messages)
}
