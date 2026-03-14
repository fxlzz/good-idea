import { Button, Form, Input, message } from 'antd'
import md5 from 'md5'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { clearFileTreePersistence } from '../store/fileTree'

type LoginBody = { username: string; password: string }

export default function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [submitting, setSubmitting] = useState(false)

  const from = params.get('from') || '/'

  const onFinish = async (values: LoginBody) => {
    const username = values.username.trim()
    const password = values.password
    if (!username || !password) return

    setSubmitting(true)
    try {
      const passwordHash = md5(password)
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: passwordHash }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        message.error(data?.error || '登录失败')
        return
      }
      clearFileTreePersistence()
      setAuth(data.token, data.user)
      navigate(from, { replace: true })
    } catch {
      message.error('网络错误，请检查后端是否启动')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-page__background">
        <div className="login-page__gradient login-page__gradient--primary" />
        <div className="login-page__gradient login-page__gradient--accent" />
        <div className="login-page__noise" />
      </div>

      <div className="login-page__shell">
        <div className="login-page__content">
          <div className="login-page__hero">
            <div className="login-page__logo-pill">
              <span className="login-page__logo-dot">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18h6" />
                  <path d="M10 22h4" />
                  <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" />
                </svg>
              </span>
              <span className="login-page__logo-text">Good Idea Studio</span>
            </div>
            <h1 className="login-page__title">
              登录你的工作台
            </h1>
            <p className="login-page__subtitle">
              统一的学习与创作空间，干净、专注，又足够强大。
            </p>
            <div className="login-page__badge-row">
              <span className="login-page__badge">一号账户多端同步</span>
              <span className="login-page__badge login-page__badge--ghost">内测环境 · 本地数据</span>
            </div>
          </div>

          <div className="login-page__card">
            <div className="login-page__card-header">
              <h2 className="login-page__card-title">
                登录 / 注册
              </h2>
              <span className="login-page__card-desc">
                使用任意用户名快速进入，无需额外配置。
              </span>
            </div>

            <Form layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
              <Form.Item
                label="用户名"
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input autoFocus placeholder="例如：admin / demo / your-name" />
              </Form.Item>
              <Form.Item
                label="密码"
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password placeholder="设置一个记得住的密码" />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={submitting}
                className="login-page__submit"
              >
                进入工作台
              </Button>
              <div className="login-page__hint">
                第一次使用该用户名登录将自动创建账号，账号信息仅保存在本地服务。
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  )
}
