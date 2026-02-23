import { Tabs } from 'antd'
import { useFileTreeStore } from '../store/fileTree'
import TabContent from './TabContent'

export default function MainContent() {
  const openTabs = useFileTreeStore((s) => s.openTabs)
  const activeTabId = useFileTreeStore((s) => s.activeTabId)
  const setActiveTab = useFileTreeStore((s) => s.setActiveTab)
  const closeTab = useFileTreeStore((s) => s.closeTab)

  const items = openTabs.map((tab) => ({
    key: tab.id,
    label: tab.title,
    children: <TabContent nodeId={tab.nodeId} />,
    closable: true,
  }))

  if (items.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999',
          background: '#fafafa',
        }}
      >
        在左侧文件树点击文件打开，或新建文件
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Tabs
        type="editable-card"
        hideAdd
        activeKey={activeTabId ?? undefined}
        onChange={(k) => setActiveTab(k)}
        onEdit={(targetKey, action) => {
          if (action === 'remove' && targetKey) closeTab(String(targetKey))
        }}
        style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        items={items}
      />
    </div>
  )
}
