import { getCollection } from './chroma.js'
import { supabase, hasSupabase } from '../db.js'

function getApiKey() {
  return process.env.DASHSCOPE_API_KEY
}

function getBaseUrl() {
  return process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1'
}

const CHUNK_SIZE = 800
const CHUNK_OVERLAP = 100
const EMBEDDABLE_EXTS = new Set(['.md', '.txt', ''])

export function isEmbeddable(ext) {
  return EMBEDDABLE_EXTS.has(ext ?? '')
}

export function chunkText(text, maxLen = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  if (!text || text.trim().length === 0) return []
  const cleaned = text.trim()
  if (cleaned.length <= maxLen) return [cleaned]

  const chunks = []
  let start = 0
  while (start < cleaned.length) {
    const end = Math.min(start + maxLen, cleaned.length)
    chunks.push(cleaned.slice(start, end))
    if (end >= cleaned.length) break
    start += maxLen - overlap
  }
  return chunks
}

export async function getEmbedding(text) {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('DASHSCOPE_API_KEY not configured')

  const res = await fetch(`${getBaseUrl()}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-v3',
      input: text,
      dimensions: 1024,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Embedding API error: ${res.status} ${err}`)
  }

  const data = await res.json()
  return data.data[0].embedding
}

export async function getEmbeddings(texts) {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('DASHSCOPE_API_KEY not configured')

  const res = await fetch(`${getBaseUrl()}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-v3',
      input: texts,
      dimensions: 1024,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Embedding API error: ${res.status} ${err}`)
  }

  const data = await res.json()
  return data.data.map((d) => d.embedding)
}

export async function embedFile(file) {
  if (!file.content || !isEmbeddable(file.ext)) return 0

  const col = await getCollection()
  await removeFileEmbeddings(file.id)

  const chunks = chunkText(file.content)
  if (chunks.length === 0) return 0

  const BATCH = 20
  let total = 0

  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH)
    const embeddings = await getEmbeddings(batch)

    const ids = batch.map((_, j) => `${file.id}_chunk_${i + j}`)
    const metadatas = batch.map((_, j) => ({
      fileId: file.id,
      fileName: file.name,
      chunkIndex: i + j,
      totalChunks: chunks.length,
    }))

    await col.add({ ids, embeddings, documents: batch, metadatas })
    total += batch.length
  }

  return total
}

export async function removeFileEmbeddings(fileId) {
  try {
    const col = await getCollection()
    await col.delete({ where: { fileId } })
  } catch {
    // collection might be empty or fileId not found
  }
}

export async function embedAllFiles() {
  if (!hasSupabase()) {
    throw new Error('Supabase not configured, cannot read files')
  }

  const { data, error } = await supabase
    .from('files')
    .select('id, name, type, content, ext')
    .eq('type', 'file')

  if (error) throw new Error(`Failed to read files: ${error.message}`)

  const files = (data || []).filter(
    (f) => f.content && isEmbeddable(f.ext)
  )

  let totalChunks = 0
  let processedFiles = 0

  for (const file of files) {
    const count = await embedFile(file)
    totalChunks += count
    processedFiles++
  }

  return { processedFiles, totalChunks, totalFiles: files.length }
}
