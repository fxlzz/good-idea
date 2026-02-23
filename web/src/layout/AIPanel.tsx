import { Button, Input, List } from 'antd'
import { useState, useRef, useEffect } from 'react'

type Message = { id: string; role: 'user' | 'assistant'; content: string }

type AIPanelProps = {
  open: boolean
  onClose: () => void
}

export default function AIPanel({ open }: AIPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight)
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const userMsg: Message = { id: `u_${Date.now()}`, role: 'user', content: text }
    setMessages((m) => [...m, userMsg])
    setLoading(true)

    const assistantId = `a_${Date.now()}`
    setMessages((m) => [...m, { id: assistantId, role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-10).map((x) => ({ role: x.role, content: x.content })),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }))
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantId ? { ...msg, content: `错误: ${err.error ?? res.statusText}` } : msg
          )
        )
        return
      }
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) {
        setMessages((m) =>
          m.map((msg) => (msg.id === assistantId ? { ...msg, content: '无响应' } : msg))
        )
        return
      }
      let content = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        content += decoder.decode(value, { stream: true })
        setMessages((m) =>
          m.map((msg) => (msg.id === assistantId ? { ...msg, content } : msg))
        )
      }
    } catch (e) {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantId ? { ...msg, content: `请求失败: ${String(e)}` } : msg
        )
      )
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div
      style={{
        width: 320,
        minWidth: 320,
        borderLeft: '1px solid #f0f0f0',
        background: '#fff',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', fontWeight: 600 }}>
        AI 助手
      </div>
      <div
        ref={listRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 12,
        }}
      >
        {messages.length === 0 && (
          <div style={{ color: '#999', fontSize: 12, textAlign: 'center', padding: 24 }}>
            输入消息与 AI 对话（需配置 DASHSCOPE_API_KEY）
          </div>
        )}
        <List
          dataSource={messages}
          renderItem={(item) => (
            <List.Item
              style={{
                flexDirection: 'column',
                alignItems: item.role === 'user' ? 'flex-end' : 'flex-start',
                border: 'none',
                padding: '8px 0',
              }}
            >
              <span
                style={{
                  background: item.role === 'user' ? '#1677ff' : '#f0f0f0',
                  color: item.role === 'user' ? '#fff' : '#000',
                  padding: '8px 12px',
                  borderRadius: 8,
                  maxWidth: '90%',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {item.content || (loading && item.role === 'assistant' ? '...' : '')}
              </span>
            </List.Item>
          )}
        />
      </div>
      <div style={{ padding: 12, borderTop: '1px solid #f0f0f0' }}>
        <Input.TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          placeholder="输入消息..."
          autoSize={{ minRows: 2, maxRows: 4 }}
          disabled={loading}
        />
        <Button type="primary" block style={{ marginTop: 8 }} onClick={send} loading={loading}>
          发送
        </Button>
      </div>
    </div>
  )
}
