import {
  BookFilled,
  BookOutlined,
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
  FileAddOutlined,
  FileOutlined,
  FolderAddOutlined,
  FolderOpenOutlined,
  FolderOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import { Dropdown, Tree } from 'antd'
import type { DataNode } from 'antd/es/tree'
import type { MenuProps } from 'antd'
import { memo, useCallback, useMemo, useRef } from 'react'
import { useBookmarksStore } from '../store/bookmarks'
import { useFileTreeStore } from '../store/fileTree'

function generateId(): string {
  return `n_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

const NodeTitle = memo(function NodeTitle({
  nodeId,
  name,
  type,
}: {
  nodeId: string
  name: string
  type: 'file' | 'folder'
}) {
  const isBookmarked = useBookmarksStore((s) => s.nodeIds.includes(nodeId))
  const toggleBookmark = useBookmarksStore((s) => s.toggle)
  const addNode = useFileTreeStore((s) => s.addNode)
  const updateNode = useFileTreeStore((s) => s.updateNode)
  const deleteNode = useFileTreeStore((s) => s.deleteNode)
  const setExpanded = useFileTreeStore((s) => s.setExpanded)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFolderMenu: MenuProps['onClick'] = useCallback(
    ({ key, domEvent }: { key: string; domEvent: React.MouseEvent | React.KeyboardEvent }) => {
      domEvent.stopPropagation()
      switch (key) {
        case 'newFile': {
          const fileName = window.prompt('请输入文件名')
          if (fileName?.trim()) {
            addNode({
              id: generateId(),
              name: fileName.trim(),
              type: 'file',
              parentId: nodeId,
            })
            setExpanded(nodeId, true)
          }
          break
        }
        case 'newFolder': {
          const folderName = window.prompt('请输入文件夹名')
          if (folderName?.trim()) {
            addNode({
              id: generateId(),
              name: folderName.trim(),
              type: 'folder',
              parentId: nodeId,
            })
            setExpanded(nodeId, true)
          }
          break
        }
        case 'upload':
          fileInputRef.current?.click()
          break
        case 'rename': {
          const newName = window.prompt('请输入新名称', name)
          if (newName?.trim() && newName.trim() !== name) {
            updateNode(nodeId, { name: newName.trim() })
          }
          break
        }
        case 'bookmark':
          toggleBookmark(nodeId)
          break
        case 'delete':
          deleteNode(nodeId)
          break
      }
    },
    [nodeId, name, addNode, updateNode, deleteNode, setExpanded, toggleBookmark],
  )

  const handleFileMenu: MenuProps['onClick'] = useCallback(
    ({ key, domEvent }: { key: string; domEvent: React.MouseEvent | React.KeyboardEvent }) => {
      domEvent.stopPropagation()
      switch (key) {
        case 'rename': {
          const newName = window.prompt('请输入新名称', name)
          if (newName?.trim() && newName.trim() !== name) {
            updateNode(nodeId, { name: newName.trim() })
          }
          break
        }
        case 'bookmark':
          toggleBookmark(nodeId)
          break
      }
    },
    [nodeId, name, updateNode, toggleBookmark],
  )

  const handleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        addNode({
          id: generateId(),
          name: file.name,
          type: 'file',
          parentId: nodeId,
          content: reader.result as string,
        })
        setExpanded(nodeId, true)
      }
      reader.readAsText(file)
      e.target.value = ''
    },
    [nodeId, addNode, setExpanded],
  )

  const handleBookmarkClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      toggleBookmark(nodeId)
    },
    [nodeId, toggleBookmark],
  )

  const folderMenuItems: MenuProps['items'] = useMemo(
    () => [
      { key: 'newFile', icon: <FileAddOutlined />, label: '新建文件' },
      { key: 'newFolder', icon: <FolderAddOutlined />, label: '新建文件夹' },
      { key: 'upload', icon: <UploadOutlined />, label: '上传文件' },
      { type: 'divider' as const },
      { key: 'rename', icon: <EditOutlined />, label: '重命名' },
      {
        key: 'bookmark',
        icon: isBookmarked ? <BookFilled /> : <BookOutlined />,
        label: isBookmarked ? '取消书签' : '添加书签',
      },
      { type: 'divider' as const },
      { key: 'delete', icon: <DeleteOutlined />, label: '删除', danger: true },
    ],
    [isBookmarked],
  )

  const fileMenuItems: MenuProps['items'] = useMemo(
    () => [
      { key: 'rename', icon: <EditOutlined />, label: '重命名' },
      {
        key: 'bookmark',
        icon: isBookmarked ? <BookFilled /> : <BookOutlined />,
        label: isBookmarked ? '取消书签' : '添加书签',
      },
    ],
    [isBookmarked],
  )

  if (type === 'folder') {
    return (
      <span className="ide-tree-node-title">
        <span className="ide-tree-node-name">{name}</span>
        <span className="ide-tree-node-actions">
          <Dropdown
            menu={{ items: folderMenuItems, onClick: handleFolderMenu }}
            trigger={['click']}
          >
            <span
              className="ide-tree-action-btn"
              onClick={(e) => e.stopPropagation()}
              role="button"
            >
              <EllipsisOutlined />
            </span>
          </Dropdown>
        </span>
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleUpload}
        />
      </span>
    )
  }

  return (
    <span className="ide-tree-node-title">
      <span className="ide-tree-node-name">{name}</span>
      <span className="ide-tree-node-actions">
        <span
          className={`ide-tree-action-btn ${isBookmarked ? 'bookmark-active' : ''}`}
          onClick={handleBookmarkClick}
          role="button"
        >
          {isBookmarked ? <BookFilled /> : <BookOutlined />}
        </span>
        <Dropdown
          menu={{ items: fileMenuItems, onClick: handleFileMenu }}
          trigger={['click']}
        >
          <span
            className="ide-tree-action-btn"
            onClick={(e) => e.stopPropagation()}
            role="button"
          >
            <EllipsisOutlined />
          </span>
        </Dropdown>
      </span>
    </span>
  )
})

export default function FileTree() {
  const nodes = useFileTreeStore((s) => s.nodes)
  const getChildren = useFileTreeStore((s) => s.getChildren)
  const expandedFolderIds = useFileTreeStore((s) => s.expandedFolderIds)
  const setExpandedIds = useFileTreeStore((s) => s.setExpandedIds)
  const openFile = useFileTreeStore((s) => s.openFile)

  const treeData: DataNode[] = useMemo(() => {
    function build(parentId: string | null): DataNode[] {
      const list = getChildren(parentId)
      return list.map((n) => ({
        key: n.id,
        title: <NodeTitle nodeId={n.id} name={n.name} type={n.type} />,
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

  const onSelect = (_: React.Key[], info: { node: { key: React.Key } }) => {
    const key = String(info.node.key)
    const node = useFileTreeStore.getState().getNode(key)
    if (node?.type === 'file') openFile(key)
  }

  return (
    <Tree
      className="ide-tree"
      showIcon
      blockNode
      expandedKeys={expandedKeys}
      onExpand={onExpand}
      treeData={treeData}
      onSelect={onSelect}
      style={{ padding: '8px 0', background: 'var(--ide-tree-bg)', minHeight: '100%' }}
    />
  )
}
