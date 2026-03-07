import { ColumnWidthOutlined, EditOutlined, EyeOutlined, SaveOutlined } from '@ant-design/icons'
import { useFileTreeStore } from '../store/fileTree'
import { useLayoutStore } from '../store/layout'
import TabContent from './TabContent'

function formatDocTime(ts: number): string {
  const d = new Date(ts)
  const m = d.getMonth() + 1
  const day = d.getDate()
  const h = d.getHours()
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${m}月${day}日 ${h}:${min}`
}

export default function FileContent() {
  const openTabs = useFileTreeStore((s) => s.openTabs)
  const activeTabId = useFileTreeStore((s) => s.activeTabId)
  const getNode = useFileTreeStore((s) => s.getNode)
  const docViewMode = useLayoutStore((s) => s.docViewMode)
  const setDocViewMode = useLayoutStore((s) => s.setDocViewMode)

  const fileTabs = openTabs.filter((t) => t.type === 'file')
  const activeTab = activeTabId ? fileTabs.find((t) => t.id === activeTabId) : null
  const activeNode = activeTab?.nodeId ? getNode(activeTab.nodeId) : null
  const isMd = activeNode?.type === 'file' && (activeNode.ext ?? '').toLowerCase() === '.md'

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--ide-bg)' }}>
      {/* Document toolbar */}
      {isMd && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 12px',
            borderBottom: '1px solid var(--ide-sidebar-border)',
            background: 'var(--ide-panel)',
            fontSize: 13,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {(['edit', 'split', 'preview'] as const).map((mode) => {
              const label = mode === 'edit' ? '编辑' : mode === 'split' ? '分屏' : '预览'
              const Icon = mode === 'edit' ? EditOutlined : mode === 'split' ? ColumnWidthOutlined : EyeOutlined
              const active = docViewMode === mode
              return (
                <span
                  key={mode}
                  onClick={() => setDocViewMode(mode)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setDocViewMode(mode)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 10px',
                    cursor: 'pointer',
                    borderRadius: 4,
                    color: active ? 'var(--ide-text)' : 'var(--ide-text-muted)',
                    background: active ? 'var(--ide-hover)' : 'transparent',
                  }}
                >
                  <Icon style={{ fontSize: 14 }} />
                  {label}
                </span>
              )
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--ide-text-muted)' }}>
            <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <SaveOutlined style={{ fontSize: 14 }} />
              保存
            </span>
            {activeNode?.updatedAt != null && (
              <span style={{ fontSize: 12 }}>{formatDocTime(activeNode.updatedAt)}</span>
            )}
          </div>
        </div>
      )}

      {/* Content - all file tabs rendered, inactive hidden */}
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {fileTabs.map((tab) => (
          <div
            key={tab.id}
            style={{
              display: tab.id === activeTabId ? 'flex' : 'none',
              flexDirection: 'column',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            {tab.nodeId && <TabContent nodeId={tab.nodeId} />}
          </div>
        ))}
      </div>
    </div>
  )
}
