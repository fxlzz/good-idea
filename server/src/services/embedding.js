import { getCollection } from './chroma.js'
import { getUserSettings, DEFAULT_SETTINGS } from '../data/settingsStore.js'

function getApiKey() {
  return process.env.DASHSCOPE_API_KEY
}

function getBaseUrl() {
  return process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1'
}

const EMBEDDABLE_EXTS = new Set(['.md', '.txt', ''])

export function isEmbeddable(ext) {
  return EMBEDDABLE_EXTS.has(ext ?? '')
}

export function chunkText(text, maxLen, overlap) {
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

  const items = Array.isArray(texts) ? texts : [texts]
  const MAX_BATCH = 10
  const allEmbeddings = []

  for (let i = 0; i < items.length; i += MAX_BATCH) {
    const batch = items.slice(i, i + MAX_BATCH)

    const res = await fetch(`${getBaseUrl()}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-v3',
        input: batch,
        dimensions: 1024,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Embedding API error: ${res.status} ${err}`)
    }

    const data = await res.json()
    for (const d of data.data) {
      allEmbeddings.push(d.embedding)
    }
  }

  return allEmbeddings
}

export async function embedFile(file, userId) {
  if (!userId) throw new Error('userId required for embedding')
  if (!file.content || !isEmbeddable(file.ext)) return 0

  const col = await getCollection()
  await removeFileEmbeddings(file.id, userId)

  let settings = DEFAULT_SETTINGS
  try {
    settings = await getUserSettings(userId)
  } catch {
    // fall back to defaults if settings not available
  }

  const maxLen = Math.max(100, Math.min(4000, settings.chunkSize ?? DEFAULT_SETTINGS.chunkSize))
  const overlap = Math.max(0, Math.min(500, settings.chunkOverlap ?? DEFAULT_SETTINGS.chunkOverlap))

  const chunks = chunkText(file.content, maxLen, overlap)
  if (chunks.length === 0) return 0

  const BATCH = 20
  let total = 0

  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH)
    const embeddings = await getEmbeddings(batch)

    const ids = batch.map((_, j) => `${userId}:${file.id}_chunk_${i + j}`)
    const metadatas = batch.map((_, j) => ({
      userId,
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

async function removeFileEmbeddingsForUser(fileId, userId) {
  try {
    const col = await getCollection()
    const where = userId ? { userId, fileId } : { fileId }
    await col.delete({ where })
  } catch {
    // collection might be empty or fileId not found
  }
}

export async function removeFileEmbeddings(fileId, userId) {
  return removeFileEmbeddingsForUser(fileId, userId)
}

/**
 * Embed all given files into ChromaDB. Caller should get files via getFilesForEmbedding().
 */
export async function embedAllFiles(files, userId) {
  if (!userId) throw new Error('userId required for embedding')
  if (!Array.isArray(files)) {
    throw new Error('embedAllFiles requires a files array from getFilesForEmbedding()')
  }

  let totalChunks = 0
  let processedFiles = 0

  for (const file of files) {
    const count = await embedFile(file, userId)
    totalChunks += count
    processedFiles++
  }

  return { processedFiles, totalChunks, totalFiles: files.length }
}
