import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { Input } from 'antd'
import { useState } from 'react'
import 'highlight.js/styles/github.css'

const { TextArea } = Input

type MdViewerProps = {
  content: string
  onChange: (content: string) => void
  readOnly?: boolean
}

export default function MdViewer({ content, onChange, readOnly }: MdViewerProps) {
  const [edit, setEdit] = useState(true)

  if (readOnly) {
    return (
      <div className="markdown-body" style={{ padding: 24 }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {content}
        </ReactMarkdown>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{ flex: 1, padding: 16, borderRight: '1px solid #f0f0f0' }}>
        <div style={{ marginBottom: 8 }}>
          <span
            style={{ cursor: 'pointer', marginRight: 16, fontWeight: edit ? 600 : 400 }}
            onClick={() => setEdit(true)}
            role="tab"
          >
            编辑
          </span>
          <span
            style={{ cursor: 'pointer', fontWeight: edit ? 400 : 600 }}
            onClick={() => setEdit(false)}
            role="tab"
          >
            预览
          </span>
        </div>
        {edit ? (
          <TextArea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder="# 写点什么..."
            style={{ height: 'calc(100% - 40px)', resize: 'none' }}
          />
        ) : (
          <div style={{ height: 'calc(100% - 40px)', overflow: 'auto' }} className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}
