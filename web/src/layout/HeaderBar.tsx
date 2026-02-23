import { MenuOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Dropdown, Layout, Space, Tooltip } from 'antd'
import { useEffect, useState } from 'react'
import type { MenuProps } from 'antd'
import HeaderModal from './HeaderModal'

const { Header } = Layout

const HEALTH_POLL_INTERVAL = 10_000

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

  const userMenuItems: MenuProps['items'] = [
    { key: 'settings', label: '设置' },
    { key: 'logout', label: '登出' },
  ]

  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        background: '#001529',
        color: '#fff',
        height: 48,
      }}
    >
      <Space size="middle">
        <Tooltip title="菜单">
          <span
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            onClick={() => setModalOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setModalOpen(true)}
          >
            <MenuOutlined style={{ fontSize: 18 }} />
          </span>
        </Tooltip>
        <span style={{ fontWeight: 600 }}>好想法</span>
      </Space>
      <Space size="middle">
        <Tooltip title={aiOpen ? '关闭 AI 助手' : 'AI 助手'}>
          <span
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            onClick={onToggleAI}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onToggleAI()}
          >
            <RobotOutlined style={{ fontSize: 18 }} />
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
            }}
            aria-label={apiHealthy === true ? '后端在线' : apiHealthy === false ? '后端离线' : '检查中'}
          />
        </Tooltip>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <span style={{ cursor: 'pointer' }}>
            <Avatar size="small" icon={<UserOutlined />} />
          </span>
        </Dropdown>
      </Space>
      <HeaderModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </Header>
  )
}
