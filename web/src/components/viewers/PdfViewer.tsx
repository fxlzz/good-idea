import { Document, Page, pdfjs } from 'react-pdf'
import { useState } from 'react'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

type PdfViewerProps = {
  content: string
}

export default function PdfViewer({ content }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!content) {
    return <div style={{ padding: 24, color: '#999' }}>暂无 PDF 内容</div>
  }

  let src: string | undefined
  try {
    if (content.startsWith('data:application/pdf')) {
      src = content
    } else {
      src = `data:application/pdf;base64,${content}`
    }
  } catch {
    setError('PDF 数据格式错误')
  }

  if (error) return <div style={{ padding: 24, color: '#c00' }}>{error}</div>
  if (!src) return <div style={{ padding: 24, color: '#999' }}>暂无 PDF 内容</div>

  return (
    <div
      style={{
        padding: 24,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        minHeight: '100%',
        boxSizing: 'border-box',
      }}
    >
      <Document
        file={src}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        onLoadError={() => setError('PDF 加载失败')}
      >
        {numPages != null &&
          Array.from({ length: numPages }, (_, i) => (
            <Page key={i} pageNumber={i + 1} width={Math.min(800, window.innerWidth - 80)} />
          ))}
      </Document>
    </div>
  )
}
