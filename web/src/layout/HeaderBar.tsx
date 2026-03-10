import {
  BookOutlined,
  DownOutlined,
  FlagOutlined,
  FolderOutlined,
  RobotOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { Avatar, Badge, Dropdown, Layout, Space, Tooltip } from 'antd'
import { useEffect, useState } from 'react'
import type { MenuProps } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useBookmarksStore } from '../store/bookmarks'
import { useFileTreeStore } from '../store/fileTree'
import { useAuthStore } from '../store/auth'
import AllArticlesModal from './AllArticlesModal'
import SearchModal from './SearchModal'

const { Header } = Layout

const HEALTH_POLL_INTERVAL = 10_000

type HeaderBarProps = {
  onToggleAI: () => void
  aiOpen: boolean
}

export default function HeaderBar({ onToggleAI, aiOpen }: HeaderBarProps) {
  const navigate = useNavigate()
  const [allArticlesOpen, setAllArticlesOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null)

  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const nodeIds = useBookmarksStore((s) => s.nodeIds)
  const getNode = useFileTreeStore((s) => s.getNode)
  const openFile = useFileTreeStore((s) => s.openFile)
  const setExpanded = useFileTreeStore((s) => s.setExpanded)

  const bookmarkedNodes = nodeIds
    .map((id) => getNode(id))
    .filter((n): n is NonNullable<typeof n> => !!n)
  const bookmarkCount = bookmarkedNodes.length

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/health')
        setApiHealthy(res.ok && (await res.json())?.ok === true)
      } catch {
        setApiHealthy(false)
      }
    }
    check()
    const id = setInterval(check, HEALTH_POLL_INTERVAL)
    return () => clearInterval(id)
  }, [])

  const userName = user?.username || '未登录'
  const firstLetter = userName.charAt(0).toUpperCase()

  const userMenuItems: MenuProps['items'] = [
    { key: 'settings', label: '设置' },
    { key: 'ai', label: aiOpen ? '关闭 AI 助手' : 'AI 助手', onClick: onToggleAI },
    {
      key: 'status',
      label:
        apiHealthy === true ? '后端在线' : apiHealthy === false ? '后端离线' : '检查中…',
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'logout',
      label: '登出',
      onClick: () => {
        logout()
        navigate('/login', { replace: true })
      },
    },
  ]

  const iconStyle = { fontSize: 16, color: 'var(--ide-text-muted)' }

  const bookmarkMenuItems: MenuProps['items'] =
    bookmarkedNodes.length === 0
      ? [{ key: '_empty', label: '暂无书签', disabled: true }]
      : bookmarkedNodes.map((n) => ({
          key: n.id,
          icon: <span style={{ color: 'var(--ide-accent)' }}>🔖</span>,
          label: n.name,
          onClick: () => {
            if (n.type === 'file') openFile(n.id)
            else setExpanded(n.id, true)
          },
        }))

  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px 0 0',
        background: 'var(--ide-header)',
        color: 'var(--ide-text)',
        height: 48,
        borderBottom: '1px solid var(--ide-sidebar-border)',
      }}
    >
      <div
        style={{
          width: 48,
          minWidth: 48,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRight: '1px solid var(--ide-sidebar-border)',
          borderBottom: '1px solid var(--ide-sidebar-border)',
          boxSizing: 'border-box',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: '#fff',
            cursor: 'default',
          }}
          aria-hidden
        >
          <BookOutlined style={{ fontSize: 14 }} />
        </span>
      </div>
      {/* 文件夹、搜索、书签 */}
      <Space size="middle" style={{ paddingLeft: 12, minWidth: 0 }}>
        <Tooltip title="所有文章">
          <span
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            onClick={() => setAllArticlesOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setAllArticlesOpen(true)}
          >
            <FolderOutlined style={iconStyle} />
          </span>
        </Tooltip>
        <Tooltip title="搜索">
          <span
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            onClick={() => setSearchOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setSearchOpen(true)}
          >
            <SearchOutlined style={iconStyle} />
          </span>
        </Tooltip>
        <Dropdown
          menu={{ items: bookmarkMenuItems }}
          placement="bottomLeft"
          trigger={['click']}
        >
          <Tooltip title="书签">
            <span
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              role="button"
              tabIndex={0}
            >
              <Badge
                count={bookmarkCount > 0 ? bookmarkCount : 0}
                size="small"
                offset={[-2, 2]}
                styles={{ indicator: { background: 'var(--ide-accent)' } }}
              >
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <FlagOutlined style={{ ...iconStyle, color: 'var(--ide-accent)' }} />
                </span>
              </Badge>
            </span>
          </Tooltip>
        </Dropdown>
      </Space>

      {/* 右侧：AI、状态、用户 */}
      <Space size="middle" style={{ marginLeft: 'auto' }}>
        <Tooltip title={aiOpen ? '关闭 AI 助手' : 'AI 助手'}>
          <span
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            onClick={onToggleAI}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onToggleAI()}
          >
            <RobotOutlined style={iconStyle} />
          </span>
        </Tooltip>
        <Tooltip
          title={
            apiHealthy === true ? '后端在线' : apiHealthy === false ? '后端离线' : '检查中…'
          }
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background:
                apiHealthy === true
                  ? '#52c41a'
                  : apiHealthy === false
                    ? '#8c8c8c'
                    : 'transparent',
              border: `1px solid ${apiHealthy === null ? '#8c8c8c' : 'transparent'}`,
              display: 'inline-block',
              flexShrink: 0,
            }}
            aria-label={
              apiHealthy === true ? '后端在线' : apiHealthy === false ? '后端离线' : '检查中'
            }
          />
        </Tooltip>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
          <Space
            style={{ cursor: 'pointer', color: 'var(--ide-text)', alignItems: 'center' }}
          >
            <Avatar
              size="small"
              style={{ background: 'var(--ide-accent)', flexShrink: 0 }}
            >
              {firstLetter}
            </Avatar>
            <span style={{ fontSize: 13 }}>{userName}</span>
            <DownOutlined style={{ fontSize: 10, color: 'var(--ide-text-muted)' }} />
          </Space>
        </Dropdown>
      </Space>

      <AllArticlesModal open={allArticlesOpen} onClose={() => setAllArticlesOpen(false)} />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </Header>
  )
}
