import { app } from 'electron'
import path from 'node:path'

const DB_PATH_ENV = 'NEXUS_DB_PATH'

export function getDatabasePath(): string {
  const override = process.env[DB_PATH_ENV]
  if (override && override.trim().length > 0) {
    return path.resolve(override)
  }

  return path.join(app.getPath('appData'), 'Nexus', 'nexus.db')
}
