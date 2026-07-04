/**
 * Thin wrapper over Electron's `safeStorage` API.
 *
 * `safeStorage.encryptString(plain)` / `decryptString(blob)` rely on the OS
 * keystore (Keychain on macOS, DPAPI on Windows, libsecret on Linux). If the
 * backend is unavailable, we fail the write instead of storing a reversible
 * fallback. API keys must never land on disk as plaintext or base64 plaintext.
 */

import { safeStorage } from 'electron'
import { logger } from '../logger'

let warnedUnavailable = false

function warnOnce(message: string): void {
  if (warnedUnavailable) return
  warnedUnavailable = true
  void logger.warn('security', message)
}

export function encryptKey(plain: string): Buffer {
  if (!safeStorage.isEncryptionAvailable()) {
    warnOnce('safeStorage not available; refused to store API key')
    throw new Error('safeStorage encryption unavailable; API key was not stored')
  }
  return safeStorage.encryptString(plain)
}

export function decryptKey(blob: Buffer): string {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('safeStorage encryption unavailable; API key cannot be decrypted')
  }
  return safeStorage.decryptString(blob)
}

export function isEncryptionAvailable(): boolean {
  return safeStorage.isEncryptionAvailable()
}
