import { ApartmentOutlined, CodeOutlined, FormOutlined } from '@ant-design/icons'
import { Layout, Tooltip } from 'antd'
import { useFileTreeStore } from '../store/fileTree'
import { useLayoutStore } from '../store/layout'

const SIDEBAR_WIDTH = 48

export default function LeftIconSidebar() {
  const openSpecialTab = useFileTreeStore((s) => s.openSpecialTab)
  const activeTabId = useFileTreeStore((s) => s.activeTabId)
  const openTabs = useFileTreeStore((s) => s.openTabs)
  const terminalVisible = useLayoutStore((s) => s.terminalVisible)
  const toggleTerminal = useLayoutStore((s) => s.toggleTerminal)

  const activeTab = openTabs.find((t) => t.id === activeTabId)

  const iconSize = 16
  const iconBox = {
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    cursor: 'pointer',
  } as const

  return (
    <Layout.Sider
      width={SIDEBAR_WIDTH}
      style={{
        minWidth: SIDEBAR_WIDTH,
        maxWidth: SIDEBAR_WIDTH,
        background: 'var(--ide-sidebar)',
        borderRight: '1px solid var(--ide-sidebar-border)',
        flex: `0 0 ${SIDEBAR_WIDTH}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 16,
        gap: 8,
      }}
    >
      <Tooltip title="白板" placement="right">
        <span
          className="left-sidebar-icon"
          style={{
            ...iconBox,
            background: activeTab?.type === 'whiteboard' ? 'var(--ide-tab-active-bg)' : 'transparent',
            color: activeTab?.type === 'whiteboard' ? '#fff' : 'var(--ide-text-muted)',
          }}
          onClick={() => openSpecialTab('whiteboard')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && openSpecialTab('whiteboard')}
        >
          <FormOutlined style={{ fontSize: iconSize }} />
        </span>
      </Tooltip>
      <Tooltip title="关系图谱" placement="right">
        <span
          className="left-sidebar-icon"
          style={{
            ...iconBox,
            background: activeTab?.type === 'graph' ? 'var(--ide-tab-active-bg)' : 'transparent',
            color: activeTab?.type === 'graph' ? '#fff' : 'var(--ide-text-muted)',
          }}
          onClick={() => openSpecialTab('graph')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && openSpecialTab('graph')}
        >
          <ApartmentOutlined style={{ fontSize: iconSize }} />
        </span>
      </Tooltip>
      <Tooltip title="终端 CLI" placement="right">
        <span
          className="left-sidebar-icon"
          style={{
            ...iconBox,
            background: terminalVisible ? 'var(--ide-tab-active-bg)' : 'transparent',
            color: terminalVisible ? '#fff' : 'var(--ide-text-muted)',
          }}
          onClick={toggleTerminal}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && toggleTerminal()}
        >
          <CodeOutlined style={{ fontSize: iconSize }} />
        </span>
      </Tooltip>
    </Layout.Sider>
  )
}
