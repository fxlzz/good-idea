import { Layout, Menu, Modal, Radio, Typography } from 'antd'
import { useState } from 'react'
import { useSettingsStore, type ThemeMode } from '../store/settings'

const { Sider, Content } = Layout
const { Title } = Typography

type SettingsModalProps = {
  open: boolean
  onClose: () => void
}

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [selectedKey, setSelectedKey] = useState('appearance')
  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)

  return (
    <Modal
      title="设置"
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      styles={{ body: { padding: 0 } }}
    >
      <Layout style={{ height: 400, background: 'var(--ide-bg)' }}>
        <Sider width={150} style={{ background: 'var(--ide-sidebar)' }}>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            onClick={(e) => setSelectedKey(e.key)}
            style={{ height: '100%', borderRight: '1px solid var(--ide-sidebar-border)', background: 'transparent' }}
            items={[
              { key: 'appearance', label: '外观' },
            ]}
          />
        </Sider>
        <Content style={{ padding: 24, background: 'var(--ide-panel)' }}>
          {selectedKey === 'appearance' && (
            <div>
              <Title level={5} style={{ marginTop: 0, color: 'var(--ide-text)' }}>主题风格</Title>
              <Radio.Group
                value={theme}
                onChange={(e) => setTheme(e.target.value as ThemeMode)}
              >
                <Radio value="dark" style={{ color: 'var(--ide-text)' }}>深色 (Dark)</Radio>
                <Radio value="light" style={{ color: 'var(--ide-text)' }}>浅色 (Light)</Radio>
              </Radio.Group>
            </div>
          )}
        </Content>
      </Layout>
    </Modal>
  )
}
