import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type DocViewMode = 'edit' | 'split' | 'preview'

type LayoutState = {
  terminalVisible: boolean
  docViewMode: DocViewMode
  setTerminalVisible: (v: boolean) => void
  toggleTerminal: () => void
  setDocViewMode: (v: DocViewMode) => void
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      terminalVisible: false,
      docViewMode: 'split',
      setTerminalVisible: (terminalVisible) => set({ terminalVisible }),
      toggleTerminal: () => set((s) => ({ terminalVisible: !s.terminalVisible })),
      setDocViewMode: (docViewMode) => set({ docViewMode }),
    }),
    { name: 'good-idea-layout' }
  )
)
