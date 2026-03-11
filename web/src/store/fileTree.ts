import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiFetch } from '../lib/api'

export type FileNode = {
  id: string
  name: string
  type: 'file' | 'folder'
  parentId: string | null
  content?: string
  ext?: string
  createdAt: number
  updatedAt: number
}

export type TabType = 'file' | 'whiteboard' | 'graph'

export type TabItem = {
  id: string
  type: TabType
  nodeId?: string
  title: string
}

type FileTreeState = {
  nodes: Record<string, FileNode>
  openTabs: TabItem[]
  activeTabId: string | null
  expandedFolderIds: Set<string>
  sortBy: 'name' | 'updated'
  syncing: boolean
  pendingRootNew: 'file' | 'folder' | null
  addNode: (node: Omit<FileNode, 'createdAt' | 'updatedAt'>) => void
  updateNode: (id: string, patch: Partial<FileNode>) => void
  deleteNode: (id: string) => void
  setExpanded: (id: string, expanded: boolean) => void
  setExpandedIds: (ids: string[]) => void
  openFile: (nodeId: string) => void
  openSpecialTab: (type: 'whiteboard' | 'graph') => void
  closeTab: (tabId: string) => void
  setActiveTab: (tabId: string | null) => void
  setSortBy: (sortBy: 'name' | 'updated') => void
  getChildren: (parentId: string | null) => FileNode[]
  getNode: (id: string) => FileNode | undefined
  getRecentFiles: (count: number) => FileNode[]
  syncFromServer: () => Promise<void>
  requestNewRootNode: (type: 'file' | 'folder') => void
  clearPendingRootNew: () => void
}

const STORAGE_KEY = 'good-idea-files'

function generateId(): string {
  return `n_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function getExt(name: string): string {
  const i = name.lastIndexOf('.')
  return i > 0 ? name.slice(i) : ''
}

async function apiPost(path: string, body: unknown) {
  try {
    const res = await apiFetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return res.ok
  } catch {
    return false
  }
}

async function apiPut(path: string, body: unknown) {
  try {
    const res = await apiFetch(path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return res.ok
  } catch {
    return false
  }
}

async function apiDelete(path: string) {
  try {
    const res = await apiFetch(path, { method: 'DELETE' })
    return res.ok
  } catch {
    return false
  }
}

export const useFileTreeStore = create<FileTreeState>()(
  persist(
    (set, get) => ({
      nodes: {},
      openTabs: [],
      activeTabId: null,
      expandedFolderIds: new Set<string>(),
      sortBy: 'name',
      syncing: false,
      pendingRootNew: null,

      addNode: (node) => {
        const id = node.id ?? generateId()
        const now = Date.now()
        const ext = node.type === 'file' ? getExt(node.name) : undefined
        const full: FileNode = {
          ...node,
          id,
          parentId: node.parentId ?? null,
          createdAt: now,
          updatedAt: now,
          ext,
        }
        set((s) => ({
          nodes: { ...s.nodes, [id]: full },
        }))

        void apiPost('/api/files', {
          id,
          name: node.name,
          type: node.type,
          parentId: node.parentId ?? null,
          content: node.content ?? null,
        })
          .then((ok) => {
            if (!ok) return get().syncFromServer()
            return undefined
          })
          .catch(() => undefined)
      },

      requestNewRootNode: (type) => set({ pendingRootNew: type }),

      clearPendingRootNew: () => set({ pendingRootNew: null }),

      updateNode: (id, patch) => {
        set((s) => {
          const n = s.nodes[id]
          if (!n) return s
          const updated: FileNode = {
            ...n,
            ...patch,
            updatedAt: Date.now(),
            ext: patch.name != null && n.type === 'file' ? getExt(patch.name) : n.ext,
          }
          const nodes = { ...s.nodes, [id]: updated }
          const openTabs = s.openTabs.map((t) =>
            t.nodeId === id ? { ...t, title: (patch.name as string) ?? t.title } : t
          )
          return { nodes, openTabs }
        })

        void apiPut(`/api/files/${id}`, patch)
          .then((ok) => {
            if (!ok) return get().syncFromServer()
            return undefined
          })
          .catch(() => undefined)
      },

      deleteNode: (id) => {
        const s = get()
        const toRemove = new Set<string>()
        const collect = (pid: string) => {
          toRemove.add(pid)
          s.getChildren(pid).forEach((c) => collect(c.id))
        }
        collect(id)
        set((state) => {
          const nodes = { ...state.nodes }
          toRemove.forEach((rid) => delete nodes[rid])
          const openTabs = state.openTabs.filter((t) => !t.nodeId || !toRemove.has(t.nodeId))
          const activeTabId =
            state.activeTabId &&
            toRemove.has(state.openTabs.find((t) => t.id === state.activeTabId)?.nodeId ?? 'x')
              ? (openTabs[openTabs.length - 1]?.id ?? null)
              : state.activeTabId
          return { nodes, openTabs, activeTabId }
        })

        void apiDelete(`/api/files/${id}`)
          .then((ok) => {
            if (!ok) return get().syncFromServer()
            return undefined
          })
          .catch(() => undefined)
      },

      setExpanded: (id, expanded) => {
        set((s) => {
          const next = new Set(s.expandedFolderIds)
          if (expanded) next.add(id)
          else next.delete(id)
          return { expandedFolderIds: next }
        })
      },

      setExpandedIds: (ids) => set({ expandedFolderIds: new Set(ids) }),

      openFile: (nodeId) => {
        const node = get().nodes[nodeId]
        if (!node || node.type !== 'file') return
        set((s) => {
          const exists = s.openTabs.find((t) => t.type === 'file' && t.nodeId === nodeId)
          if (exists) return { activeTabId: exists.id }
          const tab: TabItem = {
            id: generateId(),
            type: 'file',
            nodeId,
            title: node.name,
          }
          return {
            openTabs: [...s.openTabs, tab],
            activeTabId: tab.id,
          }
        })
      },

      openSpecialTab: (type) => {
        set((s) => {
          const existing = s.openTabs.find((t) => t.type === type)
          if (existing) return { activeTabId: existing.id }
          const title = type === 'whiteboard' ? '白板' : '知识图谱'
          const tab: TabItem = { id: `__${type}__`, type, title }
          return { openTabs: [...s.openTabs, tab], activeTabId: tab.id }
        })
      },

      closeTab: (tabId) => {
        set((s) => {
          const openTabs = s.openTabs.filter((t) => t.id !== tabId)
          const activeTabId =
            s.activeTabId === tabId ? openTabs[openTabs.length - 1]?.id ?? null : s.activeTabId
          return { openTabs, activeTabId }
        })
      },

      setActiveTab: (activeTabId) => set({ activeTabId }),

      setSortBy: (sortBy) => set({ sortBy }),

      getChildren: (parentId) => {
        const s = get()
        const children = Object.values(s.nodes).filter((n) => n.parentId === parentId)
        const by = s.sortBy
        const cmp =
          by === 'name'
            ? (a: FileNode, b: FileNode) => a.name.localeCompare(b.name, 'zh-CN')
            : (a: FileNode, b: FileNode) => b.updatedAt - a.updatedAt
        children.sort((a, b) => {
          if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
          return cmp(a, b)
        })
        return children
      },

      getNode: (id) => get().nodes[id],

      getRecentFiles: (count) => {
        const all = Object.values(get().nodes).filter((n) => n.type === 'file')
        all.sort((a, b) => b.updatedAt - a.updatedAt)
        return all.slice(0, count)
      },

      syncFromServer: async () => {
        set({ syncing: true })
        try {
          const res = await apiFetch('/api/files')
          if (!res.ok) return
          const { nodes: serverNodes } = await res.json()
          const safeNodes = (serverNodes ?? {}) as Record<string, FileNode>
          set((s) => {
            const openTabs = s.openTabs
              .filter((t) => t.type !== 'file' || (t.nodeId != null && safeNodes[t.nodeId] != null))
              .map((t) =>
                t.type === 'file' && t.nodeId != null && safeNodes[t.nodeId]
                  ? { ...t, title: safeNodes[t.nodeId].name }
                  : t
              )
            const activeTabStillExists = openTabs.some((t) => t.id === s.activeTabId)
            const activeTabId = activeTabStillExists ? s.activeTabId : (openTabs[openTabs.length - 1]?.id ?? null)
            const expandedFolderIds = new Set(
              [...s.expandedFolderIds].filter(
                (id) => safeNodes[id] != null && safeNodes[id].type === 'folder'
              )
            )

            return { nodes: safeNodes, openTabs, activeTabId, expandedFolderIds }
          })
        } catch {
          // server unavailable
        } finally {
          set({ syncing: false })
        }
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({
        nodes: Object.fromEntries(
          Object.entries(s.nodes).map(([id, node]) => {
            const isSmallText =
              node.type === 'file' &&
              (node.ext === '.md' || node.ext === '.txt' || !node.ext) &&
              (node.content?.length ?? 0) < 50_000
            if (!isSmallText) {
              const { content, ...rest } = node
              return [id, rest]
            }
            return [id, node]
          }),
        ),
        openTabs: s.openTabs,
        activeTabId: s.activeTabId,
        expandedFolderIds: Array.from(s.expandedFolderIds),
        sortBy: s.sortBy,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<FileTreeState> & { expandedFolderIds?: string[] }
        return {
          ...current,
          ...p,
          openTabs: Array.isArray(p?.openTabs)
            ? (p.openTabs as TabItem[]).map((t) => ({ ...t, type: t.type ?? ('file' as const) }))
            : current.openTabs,
          expandedFolderIds: Array.isArray(p?.expandedFolderIds)
            ? new Set(p.expandedFolderIds)
            : current.expandedFolderIds,
        }
      },
    }
  )
)

export function clearFileTreePersistence() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore localStorage access errors
  }
  useFileTreeStore.setState({
    nodes: {},
    openTabs: [],
    activeTabId: null,
    expandedFolderIds: new Set<string>(),
    sortBy: 'name',
    syncing: false,
  })
}
