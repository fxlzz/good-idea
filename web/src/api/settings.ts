import { apiFetch } from '../lib/api'
import type { SettingsState, StorageEngine, ThemeMode } from '../store/settings'

export type ServerSettings = Pick<
  SettingsState,
  'llmModel' | 'llmApiKey' | 'embeddingModel' | 'storageEngine' | 'chunkSize' | 'chunkOverlap' | 'chunkSeparators' | 'enableParentChunks'
>

export async function fetchSettings(): Promise<ServerSettings> {
  const res = await apiFetch('/api/settings')
  if (!res.ok) {
    throw new Error(`Failed to load settings: ${res.status}`)
  }
  const data = await res.json()
  return data as ServerSettings
}

export async function updateSettings(partial: Partial<ServerSettings & { theme?: ThemeMode; storageEngine?: StorageEngine }>) {
  const res = await apiFetch('/api/settings', {
    method: 'POST',
    body: JSON.stringify(partial),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Failed to update settings: ${res.status}`)
  }
  return (await res.json()) as ServerSettings
}

