import { CloseOutlined, ColumnWidthOutlined, EditOutlined, EyeOutlined, SaveOutlined } from '@ant-design/icons'
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

export default function MainContent() {
  const openTabs = useFileTreeStore((s) => s.openTabs)
  const activeTabId = useFileTreeStore((s) => s.activeTabId)
  const setActiveTab = useFileTreeStore((s) => s.setActiveTab)
  const closeTab = useFileTreeStore((s) => s.closeTab)
  const getNode = useFileTreeStore((s) => s.getNode)
  const docViewMode = useLayoutStore((s) => s.docViewMode)
  const setDocViewMode = useLayoutStore((s) => s.setDocViewMode)

  const activeTab = activeTabId ? openTabs.find((t) => t.id === activeTabId) : null
  const activeNode = activeTab ? getNode(activeTab.nodeId) : null
  const isMd = activeNode?.type === 'file' && (activeNode.ext ?? '').toLowerCase() === '.md'

  if (openTabs.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--ide-text-muted)',
          background: 'var(--ide-bg)',
        }}
      >
        在左侧文件树点击文件打开，或新建文件
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--ide-bg)' }}>
      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid var(--ide-sidebar-border)',
          background: 'var(--ide-tab-bg)',
          minHeight: 40,
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
                gap: 6,
                padding: '8px 12px',
                cursor: 'pointer',
                color: isActive ? 'var(--ide-text)' : 'var(--ide-text-muted)',
                borderBottom: isActive ? `2px solid var(--ide-accent)` : '2px solid transparent',
                background: isActive ? 'var(--ide-tab-active-bg)' : 'transparent',
                fontSize: 13,
              }}
            >
              <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                style={{ display: 'flex', padding: 2 }}
              >
                <CloseOutlined style={{ fontSize: 12 }} />
              </span>
            </div>
          )
        })}
      </div>

      {/* Document toolbar: 编辑 | 分屏 | 预览, 保存, 时间 */}
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

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {openTabs.map((tab) => (
          <div
            key={tab.id}
            style={{
              display: tab.id === activeTabId ? 'flex' : 'none',
              flexDirection: 'column',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            <TabContent nodeId={tab.nodeId} />
          </div>
        ))}
      </div>
    </div>
  )
}
