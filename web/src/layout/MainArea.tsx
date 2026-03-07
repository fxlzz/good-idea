import {
  ApartmentOutlined,
  CloseOutlined,
  FormOutlined,
} from '@ant-design/icons'
import { Flex } from 'antd'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import GraphView from '../components/GraphView'
import WhiteboardView from '../components/WhiteboardView'
import { useFileTreeStore } from '../store/fileTree'
import { useLayoutStore } from '../store/layout'
import FileContent from './FileContent'
import TerminalPanel from './TerminalPanel'
import WelcomePage from './WelcomePage'

const TAB_ICONS: Record<string, ReactNode> = {
  whiteboard: <FormOutlined style={{ fontSize: 12 }} />,
  graph: <ApartmentOutlined style={{ fontSize: 12 }} />,
}

export default function MainArea() {
  const openTabs = useFileTreeStore((s) => s.openTabs)
  const activeTabId = useFileTreeStore((s) => s.activeTabId)
  const setActiveTab = useFileTreeStore((s) => s.setActiveTab)
  const closeTab = useFileTreeStore((s) => s.closeTab)
  const terminalVisible = useLayoutStore((s) => s.terminalVisible)

  const activeTab = useMemo(
    () => openTabs.find((t) => t.id === activeTabId) ?? null,
    [openTabs, activeTabId],
  )

  const hasFileTabs = openTabs.some((t) => t.type === 'file')
  const hasWhiteboard = openTabs.some((t) => t.type === 'whiteboard')
  const hasGraph = openTabs.some((t) => t.type === 'graph')
  const showWelcome = openTabs.length === 0

  return (
    <Flex vertical style={{ height: '100%', overflow: 'hidden' }}>
      {/* Tab bar */}
      {!showWelcome && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--ide-tab-bg)',
            borderBottom: '1px solid var(--ide-sidebar-border)',
            minHeight: 36,
            flexShrink: 0,
            overflow: 'auto',
          }}
        >
          {openTabs.map((tab) => {
            const isActive = tab.id === activeTabId
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: 13,
                  whiteSpace: 'nowrap',
                  color: isActive ? 'var(--ide-text)' : 'var(--ide-text-muted)',
                  borderBottom: isActive ? '2px solid var(--ide-accent)' : '2px solid transparent',
                  background: isActive ? 'var(--ide-tab-active-bg)' : 'transparent',
                  transition: 'color .15s, background .15s',
                }}
              >
                {TAB_ICONS[tab.type] ?? null}
                <span
                  style={{
                    maxWidth: 140,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {tab.title}
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    closeTab(tab.id)
                  }}
                  onKeyDown={(e) => {
                    e.stopPropagation()
                    if (e.key === 'Enter') closeTab(tab.id)
                  }}
                  style={{ display: 'flex', padding: 2, borderRadius: 3 }}
                >
                  <CloseOutlined style={{ fontSize: 10 }} />
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Content */}
      <div
        style={{
          flex: terminalVisible ? 2 : 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {showWelcome && <WelcomePage />}

        {hasWhiteboard && (
          <div
            style={{
              flex: 1,
              overflow: 'hidden',
              display: activeTab?.type === 'whiteboard' ? 'flex' : 'none',
            }}
          >
            <WhiteboardView />
          </div>
        )}

        {hasGraph && (
          <div
            style={{
              flex: 1,
              overflow: 'hidden',
              display: activeTab?.type === 'graph' ? 'flex' : 'none',
            }}
          >
            <GraphView />
          </div>
        )}

        {hasFileTabs && (
          <div
            style={{
              flex: 1,
              overflow: 'hidden',
              display: activeTab?.type === 'file' ? 'flex' : 'none',
              flexDirection: 'column',
            }}
          >
            <FileContent />
          </div>
        )}
      </div>

      {/* Terminal */}
      {terminalVisible && (
        <div
          style={{
            height: '33%',
            minHeight: 120,
            borderTop: '1px solid var(--ide-sidebar-border)',
          }}
        >
          <TerminalPanel />
        </div>
      )}
    </Flex>
  )
}
