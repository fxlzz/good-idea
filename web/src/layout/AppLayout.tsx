import { Layout } from 'antd'
import { useState } from 'react'
import AIPanel from './AIPanel'
import HeaderBar from './HeaderBar'
import MainArea from './MainArea'
import ResizableSidebar, { SIDEBAR_DEFAULT } from './ResizableSidebar'

const { Content } = Layout

export default function AppLayout() {
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT)
  const [aiPanelOpen, setAiPanelOpen] = useState(false)

  return (
    <>
      <HeaderBar onToggleAI={() => setAiPanelOpen((o) => !o)} aiOpen={aiPanelOpen} />
      <Layout style={{ flexDirection: 'row', height: 'calc(100vh - 48px)' }}>
        <ResizableSidebar width={sidebarWidth} onWidthChange={setSidebarWidth} />
        <Content style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <MainArea />
        </Content>
        <AIPanel open={aiPanelOpen} onClose={() => setAiPanelOpen(false)} />
      </Layout>
    </>
  )
}
