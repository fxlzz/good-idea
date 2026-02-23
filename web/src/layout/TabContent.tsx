import { useFileTreeStore } from '../store/fileTree'
import DocxViewer from '../components/viewers/DocxViewer'
import MdViewer from '../components/viewers/MdViewer'
import PdfViewer from '../components/viewers/PdfViewer'
import XlsxViewer from '../components/viewers/XlsxViewer'

type TabContentProps = { nodeId: string }

export default function TabContent({ nodeId }: TabContentProps) {
  const node = useFileTreeStore((s) => s.getNode(nodeId))
  const updateNode = useFileTreeStore((s) => s.updateNode)

  if (!node || node.type !== 'file') return <div style={{ padding: 24 }}>文件不存在</div>

  const ext = (node.ext ?? '').toLowerCase()
  const content = node.content ?? ''

  const handleMdChange = (newContent: string) => {
    updateNode(nodeId, { content: newContent })
  }

  if (ext === '.md') {
    return (
      <div style={{ height: '100%', overflow: 'hidden' }}>
        <MdViewer content={content} onChange={handleMdChange} />
      </div>
    )
  }
  if (ext === '.pdf') {
    return <PdfViewer content={content} />
  }
  if (ext === '.docx' || ext === '.doc') {
    return <DocxViewer content={content} />
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
