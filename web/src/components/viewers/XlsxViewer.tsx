import * as XLSX from 'xlsx'
import { useMemo, useState } from 'react'
import { Table } from 'antd'

type XlsxViewerProps = {
  content: string
}

export default function XlsxViewer({ content }: XlsxViewerProps) {
  const [error, setError] = useState<string | null>(null)
  const { sheets, sheetNames } = useMemo(() => {
    if (!content) return { sheets: [], sheetNames: [] }
    try {
      const base64 = content.startsWith('data:') ? content.split(',')[1] ?? content : content
      const binary = atob(base64)
      const arr = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i)
      const wb = XLSX.read(arr.buffer, { type: 'array' })
      const names = wb.SheetNames
      const sheets = names.map((name) => {
        const sheet = wb.Sheets[name]
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][]
        return { name, data }
      })
      return { sheets, sheetNames: names }
    } catch (e) {
      setError(String(e))
      return { sheets: [], sheetNames: [] }
    }
  }, [content])

  const [activeSheet, setActiveSheet] = useState(0)
  const sheet = sheets[activeSheet]
  const headerRow = sheet?.data?.[0]
  const columns =
    headerRow != null && Array.isArray(headerRow)
      ? (headerRow as unknown[]).map((c, i) => ({
          key: String(i),
          dataIndex: String(i),
          title: String(c),
        }))
      : []
  const dataSource = (sheet?.data?.slice(1) ?? []).map((row, i) => {
    const r: Record<string, unknown> = { key: i }
    if (Array.isArray(row)) row.forEach((v, j) => (r[String(j)] = v))
    return r
  })

  if (error) return <div style={{ padding: 24, color: '#c00' }}>{error}</div>
  if (!content) return <div style={{ padding: 24, color: '#999' }}>暂无 XLSX 内容</div>

  return (
    <div style={{ padding: 24, overflow: 'auto' }}>
      {sheetNames.length > 1 && (
        <div style={{ marginBottom: 12 }}>
          {sheetNames.map((name, i) => (
            <button
              key={name}
              type="button"
              onClick={() => setActiveSheet(i)}
              style={{
                marginRight: 8,
                padding: '4px 12px',
                fontWeight: activeSheet === i ? 600 : 400,
              }}
            >
              {name}
            </button>
          ))}
        </div>
      )}
      <Table
        size="small"
        pagination={false}
        columns={columns.map((c) => ({ ...c, title: c.title ?? c.key }))}
        dataSource={dataSource}
        scroll={{ x: 'max-content' }}
      />
    </div>
  )
}
