import { useFileTreeStore } from '../store/fileTree'
import { useLayoutStore } from '../store/layout'
import DocxViewer from '../components/viewers/DocxViewer'
import MdViewer from '../components/viewers/MdViewer'
import PdfViewer from '../components/viewers/PdfViewer'
import XlsxViewer from '../components/viewers/XlsxViewer'
import { replaceOutgoingLinks } from '../utils/graph'
import {
  buildRelativeMarkdownLink,
  getReferencedMarkdownNodeIds,
  parseRelativeMarkdownRef,
  resolveRefToNodeId,
} from '../utils/markdownLinks'

type TabContentProps = { nodeId: string }

export default function TabContent({ nodeId }: TabContentProps) {
  const node = useFileTreeStore((s) => s.getNode(nodeId))
  const nodes = useFileTreeStore((s) => s.nodes)
  const updateNode = useFileTreeStore((s) => s.updateNode)
  const openFile = useFileTreeStore((s) => s.openFile)
  const docViewMode = useLayoutStore((s) => s.docViewMode)

  if (!node || node.type !== 'file') return <div style={{ padding: 24 }}>文件不存在</div>

  const ext = (node.ext ?? '').toLowerCase()
  const content = node.content ?? ''

  const handleMdChange = (newContent: string) => {
    updateNode(nodeId, { content: newContent })
    const referencedNodeIds = getReferencedMarkdownNodeIds(nodeId, newContent, nodes)
    replaceOutgoingLinks(nodeId, referencedNodeIds, nodes)
  }

  const handleDropNodeReference = (
    droppedNodeId: string,
    selectionStart: number,
    selectionEnd: number,
  ) => {
    if (droppedNodeId === nodeId) return
    const droppedNode = nodes[droppedNodeId]
    if (!droppedNode || droppedNode.type !== 'file' || (droppedNode.ext ?? '').toLowerCase() !== '.md') {
      return
    }

    const markdownLink = buildRelativeMarkdownLink(nodeId, droppedNodeId, nodes)
    if (!markdownLink) return

    const safeStart = Math.max(0, Math.min(selectionStart, content.length))
    const safeEnd = Math.max(safeStart, Math.min(selectionEnd, content.length))
    const nextContent = `${content.slice(0, safeStart)}${markdownLink}${content.slice(safeEnd)}`
    handleMdChange(nextContent)
  }

  const handleOpenReference = (href: string) => {
    const relativeRef = parseRelativeMarkdownRef(href)
    if (!relativeRef) return false
    const targetNodeId = resolveRefToNodeId(nodeId, relativeRef, nodes)
    if (!targetNodeId) return false
    const targetNode = nodes[targetNodeId]
    if (!targetNode || targetNode.type !== 'file') return false
    openFile(targetNodeId)
    return true
  }

  if (ext === '.md') {
    return (
      <div style={{ height: '100%', overflow: 'hidden' }}>
        <MdViewer
          content={content}
          onChange={handleMdChange}
          onDropNodeReference={handleDropNodeReference}
          onOpenReference={handleOpenReference}
          viewMode={docViewMode}
        />
      </div>
    )
  }
  if (ext === '.pdf') {
    return <PdfViewer content={content} />
  }
  if (ext === '.docx' || ext === '.doc') {
    return (
      <DocxViewer
        content={content}
        onContentChange={(newBase64) => updateNode(nodeId, { content: newBase64 })}
      />
    )
  }
  if (ext === '.xlsx') {
    return <XlsxViewer content={content} />
  }

  return (
    <div style={{ padding: 24, height: '100%', overflow: 'auto' }}>
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{content}</pre>
    </div>
  )
}
