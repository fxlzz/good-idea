import {
  BookFilled,
  BookOutlined,
  DeleteOutlined,
  EditOutlined,
  FileAddOutlined,
  FileOutlined,
  FolderAddOutlined,
  FolderOpenOutlined,
  FolderOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import { Dropdown, Tree, message } from 'antd'
import type { DataNode } from 'antd/es/tree'
import type { MenuProps } from 'antd'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useBookmarksStore } from '../store/bookmarks'
import { useFileTreeStore } from '../store/fileTree'
import { useUploadFile } from '../hooks/useUploadFile'
import {
  ensureFileExtension,
  getExtension,
  isAllowedExtension,
  UNSUPPORTED_FILE_TYPE_MSG,
} from '../utils/fileTypes'
import { FILE_TREE_DRAG_MIME } from '../utils/markdownLinks'

function generateId(): string {
  return `n_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

// ── Inline input for creating a new file or folder ──────────────────────────
type PendingNew = { parentId: string | null; type: 'file' | 'folder' }

const NewNodeInput = memo(function NewNodeInput({
  parentId,
  type,
  onDone,
}: PendingNew & { onDone: () => void }) {
  const [value, setValue] = useState('')
  const addNode = useFileTreeStore((s) => s.addNode)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [])

  const commit = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed) {
      onDone()
      return
    }
    let finalName = trimmed
    if (type === 'file') {
      finalName = ensureFileExtension(trimmed)
      const ext = getExtension(finalName)
      if (!isAllowedExtension(ext)) {
        message.error(UNSUPPORTED_FILE_TYPE_MSG)
        onDone()
        return
      }
    }
    addNode({ id: generateId(), name: finalName, type, parentId })
    onDone()
  }, [value, type, parentId, addNode, onDone])

  return (
    <span className="ide-tree-node-title">
      <span className="ide-tree-node-rename-wrapper">
        <input
          ref={inputRef}
          className="ide-tree-node-rename-input"
          value={value}
          placeholder="文件名 (回车确认)"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation()
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') onDone()
          }}
          onBlur={commit}
          onClick={(e) => e.stopPropagation()}
        />
      </span>
    </span>
  )
})

// ── Tree node title ──────────────────────────────────────────────────────────
type NodeTitleProps = {
  nodeId: string
  name: string
  type: 'file' | 'folder'
  ext?: string
  isEditing: boolean
  onStartRename: () => void
  onStopRename: () => void
  onNewFile: () => void
  onNewFolder: () => void
}

const NodeTitle = memo(function NodeTitle({
  nodeId,
  name,
  type,
  ext,
  isEditing,
  onStartRename,
  onStopRename,
  onNewFile,
  onNewFolder,
}: NodeTitleProps) {
  const isBookmarked = useBookmarksStore((s) => s.nodeIds.includes(nodeId))
  const toggleBookmark = useBookmarksStore((s) => s.toggle)
  const updateNode = useFileTreeStore((s) => s.updateNode)
  const deleteNode = useFileTreeStore((s) => s.deleteNode)
  const renameInputRef = useRef<HTMLInputElement>(null)
  const { inputRef: fileInputRef, triggerUpload, handleFileChange } = useUploadFile(nodeId)
  const [editValue, setEditValue] = useState(name)

  useEffect(() => {
    if (isEditing) {
      setEditValue(name)
      requestAnimationFrame(() => {
        renameInputRef.current?.focus()
        renameInputRef.current?.select()
      })
    }
  }, [isEditing, name])

  const handleFolderMenu: MenuProps['onClick'] = useCallback(
    ({ key, domEvent }: { key: string; domEvent: React.MouseEvent | React.KeyboardEvent }) => {
      domEvent.stopPropagation()
      switch (key) {
        case 'newFile':
          onNewFile()
          break
        case 'newFolder':
          onNewFolder()
          break
        case 'upload':
          triggerUpload()
          break
        case 'rename':
          onStartRename()
          break
        case 'bookmark':
          toggleBookmark(nodeId)
          break
        case 'delete':
          deleteNode(nodeId)
          break
      }
    },
    [nodeId, deleteNode, toggleBookmark, onStartRename, onNewFile, onNewFolder, triggerUpload],
  )

  const handleFileMenu: MenuProps['onClick'] = useCallback(
    ({ key, domEvent }: { key: string; domEvent: React.MouseEvent | React.KeyboardEvent }) => {
      domEvent.stopPropagation()
      switch (key) {
        case 'rename':
          onStartRename()
          break
        case 'bookmark':
          toggleBookmark(nodeId)
          break
        case 'delete':
          deleteNode(nodeId)
          break
      }
    },
    [nodeId, toggleBookmark, onStartRename, deleteNode],
  )

  const handleBookmarkClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      toggleBookmark(nodeId)
    },
    [nodeId, toggleBookmark],
  )

  const canDragMdFile = type === 'file' && (ext ?? '').toLowerCase() === '.md' && !isEditing

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLSpanElement>) => {
      if (!canDragMdFile) {
        e.preventDefault()
        return
      }
      e.dataTransfer.setData(FILE_TREE_DRAG_MIME, nodeId)
      e.dataTransfer.effectAllowed = 'copy'
    },
    [canDragMdFile, nodeId],
  )

  const handleSaveRename = useCallback(() => {
    const trimmed = editValue.trim()
    if (!trimmed) {
      onStopRename()
      return
    }
    let finalName = trimmed
    if (type === 'file') {
      finalName = ensureFileExtension(trimmed)
      const ext = getExtension(finalName)
      if (!isAllowedExtension(ext)) {
        message.error(UNSUPPORTED_FILE_TYPE_MSG)
        onStopRename()
        return
      }
    }
    if (finalName !== name) {
      updateNode(nodeId, { name: finalName })
    }
    onStopRename()
  }, [editValue, name, nodeId, type, updateNode, onStopRename])

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation()
      if (e.key === 'Enter') handleSaveRename()
      if (e.key === 'Escape') onStopRename()
    },
    [handleSaveRename, onStopRename],
  )

  const renderName = () => {
    if (isEditing) {
      return (
        <span className="ide-tree-node-rename-wrapper">
          <input
            ref={renameInputRef}
            className="ide-tree-node-rename-input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSaveRename}
            onKeyDown={handleRenameKeyDown}
            onClick={(e) => e.stopPropagation()}
            aria-label="重命名"
          />
        </span>
      )
    }
    return <span className="ide-tree-node-name">{name}</span>
  }

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
      { type: 'divider' as const },
      { key: 'delete', icon: <DeleteOutlined />, label: '删除', danger: true },
    ],
    [isBookmarked],
  )

  if (type === 'folder') {
    return (
      <>
        <Dropdown
          getPopupContainer={() => document.body}
          overlayClassName="ide-tree-dropdown-menu"
          menu={{ items: folderMenuItems, onClick: handleFolderMenu }}
          trigger={['contextMenu']}
        >
          <span
            className="ide-tree-node-title"
            onContextMenu={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
          >
            {renderName()}
            <span className="ide-tree-node-actions">
              {isBookmarked && (
                <span
                  className="ide-tree-action-btn bookmark-active"
                  onClick={handleBookmarkClick}
                  role="button"
                >
                  <BookFilled />
                </span>
              )}
            </span>
          </span>
        </Dropdown>
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </>
    )
  }

  return (
    <Dropdown
      getPopupContainer={() => document.body}
      overlayClassName="ide-tree-dropdown-menu"
      menu={{ items: fileMenuItems, onClick: handleFileMenu }}
      trigger={['contextMenu']}
    >
      <span
        className="ide-tree-node-title"
        draggable={canDragMdFile}
        onDragStart={handleDragStart}
        onContextMenu={(e) => {
          e.stopPropagation()
          e.preventDefault()
        }}
      >
        {renderName()}
        <span className="ide-tree-node-actions">
          {isBookmarked && (
            <span
              className="ide-tree-action-btn bookmark-active"
              onClick={handleBookmarkClick}
              role="button"
            >
              <BookFilled />
            </span>
          )}
        </span>
      </span>
    </Dropdown>
  )
})

// ── FileTree root ────────────────────────────────────────────────────────────
export default function FileTree() {
  const nodes = useFileTreeStore((s) => s.nodes)
  const getChildren = useFileTreeStore((s) => s.getChildren)
  const expandedFolderIds = useFileTreeStore((s) => s.expandedFolderIds)
  const setExpandedIds = useFileTreeStore((s) => s.setExpandedIds)
  const setExpanded = useFileTreeStore((s) => s.setExpanded)
  const openFile = useFileTreeStore((s) => s.openFile)
  const pendingRootNew = useFileTreeStore((s) => s.pendingRootNew)
  const clearPendingRootNew = useFileTreeStore((s) => s.clearPendingRootNew)
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [pendingNew, setPendingNew] = useState<PendingNew | null>(null)

  const clearPending = useCallback(() => setPendingNew(null), [])

  useEffect(() => {
    if (!pendingRootNew) return
    setPendingNew({ parentId: null, type: pendingRootNew })
    clearPendingRootNew()
  }, [pendingRootNew, clearPendingRootNew])

  const treeData: DataNode[] = useMemo(() => {
    function build(parentId: string | null): DataNode[] {
      const list = getChildren(parentId)
      const result: DataNode[] = list.map((n) => {
        // Inject pending-new input as a child of this folder
        const pendingChild: DataNode[] =
          pendingNew?.parentId === n.id
            ? [
                {
                  key: `__pending__${n.id}`,
                  isLeaf: true,
                  icon:
                    pendingNew.type === 'folder' ? <FolderOutlined /> : <FileOutlined />,
                  title: (
                    <NewNodeInput
                      parentId={n.id}
                      type={pendingNew.type}
                      onDone={clearPending}
                    />
                  ),
                },
              ]
            : []

        return {
          key: n.id,
          title: (
            <NodeTitle
              nodeId={n.id}
              name={n.name}
              type={n.type}
              ext={n.ext}
              isEditing={editingNodeId === n.id}
              onStartRename={() => setEditingNodeId(n.id)}
              onStopRename={() => setEditingNodeId(null)}
              onNewFile={() => {
                setExpanded(n.id, true)
                setPendingNew({ parentId: n.id, type: 'file' })
              }}
              onNewFolder={() => {
                setExpanded(n.id, true)
                setPendingNew({ parentId: n.id, type: 'folder' })
              }}
            />
          ),
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
          children: n.type === 'folder' ? [...build(n.id), ...pendingChild] : undefined,
        }
      })

      if (parentId === null && pendingNew?.parentId === null) {
        result.push({
          key: '__pending__root',
          isLeaf: pendingNew.type === 'file',
          icon: pendingNew.type === 'folder' ? <FolderOutlined /> : <FileOutlined />,
          title: (
            <NewNodeInput
              parentId={null}
              type={pendingNew.type}
              onDone={clearPending}
            />
          ),
        })
      }

      return result
    }
    return build(null)
  }, [nodes, getChildren, expandedFolderIds, editingNodeId, pendingNew, setExpanded, clearPending])

  const expandedKeys = useMemo(() => Array.from(expandedFolderIds), [expandedFolderIds])

  const onExpand = (keys: React.Key[]) => {
    setExpandedIds(keys.map((k) => String(k)))
  }

  const onSelect = (_: React.Key[], info: { node: { key: React.Key } }) => {
    const key = String(info.node.key)
    if (key.startsWith('__pending__')) return
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
