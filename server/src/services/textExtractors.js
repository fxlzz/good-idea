import mammoth from 'mammoth'
import pdfParse from 'pdf-parse'
import * as XLSX from 'xlsx'

function base64ToBuffer(b64) {
  if (!b64) return null
  const clean = b64.startsWith('data:') ? b64.split(',')[1] ?? '' : b64
  if (!clean) return null
  try {
    return Buffer.from(clean, 'base64')
  } catch {
    return null
  }
}

function normalizeText(text) {
  if (!text) return ''
  return String(text)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n')
}

export async function getEmbeddableText(file) {
  if (!file || !file.name) return ''
  const ext = (file.ext || (file.name.includes('.') ? `.${file.name.split('.').pop()}` : '')).toLowerCase()

  // Plain text / markdown: use content directly
  if (ext === '.md' || ext === '.txt' || !ext) {
    return normalizeText(file.content || '')
  }

  // Binary formats: expect base64 content
  const buf = base64ToBuffer(file.content || '')
  if (!buf) return ''

  if (ext === '.docx' || ext === '.doc') {
    try {
      const result = await mammoth.convertToHtml({ arrayBuffer: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) })
      const html = result.value || ''
      const text = html
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
      return normalizeText(text)
    } catch {
      return ''
    }
  }

  if (ext === '.pdf') {
    try {
      const data = await pdfParse(buf)
      return normalizeText(data.text || '')
    } catch {
      return ''
    }
  }

  if (ext === '.xlsx') {
    try {
      const wb = XLSX.read(buf, { type: 'buffer' })
      const pieces = []
      for (const sheetName of wb.SheetNames) {
        const sheet = wb.Sheets[sheetName]
        if (!sheet) continue
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })
        const lines = Array.isArray(rows)
          ? rows
              .map((row) =>
                Array.isArray(row)
                  ? row
                      .map((v) => (v == null ? '' : String(v)))
                      .join('\t')
                      .trim()
                  : '',
              )
              .filter(Boolean)
          : []
        if (lines.length > 0) {
          pieces.push(`【Sheet: ${sheetName}】`)
          pieces.push(...lines)
        }
      }
      return normalizeText(pieces.join('\n'))
    } catch {
      return ''
    }
  }

  return ''
}

