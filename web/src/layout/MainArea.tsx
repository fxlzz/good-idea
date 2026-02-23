import { Flex } from 'antd'
import { useLayoutStore } from '../store/layout'
import GraphView from '../components/GraphView'
import WhiteboardView from '../components/WhiteboardView'
import MainContent from './MainContent'
import TerminalPanel from './TerminalPanel'

export default function MainArea() {
  const mainView = useLayoutStore((s) => s.mainView)
  const terminalVisible = useLayoutStore((s) => s.terminalVisible)

  const mainContent = (
    <>
      {mainView === 'files' && (
        <Flex vertical style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
          <MainContent />
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
        <div style={{ height: '33%', minHeight: 120, borderTop: '1px solid var(--ide-sidebar-border)' }}>
          <TerminalPanel />
        </div>
      )}
    </Flex>
  )
}
