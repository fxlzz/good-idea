import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type MainView = 'files' | 'whiteboard' | 'graph'

type LayoutState = {
  mainView: MainView
  terminalVisible: boolean
  setMainView: (v: MainView) => void
  setTerminalVisible: (v: boolean) => void
  toggleTerminal: () => void
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      mainView: 'files',
      terminalVisible: false,
      setMainView: (mainView) => set({ mainView }),
      setTerminalVisible: (terminalVisible) => set({ terminalVisible }),
      toggleTerminal: () => set((s) => ({ terminalVisible: !s.terminalVisible })),
    }),
    { name: 'good-idea-layout' }
  )
)
