import mammoth from 'mammoth'
import { useEffect, useState } from 'react'

type DocxViewerProps = {
  content: string
}

export default function DocxViewer({ content }: DocxViewerProps) {
  const [html, setHtml] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!content) {
      setHtml('')
      return
    }
    const b64 = content.startsWith('data:') ? content.split(',')[1] ?? '' : content
    const arr = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
    mammoth
      .convertToHtml({ arrayBuffer: arr.buffer })
      .then((r) => {
        setHtml(r.value)
        if (r.messages.length) console.warn('mammoth messages', r.messages)
      })
      .catch((e) => setError(String(e)))
  }, [content])

  if (error) return <div style={{ padding: 24, color: '#c00' }}>{error}</div>
  if (!html) return <div style={{ padding: 24, color: '#999' }}>暂无 DOCX 内容</div>

  return (
    <div
      style={{ padding: 24, overflow: 'auto' }}
      className="docx-viewer"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
