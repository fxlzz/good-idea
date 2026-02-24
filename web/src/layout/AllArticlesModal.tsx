import { FileTextOutlined, SearchOutlined, StarOutlined } from '@ant-design/icons'
import { Input, List, Modal, Tabs } from 'antd'
import { useMemo, useState } from 'react'
import { useBookmarksStore } from '../store/bookmarks'
import { useFileTreeStore } from '../store/fileTree'

type AllArticlesModalProps = {
  open: boolean
  onClose: () => void
}

function formatDate(ts: number) {
  const d = new Date(ts)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}

function snippet(text: string, maxLen: number) {
  if (!text || typeof text !== 'string') return ''
  const t = text.trim().replace(/\s+/g, ' ')
  return t.length <= maxLen ? t : t.slice(0, maxLen) + '...'
}

export default function AllArticlesModal({ open, onClose }: AllArticlesModalProps) {
  const [filter, setFilter] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'bookmarks'>('all')
  const nodes = useFileTreeStore((s) => s.nodes)
  const getNode = useFileTreeStore((s) => s.getNode)
  const openFile = useFileTreeStore((s) => s.openFile)
  const nodeIds = useBookmarksStore((s) => s.nodeIds)

  const allFiles = useMemo(
    () =>
      Object.values(nodes)
        .filter((n) => n.type === 'file')
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [nodes]
  )

  const bookmarkedFiles = useMemo(
    () =>
      nodeIds
        .map((id) => getNode(id))
        .filter((n): n is NonNullable<typeof n> => !!n && n.type === 'file'),
    [nodeIds, getNode]
  )

  const filteredAll = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return allFiles
    return allFiles.filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        (typeof n.content === 'string' && n.content.toLowerCase().includes(q))
    )
  }, [allFiles, filter])

  const filteredBookmarks = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return bookmarkedFiles
    return bookmarkedFiles.filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        (typeof n.content === 'string' && n.content.toLowerCase().includes(q))
    )
  }, [bookmarkedFiles, filter])

  const list = activeTab === 'all' ? filteredAll : filteredBookmarks
  const totalLabel =
    activeTab === 'all'
      ? `共 ${filteredAll.length} 篇文章`
      : `共 ${filteredBookmarks.length} 篇书签`

  const handleOpen = (nodeId: string) => {
    openFile(nodeId)
    onClose()
  }

  return (
    <Modal
      title="所有文章"
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
      styles={{
        body: { padding: 0 },
        header: { borderBottom: '1px solid var(--ide-sidebar-border)' },
      }}
      style={{ paddingBottom: 0 }}
    >
      <Tabs
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as 'all' | 'bookmarks')}
        style={{ padding: '0 16px' }}
        items={[
          {
            key: 'all',
            label: '全部',
          },
          {
            key: 'bookmarks',
            label: (
              <span>
                <StarOutlined style={{ marginRight: 4 }} /> 书签
              </span>
            ),
          },
        ]}
      />
      <div style={{ padding: '0 16px 12px' }}>
        <Input
          prefix={<SearchOutlined style={{ color: 'var(--ide-text-muted)' }} />}
          placeholder="筛选文章..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          allowClear
          style={{ marginBottom: 12 }}
        />
        <List
          style={{ maxHeight: 360, overflow: 'auto' }}
          dataSource={list}
          rowKey="id"
          renderItem={(n) => (
            <List.Item
              style={{
                cursor: 'pointer',
                padding: '12px 0',
                borderBottom: '1px solid var(--ide-sidebar-border)',
              }}
              onClick={() => handleOpen(n.id)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%', gap: 12 }}>
                <FileTextOutlined
                  style={{ marginTop: 2, color: 'var(--ide-text-muted)', fontSize: 16 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>{n.name}</div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--ide-text-muted)',
                      lineHeight: 1.4,
                    }}
                  >
                    {snippet(n.content ?? '', 80)}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--ide-text-muted)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  🕐 {formatDate(n.updatedAt)}
                </span>
              </div>
            </List.Item>
          )}
        />
        <div
          style={{
            paddingTop: 12,
            fontSize: 12,
            color: 'var(--ide-text-muted)',
          }}
        >
          {totalLabel}
        </div>
      </div>
    </Modal>
  )
}
