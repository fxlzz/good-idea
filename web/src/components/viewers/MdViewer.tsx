import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { Input } from 'antd'
import { useMemo } from 'react'
import type { DocViewMode } from '../../store/layout'
import { FILE_TREE_DRAG_MIME } from '../../utils/markdownLinks'
import 'highlight.js/styles/github.css'

const { TextArea } = Input

type MdViewerProps = {
  content: string
  onChange: (content: string) => void
  onDropNodeReference?: (nodeId: string, selectionStart: number, selectionEnd: number) => void
  onOpenReference?: (href: string) => boolean
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

export default function MdViewer({
  content,
  onChange,
  onDropNodeReference,
  onOpenReference,
  readOnly,
  viewMode = 'split',
}: MdViewerProps) {
  const markdownComponents = useMemo(
    () => ({
      a: ({ href, children, ...props }: React.ComponentProps<'a'>) => (
        <a
          {...props}
          href={href}
          onClick={(e) => {
            if (!href || !onOpenReference) return
            if (onOpenReference(href)) e.preventDefault()
          }}
        >
          {children}
        </a>
      ),
    }),
    [onOpenReference],
  )

  if (readOnly) {
    return (
      <div className="markdown-body" style={{ padding: 24, background: 'var(--ide-bg)', color: 'var(--ide-text)' }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={markdownComponents}
        >
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
            onDragOver={(e) => {
              if (!e.dataTransfer.types.includes(FILE_TREE_DRAG_MIME)) return
              e.preventDefault()
              e.dataTransfer.dropEffect = 'copy'
            }}
            onDrop={(e) => {
              const droppedNodeId = e.dataTransfer.getData(FILE_TREE_DRAG_MIME)
              if (!droppedNodeId) return
              e.preventDefault()
              if (!onDropNodeReference) return
              const textarea = e.currentTarget
              onDropNodeReference(
                droppedNodeId,
                textarea.selectionStart ?? content.length,
                textarea.selectionEnd ?? content.length,
              )
            }}
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
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={markdownComponents}
          >
            {content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  )
}
