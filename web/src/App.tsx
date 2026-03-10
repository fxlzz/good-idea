import { ConfigProvider, Layout, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import AppLayout from './layout/AppLayout'
import { Route, Routes } from 'react-router-dom'
import RequireAuth from './components/RequireAuth'
import LoginPage from './pages/LoginPage'

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
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <Layout style={{ minHeight: '100vh', background: 'var(--ide-bg)' }}>
                <AppLayout />
              </Layout>
            </RequireAuth>
          }
        />
      </Routes>
    </ConfigProvider>
  )
}

export default App
