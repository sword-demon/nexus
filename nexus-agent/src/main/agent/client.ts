import '@anthropic-ai/sdk/shims/node'
import Anthropic from '@anthropic-ai/sdk'
import { createHash } from 'node:crypto'
import { getApiKey } from '../security/apiKey'
import { AgentConfigError } from './types'

let client: Anthropic | null = null
let keyFingerprint: string | null = null

export function getAnthropicClient(): Anthropic {
  const apiKey = getApiKey()
  if (!apiKey) throw new AgentConfigError()

  const nextFingerprint = createHash('sha256').update(apiKey).digest('hex')
  if (!client || keyFingerprint !== nextFingerprint) {
    client = new Anthropic({
      apiKey,
      baseURL: process.env.NEXUS_ANTHROPIC_BASE_URL || undefined,
      maxRetries: 0,
    })
    keyFingerprint = nextFingerprint
  }
  return client
}
