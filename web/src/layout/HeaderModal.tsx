import { FileTextOutlined, SearchOutlined, StarOutlined } from '@ant-design/icons'
import { Input, List, Modal, Tabs } from 'antd'
import { useMemo, useState } from 'react'
import { useBookmarksStore } from '../store/bookmarks'
import { useFileTreeStore } from '../store/fileTree'

type HeaderModalProps = {
  open: boolean
  onClose: () => void
}

export default function HeaderModal({ open, onClose }: HeaderModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const nodes = useFileTreeStore((s) => s.nodes)
  const getNode = useFileTreeStore((s) => s.getNode)
  const openFile = useFileTreeStore((s) => s.openFile)
  const setExpanded = useFileTreeStore((s) => s.setExpanded)
  const nodeIds = useBookmarksStore((s) => s.nodeIds)

  const allFiles = useMemo(
    () =>
      Object.values(nodes)
        .filter((n) => n.type === 'file')
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [nodes]
  )

  const bookmarkedNodes = useMemo(
    () =>
      nodeIds
        .map((id) => getNode(id))
        .filter((n): n is NonNullable<typeof n> => !!n),
    [nodeIds, getNode]
  )

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    return allFiles.filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        (typeof n.content === 'string' && n.content.toLowerCase().includes(q))
    )
  }, [allFiles, searchQuery])

  const handleOpen = (nodeId: string) => {
    openFile(nodeId)
    onClose()
  }

  const handleOpenBookmark = (node: { id: string; type: 'file' | 'folder' }) => {
    if (node.type === 'file') openFile(node.id)
    else setExpanded(node.id, true)
    onClose()
  }

  return (
    <Modal
      title="菜单"
      open={open}
      onCancel={onClose}
      footer={null}
      width={420}
      styles={{ body: { padding: 0 } }}
    >
      <Tabs
        defaultActiveKey="articles"
        items={[
          {
            key: 'articles',
            label: (
              <span>
                <FileTextOutlined /> 所有文章
              </span>
            ),
            children: (
              <List
                style={{ maxHeight: 360, overflow: 'auto' }}
                dataSource={allFiles}
                rowKey="id"
                renderItem={(n) => (
                  <List.Item
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleOpen(n.id)}
                  >
                    {n.name}
                  </List.Item>
                )}
              />
            ),
          },
          {
            key: 'search',
            label: (
              <span>
                <SearchOutlined /> 搜索
              </span>
            ),
            children: (
              <div style={{ padding: 12 }}>
                <Input.Search
                  placeholder="搜索文件名或内容"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  allowClear
                  style={{ marginBottom: 12 }}
                />
                <List
                  style={{ maxHeight: 300, overflow: 'auto' }}
                  dataSource={searchResults}
                  rowKey="id"
                  renderItem={(n) => (
                    <List.Item
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleOpen(n.id)}
                    >
                      {n.name}
                    </List.Item>
                  )}
                />
                {searchQuery && searchResults.length === 0 && (
                  <div style={{ color: '#999', textAlign: 'center', padding: 24 }}>
                    无匹配结果
                  </div>
                )}
              </div>
            ),
          },
          {
            key: 'bookmarks',
            label: (
              <span>
                <StarOutlined /> 书签
              </span>
            ),
            children: (
              <>
                <List
                  style={{ maxHeight: 360, overflow: 'auto' }}
                  dataSource={bookmarkedNodes}
                  rowKey="id"
                  renderItem={(n) => (
                    <List.Item
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleOpenBookmark(n)}
                    >
                      {n.name}
                    </List.Item>
                  )}
                />
                {bookmarkedNodes.length === 0 && (
                  <div style={{ color: '#999', textAlign: 'center', padding: 24 }}>
                    暂无书签，在文件或文件夹上右键可添加书签
                  </div>
                )}
              </>
            ),
          },
        ]}
      />
    </Modal>
  )
}
