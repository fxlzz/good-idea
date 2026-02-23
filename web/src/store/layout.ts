import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type MainView = 'files' | 'whiteboard' | 'graph'
export type DocViewMode = 'edit' | 'split' | 'preview'

type LayoutState = {
  mainView: MainView
  topNav: '文件' | '每日记录' | '项目规划'
  terminalVisible: boolean
  docViewMode: DocViewMode
  setMainView: (v: MainView) => void
  setTopNav: (v: '文件' | '每日记录' | '项目规划') => void
  setTerminalVisible: (v: boolean) => void
  toggleTerminal: () => void
  setDocViewMode: (v: DocViewMode) => void
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      mainView: 'files',
      topNav: '文件',
      terminalVisible: false,
      docViewMode: 'split',
      setMainView: (mainView) => set({ mainView }),
      setTopNav: (topNav) => set({ topNav }),
      setTerminalVisible: (terminalVisible) => set({ terminalVisible }),
      toggleTerminal: () => set((s) => ({ terminalVisible: !s.terminalVisible })),
      setDocViewMode: (docViewMode) => set({ docViewMode }),
    }),
    { name: 'good-idea-layout' }
  )
)
