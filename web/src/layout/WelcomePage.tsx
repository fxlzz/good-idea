import {
  ApartmentOutlined,
  CodeOutlined,
  FileAddOutlined,
  FileTextOutlined,
  FormOutlined,
} from '@ant-design/icons'
import type { KeyboardEvent, ReactNode } from 'react'
import { useCallback, useMemo } from 'react'
import { useAuthStore } from '../store/auth'
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
  fg: string
  border: string
  title: string
  subtitle: string
  onClick: () => void
}

export default function WelcomePage() {
  const user = useAuthStore((s) => s.user)
  const addNode = useFileTreeStore((s) => s.addNode)
  const openFile = useFileTreeStore((s) => s.openFile)
  const openSpecialTab = useFileTreeStore((s) => s.openSpecialTab)
  const getRecentFiles = useFileTreeStore((s) => s.getRecentFiles)
  const toggleTerminal = useLayoutStore((s) => s.toggleTerminal)

  const recentFiles = getRecentFiles(5)

  const handleNewFile = useCallback(() => {
    const id = generateId()
    addNode({ id, name: '未命名.md', type: 'file', parentId: null, content: '' })
    openFile(id)
  }, [addNode, openFile])

  const handleOpenWhiteboard = useCallback(() => openSpecialTab('whiteboard'), [openSpecialTab])
  const handleOpenGraph = useCallback(() => openSpecialTab('graph'), [openSpecialTab])
  const handleToggleTerminal = useCallback(() => toggleTerminal(), [toggleTerminal])

  const actions: QuickAction[] = useMemo(
    () => [
      {
        icon: <FileAddOutlined style={{ fontSize: 20 }} />,
        fg: '#407abd',
        border: '#4b9cf5',
        title: '新建文件',
        subtitle: '创建 Markdown 文档',
        onClick: handleNewFile,
      },
      {
        icon: <FormOutlined style={{ fontSize: 20 }} />,
        fg: '#a78bfa',
        border: '#a78bfa',
        title: '打开白板',
        subtitle: '自由绘图与记录',
        onClick: handleOpenWhiteboard,
      },
      {
        icon: <ApartmentOutlined style={{ fontSize: 20 }} />,
        fg: '#34d399',
        border: '#34d399',
        title: '知识图谱',
        subtitle: '查看文件关联',
        onClick: handleOpenGraph,
      },
      {
        icon: <CodeOutlined style={{ fontSize: 20 }} />,
        fg: '#e2ae24',
        border: '#fbbf24',
        title: '打开终端',
        subtitle: 'CLI 命令行工具',
        onClick: handleToggleTerminal,
      },
    ],
    [handleNewFile, handleOpenWhiteboard, handleOpenGraph, handleToggleTerminal],
  )

  const handleActionKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>, onClick: () => void) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick()
      }
    },
    [],
  )

  return (
    <div className="welcome-page">
      {/* Logo + Welcome */}
      <div className="welcome-page__header">
        <h2 className="welcome-page__title">
          欢迎回来，{user?.username ?? 'admin'} 👋
        </h2>
        <p className="welcome-page__subtitle">
          选择一个文件开始，或使用下方快速入口
        </p>
      </div>

      {/* Quick Actions 2x2 */}
      <div className="welcome-page__actions">
        {actions.map((a) => (
          <div
            key={a.title}
            onClick={a.onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => handleActionKeyDown(e, a.onClick)}
            className="welcome-action"
            style={
              {
                ['--qa-fg' as any]: a.fg,
                ['--qa-border' as any]: a.border,
              } as any
            }
          >
            <span className="welcome-action__icon">{a.icon}</span>
            <div className="welcome-action__content">
              <div className="welcome-action__title">{a.title}</div>
              <div className="welcome-action__subtitle">{a.subtitle}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Files */}
      {recentFiles.length > 0 && (
        <div className="welcome-page__recent">
          <div className="welcome-page__recent-label">
            最近文件
          </div>
          <div className="welcome-page__recent-list">
            {recentFiles.map((f) => (
              <div
                key={f.id}
                onClick={() => openFile(f.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => handleActionKeyDown(e, () => openFile(f.id))}
                className="welcome-recent-item"
              >
                <FileTextOutlined className="welcome-recent-item__icon" />
                <span className="welcome-recent-item__name">{f.name}</span>
                <span className="welcome-recent-item__date">{formatDate(f.updatedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
