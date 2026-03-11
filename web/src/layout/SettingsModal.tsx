import { Modal, Switch, Typography, Space } from 'antd'
import type { ModalProps } from 'antd'
import { useSettingsStore } from '../store/settings'

type SettingsModalProps = Pick<ModalProps, 'open' | 'onClose'> & {
  onClose?: () => void
}

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)

  const isDark = theme === 'dark'

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={onClose}
      title="设置"
      centered
      destroyOnClose
      okText="关闭"
      cancelButtonProps={{ style: { display: 'none' } }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
          <div>
            <Typography.Text>深色模式</Typography.Text>
            <div style={{ fontSize: 12, color: 'var(--ide-text-muted)' }}>
              在浅色 / 深色主题之间切换
            </div>
          </div>
          <Switch
            checked={isDark}
            onChange={(checked) => setTheme(checked ? 'dark' : 'light')}
          />
        </Space>
      </Space>
    </Modal>
  )
}

