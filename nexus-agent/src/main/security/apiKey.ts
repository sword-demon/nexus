/**
 * API key management — glue between safeStorage and the settings DAO.
 *
 * - `setApiKey(plain)`: encrypt + persist
 * - `getApiKey()`: load + decrypt (returns null when unset)
 * - `clearApiKey()`: remove from disk
 *
 * Plain text is only ever held in local variables inside these functions
 * and is never logged. Encrypted blob lives in the settings table under
 * `api_key_blob`.
 */

import {
  clearEncryptedApiKey,
  getEncryptedApiKey,
  setEncryptedApiKey,
} from '../db/dao/settings'
import { logger } from '../logger'
import { decryptKey, encryptKey } from './safeStorage'

export function getApiKey(): string | null {
  const blob = getEncryptedApiKey()
  if (!blob) return null
  try {
    return decryptKey(blob)
  } catch (error: unknown) {
    void logger.error(
      'security',
      `getApiKey decrypt failed: ${error instanceof Error ? error.message : String(error)}`,
    )
    return null
  }
}

export function setApiKey(plain: string): void {
  if (!plain) {
    throw new Error('setApiKey: plain key must be a non-empty string')
  }
  const blob = encryptKey(plain)
  setEncryptedApiKey(blob)
}

export function clearApiKey(): boolean {
  return clearEncryptedApiKey()
}
