import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark'

export type StorageEngine = 'local' | 'cloud'

export type SettingsState = {
  theme: ThemeMode
  llmModel: string
  llmApiKey: string
  embeddingModel: string
  storageEngine: StorageEngine
  chunkSize: number
  chunkOverlap: number
  chunkSeparators: string[]
  enableParentChunks: boolean
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
  updateSettings: (partial: Partial<Omit<SettingsState, 'toggleTheme' | 'setTheme' | 'updateSettings'>>) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      llmModel: 'qwen-turbo',
      llmApiKey: '',
      embeddingModel: 'text-embedding-v3',
      storageEngine: 'local',
      chunkSize: 512,
      chunkOverlap: 100,
      chunkSeparators: ['\n\n', '\n', '。', '！', '？', ';', '；'],
      enableParentChunks: false,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((s) => ({
          theme: s.theme === 'dark' ? 'light' : 'dark',
        })),
      updateSettings: (partial) =>
        set((s) => ({
          ...s,
          ...partial,
        })),
    }),
    {
      name: 'good-idea-settings',
      partialize: (s) => ({
        theme: s.theme,
        llmModel: s.llmModel,
        llmApiKey: s.llmApiKey,
        embeddingModel: s.embeddingModel,
        storageEngine: s.storageEngine,
        chunkSize: s.chunkSize,
        chunkOverlap: s.chunkOverlap,
        chunkSeparators: s.chunkSeparators,
        enableParentChunks: s.enableParentChunks,
      }),
    }
  )
)

