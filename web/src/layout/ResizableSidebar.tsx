import { ApartmentOutlined, CodeOutlined, FileTextOutlined, FormOutlined } from '@ant-design/icons'
import { Layout, Tooltip } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { useLayoutStore } from '../store/layout'

const SIDEBAR_MIN = 56
const SIDEBAR_MAX = 280

type ResizableSidebarProps = {
  width: number
  onWidthChange: (w: number) => void
}

export default function ResizableSidebar({ width, onWidthChange }: ResizableSidebarProps) {
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)
  const startW = useRef(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setDragging(true)
    startX.current = e.clientX
    startW.current = width
  }

  useEffect(() => {
    if (!dragging) return
    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX.current
      const next = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startW.current + delta))
      onWidthChange(next)
    }
    const handleMouseUp = () => setDragging(false)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging, onWidthChange])

  return (
    <>
      <Layout.Sider
        width={width}
        style={{
          minWidth: width,
          maxWidth: width,
          background: '#fafafa',
          borderRight: '1px solid #f0f0f0',
          flex: `0 0 ${width}px`,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 16, gap: 8 }}>
          <Tooltip title="文件" placement="right">
            <span
              style={{ cursor: 'pointer', padding: 8 }}
              role="button"
              tabIndex={0}
              onClick={() => useLayoutStore.getState().setMainView('files')}
            >
              <FileTextOutlined style={{ fontSize: 20 }} />
            </span>
          </Tooltip>
          <Tooltip title="白板" placement="right">
            <span
              style={{ cursor: 'pointer', padding: 8 }}
              role="button"
              tabIndex={0}
              onClick={() => useLayoutStore.getState().setMainView('whiteboard')}
            >
              <FormOutlined style={{ fontSize: 20 }} />
            </span>
          </Tooltip>
          <Tooltip title="知识图谱" placement="right">
            <span
              style={{ cursor: 'pointer', padding: 8 }}
              role="button"
              tabIndex={0}
              onClick={() => useLayoutStore.getState().setMainView('graph')}
            >
              <ApartmentOutlined style={{ fontSize: 20 }} />
            </span>
          </Tooltip>
          <Tooltip title="终端 CLI" placement="right">
            <span
              style={{ cursor: 'pointer', padding: 8 }}
              role="button"
              tabIndex={0}
              onClick={() => useLayoutStore.getState().toggleTerminal()}
            >
              <CodeOutlined style={{ fontSize: 20 }} />
            </span>
          </Tooltip>
        </div>
      </Layout.Sider>
      <div
        role="separator"
        onMouseDown={handleMouseDown}
        style={{
          width: 4,
          cursor: 'col-resize',
          background: dragging ? '#1890ff' : 'transparent',
          flexShrink: 0,
        }}
      />
    </>
  )
}
