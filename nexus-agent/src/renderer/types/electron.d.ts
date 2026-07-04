import type { NexusApi } from '../../preload/api'

declare global {
  interface Window {
    nexus: NexusApi
  }
}

export {}