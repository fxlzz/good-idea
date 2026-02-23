import { ApartmentOutlined, CodeOutlined, FormOutlined } from '@ant-design/icons'
import { Layout, Tooltip } from 'antd'
import { useLayoutStore } from '../store/layout'

const SIDEBAR_WIDTH = 56

export default function LeftIconSidebar() {
  const mainView = useLayoutStore((s) => s.mainView)
  const terminalVisible = useLayoutStore((s) => s.terminalVisible)
  const setMainView = useLayoutStore((s) => s.setMainView)
  const toggleTerminal = useLayoutStore((s) => s.toggleTerminal)

  const iconSize = 20
  const iconBox = {
    width: 40,
    height: 40,
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
          style={{
            ...iconBox,
            background: mainView === 'whiteboard' ? 'var(--ide-accent)' : 'transparent',
            color: mainView === 'whiteboard' ? '#fff' : 'var(--ide-text-muted)',
          }}
          onClick={() => setMainView('whiteboard')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setMainView('whiteboard')}
        >
          <FormOutlined style={{ fontSize: iconSize }} />
        </span>
      </Tooltip>
      <Tooltip title="关系图谱" placement="right">
        <span
          style={{
            ...iconBox,
            background: mainView === 'graph' ? 'var(--ide-accent)' : 'transparent',
            color: mainView === 'graph' ? '#fff' : 'var(--ide-text-muted)',
          }}
          onClick={() => setMainView('graph')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setMainView('graph')}
        >
          <ApartmentOutlined style={{ fontSize: iconSize }} />
        </span>
      </Tooltip>
      <Tooltip title="终端 CLI" placement="right">
        <span
          style={{
            ...iconBox,
            background: terminalVisible ? 'var(--ide-accent)' : 'transparent',
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
