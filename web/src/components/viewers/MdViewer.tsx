import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { Input } from 'antd'
import type { DocViewMode } from '../../store/layout'
import 'highlight.js/styles/github.css'

const { TextArea } = Input

type MdViewerProps = {
  content: string
  onChange: (content: string) => void
  readOnly?: boolean
  viewMode?: DocViewMode
}

const editorPreviewStyle: React.CSSProperties = {
  flex: 1,
  padding: 16,
  overflow: 'auto',
  minWidth: 0,
  background: 'var(--ide-bg)',
  color: 'var(--ide-text)',
}

export default function MdViewer({ content, onChange, readOnly, viewMode = 'split' }: MdViewerProps) {
  if (readOnly) {
    return (
      <div className="markdown-body" style={{ padding: 24, background: 'var(--ide-bg)', color: 'var(--ide-text)' }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {content}
        </ReactMarkdown>
      </div>
    )
  }

  const showEditor = viewMode === 'edit' || viewMode === 'split'
  const showPreview = viewMode === 'preview' || viewMode === 'split'

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--ide-bg)' }}>
      {showEditor && (
        <div style={{ ...editorPreviewStyle, borderRight: showPreview ? '1px solid var(--ide-sidebar-border)' : undefined }}>
          <TextArea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder="# 写点什么..."
            style={{
              height: '100%',
              resize: 'none',
              background: 'var(--ide-panel)',
              color: 'var(--ide-text)',
              border: 'none',
            }}
            styles={{
              textarea: { background: 'var(--ide-panel)', color: 'var(--ide-text)' },
            }}
          />
        </div>
      )}
      {showPreview && (
        <div style={editorPreviewStyle} className="markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
            {content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  )
}
