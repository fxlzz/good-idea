import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type BookmarksState = {
  nodeIds: string[]
  add: (nodeId: string) => void
  remove: (nodeId: string) => void
  has: (nodeId: string) => boolean
  toggle: (nodeId: string) => void
}

export const useBookmarksStore = create<BookmarksState>()(
  persist(
    (set, get) => ({
      nodeIds: [],
      add: (nodeId) =>
        set((s) =>
          s.nodeIds.includes(nodeId) ? s : { nodeIds: [...s.nodeIds, nodeId] }
        ),
      remove: (nodeId) =>
        set((s) => ({ nodeIds: s.nodeIds.filter((id) => id !== nodeId) })),
      has: (nodeId) => get().nodeIds.includes(nodeId),
      toggle: (nodeId) =>
        set((s) =>
          s.nodeIds.includes(nodeId)
            ? { nodeIds: s.nodeIds.filter((id) => id !== nodeId) }
            : { nodeIds: [...s.nodeIds, nodeId] }
        ),
    }),
    { name: 'good-idea-bookmarks' }
  )
)
