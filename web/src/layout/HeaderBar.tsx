import {
  BookOutlined,
  DownOutlined,
  FolderOutlined,
  RobotOutlined,
  SearchOutlined,
  StarOutlined,
} from '@ant-design/icons'
import { Avatar, Badge, Dropdown, Layout, Space, Tooltip } from 'antd'
import { useEffect, useState } from 'react'
import type { MenuProps } from 'antd'
import HeaderModal from './HeaderModal'

const { Header } = Layout

const HEALTH_POLL_INTERVAL = 10_000

const USER_NAME = 'admin'

type HeaderBarProps = {
  onToggleAI: () => void
  aiOpen: boolean
}

export default function HeaderBar({ onToggleAI, aiOpen }: HeaderBarProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null)

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

  const firstLetter = USER_NAME.charAt(0).toUpperCase()

  const userMenuItems: MenuProps['items'] = [
    { key: 'settings', label: '设置' },
    { key: 'ai', label: aiOpen ? '关闭 AI 助手' : 'AI 助手', onClick: onToggleAI },
    { key: 'status', label: apiHealthy === true ? '后端在线' : apiHealthy === false ? '后端离线' : '检查中…', disabled: true },
    { type: 'divider' },
    { key: 'logout', label: '登出' },
  ]

  const iconStyle = { fontSize: 18, color: 'var(--ide-text-muted)' }

  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        background: 'var(--ide-header)',
        color: 'var(--ide-text)',
        height: 48,
        borderBottom: '1px solid var(--ide-sidebar-border)',
      }}
    >
      {/* 左侧：Logo（书）+ 文件夹、搜索、书签 */}
      <Space size="middle" style={{ flex: 1, minWidth: 0 }}>
        <Tooltip title="好想法">
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: '#fff',
              cursor: 'pointer',
            }}
            onClick={() => setModalOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setModalOpen(true)}
          >
            <BookOutlined style={{ fontSize: 20 }} />
          </span>
        </Tooltip>
        <Tooltip title="文件">
          <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} role="button" tabIndex={0}>
            <FolderOutlined style={iconStyle} />
          </span>
        </Tooltip>
        <Tooltip title="搜索">
          <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} role="button" tabIndex={0}>
            <SearchOutlined style={iconStyle} />
          </span>
        </Tooltip>
        <Tooltip title="书签">
          <Badge count={2} size="small" offset={[-2, 2]} styles={{ indicator: { background: 'var(--ide-accent)' } }}>
            <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} role="button" tabIndex={0}>
              <StarOutlined style={iconStyle} />
            </span>
          </Badge>
        </Tooltip>
      </Space>

      {/* 右侧：AI 助手、后端状态、用户信息（头像=首字母+admin+下拉） */}
      <Space size="middle" style={{ alignItems: 'center' }}>
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
        <Tooltip title={apiHealthy === true ? '后端在线' : apiHealthy === false ? '后端离线' : '检查中…'}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: apiHealthy === true ? '#52c41a' : apiHealthy === false ? '#8c8c8c' : 'transparent',
              border: `1px solid ${apiHealthy === null ? '#8c8c8c' : 'transparent'}`,
              display: 'inline-block',
              flexShrink: 0,
            }}
            aria-label={apiHealthy === true ? '后端在线' : apiHealthy === false ? '后端离线' : '检查中'}
          />
        </Tooltip>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
          <Space style={{ cursor: 'pointer', color: 'var(--ide-text)', alignItems: 'center' }}>
            <Avatar
              size="small"
              style={{ background: 'var(--ide-accent)', flexShrink: 0 }}
            >
              {firstLetter}
            </Avatar>
            <span style={{ fontSize: 13 }}>{USER_NAME}</span>
            <DownOutlined style={{ fontSize: 10, color: 'var(--ide-text-muted)' }} />
          </Space>
        </Dropdown>
      </Space>

      <HeaderModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </Header>
  )
}
