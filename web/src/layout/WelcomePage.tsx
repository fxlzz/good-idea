import {
  ApartmentOutlined,
  CodeOutlined,
  FileAddOutlined,
  FileTextOutlined,
  FormOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'
import { useFileTreeStore } from '../store/fileTree'
import { useLayoutStore } from '../store/layout'

function generateId(): string {
  return `n_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}

type QuickAction = {
  icon: ReactNode
  iconBg: string
  title: string
  subtitle: string
  onClick: () => void
}

export default function WelcomePage() {
  const addNode = useFileTreeStore((s) => s.addNode)
  const openFile = useFileTreeStore((s) => s.openFile)
  const openSpecialTab = useFileTreeStore((s) => s.openSpecialTab)
  const getRecentFiles = useFileTreeStore((s) => s.getRecentFiles)
  const toggleTerminal = useLayoutStore((s) => s.toggleTerminal)

  const recentFiles = getRecentFiles(5)

  const handleNewFile = () => {
    const id = generateId()
    addNode({ id, name: '未命名.md', type: 'file', parentId: null, content: '' })
    openFile(id)
  }

  const actions: QuickAction[] = [
    {
      icon: <FileAddOutlined style={{ fontSize: 20 }} />,
      iconBg: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      title: '新建文件',
      subtitle: '创建 Markdown 文档',
      onClick: handleNewFile,
    },
    {
      icon: <FormOutlined style={{ fontSize: 20 }} />,
      iconBg: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
      title: '打开白板',
      subtitle: '自由绘图与记录',
      onClick: () => openSpecialTab('whiteboard'),
    },
    {
      icon: <ApartmentOutlined style={{ fontSize: 20 }} />,
      iconBg: 'linear-gradient(135deg, #10b981, #34d399)',
      title: '知识图谱',
      subtitle: '查看文件关联',
      onClick: () => openSpecialTab('graph'),
    },
    {
      icon: <CodeOutlined style={{ fontSize: 20 }} />,
      iconBg: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
      title: '打开终端',
      subtitle: 'CLI 命令行工具',
      onClick: toggleTerminal,
    },
  ]

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--ide-bg)',
        overflow: 'auto',
        padding: '40px 24px',
        gap: 32,
      }}
    >
      {/* Logo + Welcome */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <FileTextOutlined style={{ fontSize: 28, color: '#fff' }} />
        </div>
        <h2 style={{ margin: 0, color: 'var(--ide-text)', fontSize: 22, fontWeight: 600 }}>
          欢迎回来，admin 👋
        </h2>
        <p style={{ margin: '8px 0 0', color: 'var(--ide-text-muted)', fontSize: 14 }}>
          选择一个文件开始，或使用下方快速入口
        </p>
      </div>

      {/* Quick Actions 2x2 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
          width: '100%',
          maxWidth: 520,
        }}
      >
        {actions.map((a) => (
          <div
            key={a.title}
            onClick={a.onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && a.onClick()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '16px 18px',
              borderRadius: 10,
              background: 'var(--ide-panel)',
              border: '1px solid var(--ide-sidebar-border)',
              cursor: 'pointer',
              transition: 'background .15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ide-hover)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--ide-panel)' }}
          >
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: a.iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {a.icon}
            </span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ide-text)' }}>
                {a.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ide-text-muted)', marginTop: 2 }}>
                {a.subtitle}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Files */}
      {recentFiles.length > 0 && (
        <div style={{ width: '100%', maxWidth: 520 }}>
          <div style={{ fontSize: 13, color: 'var(--ide-text-muted)', marginBottom: 8 }}>
            最近文件
          </div>
          <div
            style={{
              borderRadius: 10,
              background: 'var(--ide-panel)',
              border: '1px solid var(--ide-sidebar-border)',
              overflow: 'hidden',
            }}
          >
            {recentFiles.map((f) => (
              <div
                key={f.id}
                onClick={() => openFile(f.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && openFile(f.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--ide-sidebar-border)',
                  transition: 'background .15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ide-hover)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <FileTextOutlined style={{ fontSize: 14, color: 'var(--ide-text-muted)' }} />
                <span style={{ flex: 1, fontSize: 13, color: 'var(--ide-text)' }}>{f.name}</span>
                <span style={{ fontSize: 12, color: 'var(--ide-text-muted)', flexShrink: 0 }}>
                  {formatDate(f.updatedAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
