import { ChromaClient } from 'chromadb'

const CHROMA_URL = process.env.CHROMA_URL || 'http://localhost:8000'
const COLLECTION_NAME = 'documents'

function parseChromaUrl(url) {
  try {
    const u = new URL(url)
    let host = u.hostname
    if (host === 'localhost') host = '127.0.0.1'
    return {
      host,
      port: parseInt(u.port, 10) || (u.protocol === 'https:' ? 443 : 8000),
      ssl: u.protocol === 'https:',
    }
  } catch {
    return { host: '127.0.0.1', port: 8000, ssl: false }
  }
}

let client = null
let collection = null

/** Build embedding function that uses DashScope (1024 dims). Lazy import to avoid circular dependency with embedding.js */
async function getEmbeddingFunction() {
  const { getEmbeddings } = await import('./embedding.js')
  return {
    generate(texts) {
      return getEmbeddings(texts)
    },
    generateForQueries(texts) {
      return getEmbeddings(texts)
    },
  }
}

export async function getCollection() {
  if (collection) return collection
  const { host, port, ssl } = parseChromaUrl(CHROMA_URL)
  client = new ChromaClient({ host, port, ssl })
  const embeddingFunction = await getEmbeddingFunction()
  collection = await client.getOrCreateCollection({
    name: COLLECTION_NAME,
    embeddingFunction,
  })
  return collection
}

export async function resetCollection() {
  const c = await getCollection()
  await client.deleteCollection({ name: COLLECTION_NAME })
  collection = null
  return getCollection()
}
