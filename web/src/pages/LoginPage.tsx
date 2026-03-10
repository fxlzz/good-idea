import { Button, Card, Form, Input, Typography, message } from 'antd'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from '../store/auth'

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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        message.error(data?.error || '登录失败')
        return
      }
      setAuth(data.token, data.user)
      navigate(from, { replace: true })
    } catch {
      message.error('网络错误，请检查后端是否启动')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--ide-bg)',
        padding: 16,
      }}
    >
      <Card
        style={{
          width: 360,
          background: 'var(--ide-panel)',
          borderColor: 'var(--ide-sidebar-border)',
        }}
      >
        <Typography.Title level={4} style={{ marginTop: 0, marginBottom: 16, color: 'var(--ide-text)' }}>
          登录
        </Typography.Title>
        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input autoFocus placeholder="例如：admin" />
          </Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={submitting}>
            登录 / 注册
          </Button>
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ide-text-muted)' }}>
            第一次使用该用户名登录将自动创建账号。
          </div>
        </Form>
      </Card>
    </div>
  )
}

