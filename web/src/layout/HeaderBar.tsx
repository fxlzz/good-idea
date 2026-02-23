import {
  BellOutlined,
  BookOutlined,
  CameraOutlined,
  PlusOutlined,
  RobotOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Avatar, Badge, Dropdown, Layout, Space, Tooltip } from 'antd'
import { useEffect, useState } from 'react'
import type { MenuProps } from 'antd'
import HeaderModal from './HeaderModal'
import { useLayoutStore } from '../store/layout'

const { Header } = Layout

const HEALTH_POLL_INTERVAL = 10_000

const TOP_NAVS = ['文件', '每日记录', '项目规划'] as const

type HeaderBarProps = {
  onToggleAI: () => void
  aiOpen: boolean
}

export default function HeaderBar({ onToggleAI, aiOpen }: HeaderBarProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null)
  const topNav = useLayoutStore((s) => s.topNav)
  const setTopNav = useLayoutStore((s) => s.setTopNav)
  const setMainView = useLayoutStore((s) => s.setMainView)

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

  const userMenuItems: MenuProps['items'] = [
    { key: 'settings', label: '设置' },
    { key: 'ai', label: aiOpen ? '关闭 AI 助手' : 'AI 助手', onClick: onToggleAI },
    { key: 'status', label: apiHealthy === true ? '后端在线' : apiHealthy === false ? '后端离线' : '检查中…', disabled: true },
    { type: 'divider' },
    { key: 'logout', label: '登出' },
  ]

  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px 0 8px',
        background: 'var(--ide-header)',
        color: 'var(--ide-text)',
        height: 48,
        borderBottom: '1px solid var(--ide-sidebar-border)',
      }}
    >
      <Space size="middle" style={{ flex: 1, minWidth: 0 }}>
        <Tooltip title="菜单">
          <span
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--ide-accent)' }}
            onClick={() => setModalOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setModalOpen(true)}
          >
            <BookOutlined style={{ fontSize: 20 }} />
          </span>
        </Tooltip>
        <Tooltip title="搜索">
          <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--ide-text-muted)' }}>
            <SearchOutlined style={{ fontSize: 16 }} />
          </span>
        </Tooltip>
        <Badge count={2} size="small" offset={[-2, 2]}>
          <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--ide-text-muted)' }}>
            <BellOutlined style={{ fontSize: 16 }} />
          </span>
        </Badge>
        <Space size={4} style={{ marginLeft: 8 }}>
          {TOP_NAVS.map((nav) => {
            const mainViewForNav = nav === '文件' ? 'files' : nav === '每日记录' ? 'whiteboard' : 'graph'
            const isActive = topNav === nav
            return (
              <span
                key={nav}
                onClick={() => {
                  setTopNav(nav)
                  setMainView(mainViewForNav)
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && (setTopNav(nav), setMainView(mainViewForNav))}
                style={{
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 4,
                  fontSize: 13,
                  color: isActive ? 'var(--ide-text)' : 'var(--ide-text-muted)',
                  background: isActive ? 'var(--ide-hover)' : 'transparent',
                }}
              >
                {nav}
              </span>
            )
          })}
        </Space>
      </Space>
      <Space size="middle">
        <Tooltip title={aiOpen ? '关闭 AI 助手' : 'AI 助手'}>
          <span
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--ide-text-muted)' }}
            onClick={onToggleAI}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onToggleAI()}
          >
            <RobotOutlined style={{ fontSize: 16 }} />
          </span>
        </Tooltip>
        <Tooltip title={apiHealthy === true ? '后端在线' : apiHealthy === false ? '后端离线' : '检查中…'}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: apiHealthy === true ? '#52c41a' : apiHealthy === false ? '#8c8c8c' : 'transparent',
              border: `1px solid ${apiHealthy === null ? '#8c8c8c' : 'transparent'}`,
              display: 'inline-block',
            }}
            aria-label={apiHealthy === true ? '后端在线' : apiHealthy === false ? '后端离线' : '检查中'}
          />
        </Tooltip>
        <Tooltip title="上传/新建">
          <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--ide-text-muted)' }}>
            <CameraOutlined style={{ fontSize: 16 }} />
          </span>
        </Tooltip>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
          <Space style={{ cursor: 'pointer', color: 'var(--ide-text)' }}>
            <Avatar size="small" icon={<UserOutlined />} style={{ background: 'var(--ide-accent)' }} />
            <span style={{ fontSize: 13 }}>A admin</span>
          </Space>
        </Dropdown>
        <Tooltip title="新建">
          <span
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: 4,
              background: 'var(--ide-accent)',
              color: '#fff',
            }}
            role="button"
            tabIndex={0}
          >
            <PlusOutlined style={{ fontSize: 14 }} />
          </span>
        </Tooltip>
      </Space>
      <HeaderModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </Header>
  )
}
