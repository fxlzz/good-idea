import { ConfigProvider, Layout, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import AppLayout from './layout/AppLayout'

function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#722ed1',
          colorBgContainer: 'var(--ide-panel)',
          colorBgElevated: 'var(--ide-panel)',
          colorBorder: 'var(--ide-sidebar-border)',
          colorText: 'var(--ide-text)',
        },
      }}
    >
      <Layout style={{ minHeight: '100vh', background: 'var(--ide-bg)' }}>
        <AppLayout />
      </Layout>
    </ConfigProvider>
  )
}

export default App
