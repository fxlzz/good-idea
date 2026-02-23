import { FileOutlined, FolderOutlined, FolderOpenOutlined } from '@ant-design/icons'
import { Tree } from 'antd'
import type { DataNode } from 'antd/es/tree'
import { useEffect, useMemo, useState } from 'react'
import { useBookmarksStore } from '../store/bookmarks'
import { useFileTreeStore } from '../store/fileTree'

export default function FileTree() {
  const nodes = useFileTreeStore((s) => s.nodes)
  const getChildren = useFileTreeStore((s) => s.getChildren)
  const getNode = useFileTreeStore((s) => s.getNode)
  const expandedFolderIds = useFileTreeStore((s) => s.expandedFolderIds)
  const setExpandedIds = useFileTreeStore((s) => s.setExpandedIds)
  const openFile = useFileTreeStore((s) => s.openFile)
  const hasBookmark = useBookmarksStore((s) => s.has)
  const toggleBookmark = useBookmarksStore((s) => s.toggle)
  const [contextNodeId, setContextNodeId] = useState<string | null>(null)
  const [contextPos, setContextPos] = useState({ x: 0, y: 0 })

  const treeData: DataNode[] = useMemo(() => {
    function build(parentId: string | null): DataNode[] {
      const list = getChildren(parentId)
      return list.map((n) => ({
        key: n.id,
        title: n.name,
        isLeaf: n.type === 'file',
        icon:
          n.type === 'folder' ? (
            expandedFolderIds.has(n.id) ? (
              <FolderOpenOutlined />
            ) : (
              <FolderOutlined />
            )
          ) : (
            <FileOutlined />
          ),
        children: n.type === 'folder' ? build(n.id) : undefined,
      }))
    }
    return build(null)
  }, [nodes, getChildren, expandedFolderIds])

  const expandedKeys = useMemo(() => Array.from(expandedFolderIds), [expandedFolderIds])

  const onExpand = (keys: React.Key[]) => {
    setExpandedIds(keys.map((k) => String(k)))
  }

  const onSelect = (
    _: React.Key[],
    info: { node: { key: React.Key } }
  ) => {
    const key = String(info.node.key)
    const node = useFileTreeStore.getState().getNode(key)
    if (node?.type === 'file') openFile(key)
  }

  const onRightClick = (info: { event: React.MouseEvent; node: DataNode }) => {
    info.event.preventDefault()
    const key = info.node.key as string
    const node = getNode(key)
    if (node?.type === 'file') {
      setContextNodeId(key)
      setContextPos({ x: info.event.clientX, y: info.event.clientY })
    }
  }

  const handleBookmarkClick = () => {
    if (contextNodeId) toggleBookmark(contextNodeId)
    setContextNodeId(null)
  }

  useEffect(() => {
    if (!contextNodeId) return
    const close = () => setContextNodeId(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [contextNodeId])

  return (
    <>
    <Tree
      showIcon
      blockNode
      expandedKeys={expandedKeys}
      onExpand={onExpand}
      treeData={treeData}
      onSelect={onSelect}
      onRightClick={onRightClick}
      style={{ padding: '8px 0' }}
    />
    {contextNodeId && (
      <div
        style={{
          position: 'fixed',
          left: contextPos.x,
          top: contextPos.y,
          background: '#fff',
          border: '1px solid #f0f0f0',
          borderRadius: 4,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 1000,
          padding: '4px 0',
          minWidth: 120,
        }}
      >
        <div
          style={{ padding: '8px 12px', cursor: 'pointer' }}
          onClick={handleBookmarkClick}
          role="button"
          tabIndex={0}
        >
          {hasBookmark(contextNodeId) ? '移除书签' : '添加书签'}
        </div>
      </div>
    )}
    </>
  )
}
