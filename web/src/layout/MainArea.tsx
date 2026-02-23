import { Flex } from 'antd'
import { useLayoutStore } from '../store/layout'
import FileTree from '../components/FileTree'
import GraphView from '../components/GraphView'
import WhiteboardView from '../components/WhiteboardView'
import MainContent from './MainContent'
import MainNav from './MainNav'
import TerminalPanel from './TerminalPanel'

export default function MainArea() {
  const mainView = useLayoutStore((s) => s.mainView)
  const terminalVisible = useLayoutStore((s) => s.terminalVisible)

  const mainContent = (
    <>
      {mainView === 'files' && (
        <Flex vertical style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
          <MainNav />
          <Flex style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
            <div
              style={{
                width: 220,
                minWidth: 180,
                borderRight: '1px solid #f0f0f0',
                overflow: 'auto',
                background: '#fafafa',
              }}
            >
              <FileTree />
            </div>
            <MainContent />
          </Flex>
        </Flex>
      )}
      {mainView === 'whiteboard' && (
        <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
          <WhiteboardView />
        </div>
      )}
      {mainView === 'graph' && (
        <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
          <GraphView />
        </div>
      )}
    </>
  )

  return (
    <Flex vertical style={{ height: '100%', overflow: 'hidden' }}>
      <div style={{ flex: terminalVisible ? 2 : 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {mainContent}
      </div>
      {terminalVisible && (
        <div style={{ height: '33%', minHeight: 120, borderTop: '1px solid #f0f0f0' }}>
          <TerminalPanel />
        </div>
      )}
    </Flex>
  )
}
