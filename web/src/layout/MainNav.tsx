import { FolderAddOutlined, FileAddOutlined, SortAscendingOutlined } from '@ant-design/icons'
import { Button, Dropdown, Space } from 'antd'
import { useFileTreeStore } from '../store/fileTree'

function generateId(): string {
  return `n_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export default function MainNav() {
  const addNode = useFileTreeStore((s) => s.addNode)
  const setSortBy = useFileTreeStore((s) => s.setSortBy)
  const sortBy = useFileTreeStore((s) => s.sortBy)

  const handleNewFile = () => {
    addNode({
      id: generateId(),
      name: `未命名.md`,
      type: 'file',
      parentId: null,
      content: '',
    })
  }

  const handleNewFolder = () => {
    addNode({
      id: generateId(),
      name: '新文件夹',
      type: 'folder',
      parentId: null,
    })
  }

  const sortMenuItems = [
    { key: 'name', label: '按名称' },
    { key: 'updated', label: '按修改时间' },
  ]

  return (
    <div
      style={{
        padding: '8px 12px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <Space>
        <Button type="text" size="small" icon={<FileAddOutlined />} onClick={handleNewFile}>
          新增文件
        </Button>
        <Button type="text" size="small" icon={<FolderAddOutlined />} onClick={handleNewFolder}>
          新增文件夹
        </Button>
        <Dropdown
          menu={{
            items: sortMenuItems,
            selectedKeys: [sortBy],
            onClick: ({ key }) => setSortBy(key as 'name' | 'updated'),
          }}
          trigger={['click']}
        >
          <Button type="text" size="small" icon={<SortAscendingOutlined />}>
            排序
          </Button>
        </Dropdown>
      </Space>
      <span style={{ color: '#999', fontSize: 12, marginLeft: 8 }}>
        文件树
      </span>
    </div>
  )
}
