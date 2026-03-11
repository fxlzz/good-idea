import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Input, message, Space, Tooltip } from 'antd'
import { SearchOutlined, SwapOutlined } from '@ant-design/icons'
import mammoth from 'mammoth'
import { renderAsync } from 'docx-preview'
import {
  replaceTextInDocx,
  docxBase64ToUint8,
  uint8ToBase64,
} from '../../lib/docxReplace'

type DocxViewerProps = {
  content: string
  onContentChange?: (newBase64: string) => void
}

export default function DocxViewer({ content, onContentChange }: DocxViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fallbackHtml, setFallbackHtml] = useState<string>('')

  const [showReplace, setShowReplace] = useState(false)
  const [search, setSearch] = useState('')
  const [replace, setReplace] = useState('')
  const [replacing, setReplacing] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.innerHTML = ''
    setError(null)
    setFallbackHtml('')

    if (!content) return

    let cancelled = false

    try {
      const b64 = content.startsWith('data:') ? content.split(',')[1] ?? '' : content
      if (!b64) return
      const binary = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
      const blob = new Blob([binary], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })

      setLoading(true)
      renderAsync(blob, container, undefined, {
        className: 'docx-preview',
      })
        .catch(async (e) => {
          if (cancelled) return
          console.error('docx-preview failed, fallback to mammoth', e)
          try {
            const result = await mammoth.convertToHtml({
              arrayBuffer: binary.buffer,
            })
            if (!cancelled) setFallbackHtml(result.value)
          } catch (me) {
            if (!cancelled) setError(String((me as Error).message || me))
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    } catch (e) {
      setError(String((e as Error).message || e))
    }

    return () => {
      cancelled = true
      container.innerHTML = ''
    }
  }, [content])

  const handleReplace = useCallback(
    (all: boolean) => {
      if (!search) {
        message.warning('请输入要查找的文本')
        return
      }
      if (!content || !onContentChange) return

      setReplacing(true)
      try {
        const binary = docxBase64ToUint8(content)
        const { data, count } = replaceTextInDocx(binary, search, replace, all)

        if (count === 0) {
          message.info('未找到匹配的文本')
        } else {
          const newBase64 = uint8ToBase64(data)
          onContentChange(newBase64)
          message.success(`已替换 ${count} 处`)
        }
      } catch (e) {
        message.error(`替换失败：${(e as Error).message || e}`)
      } finally {
        setReplacing(false)
      }
    },
    [search, replace, content, onContentChange],
  )

  if (!content) return <div style={{ padding: 24, color: '#999' }}>暂无 DOCX 内容</div>
  if (error) return <div style={{ padding: 24, color: '#c00' }}>{error}</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 16px',
          borderBottom: '1px solid var(--ide-sidebar-border, #303030)',
          background: 'var(--ide-header, #1e1e1e)',
          flexShrink: 0,
        }}
      >
        <Tooltip title="查找替换">
          <Button
            type={showReplace ? 'primary' : 'text'}
            size="small"
            icon={<SearchOutlined />}
            onClick={() => setShowReplace((v) => !v)}
          />
        </Tooltip>

        {showReplace && (
          <Space.Compact size="small" style={{ flex: 1, maxWidth: 600 }}>
            <Input
              placeholder="查找文本"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '40%' }}
              onPressEnter={() => handleReplace(false)}
            />
            <Input
              placeholder="替换为"
              prefix={<SwapOutlined style={{ color: '#666' }} />}
              value={replace}
              onChange={(e) => setReplace(e.target.value)}
              style={{ width: '40%' }}
              onPressEnter={() => handleReplace(false)}
            />
            <Button
              onClick={() => handleReplace(false)}
              loading={replacing}
              disabled={!onContentChange}
            >
              替换
            </Button>
            <Button
              onClick={() => handleReplace(true)}
              loading={replacing}
              disabled={!onContentChange}
            >
              全部替换
            </Button>
          </Space.Compact>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: 24, overflow: 'auto', flex: 1, position: 'relative' }}>
        {loading && (
          <div style={{ color: '#999', padding: '12px 0' }}>DOCX 加载中…</div>
        )}
        <div ref={containerRef} className="docx-viewer" />
        {!error && !loading && fallbackHtml && (
          <div
            className="docx-viewer-fallback"
            dangerouslySetInnerHTML={{ __html: fallbackHtml }}
          />
        )}
      </div>
    </div>
  )
}
