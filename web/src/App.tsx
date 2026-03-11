import { ConfigProvider, Layout, theme as antTheme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { useEffect } from 'react'
import AppLayout from './layout/AppLayout'
import { Route, Routes } from 'react-router-dom'
import RequireAuth from './components/RequireAuth'
import LoginPage from './pages/LoginPage'
import { useSettingsStore } from './store/settings'

function App() {
  const theme = useSettingsStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          colorPrimary: theme === 'dark' ? '#722ed1' : '#1677ff',
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
