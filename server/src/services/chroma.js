import { ChromaClient } from 'chromadb'

const CHROMA_URL = process.env.CHROMA_URL || 'http://localhost:8000'
const COLLECTION_NAME = 'documents'

let client = null
let collection = null

export async function getCollection() {
  if (collection) return collection
  client = new ChromaClient({ path: CHROMA_URL })
  collection = await client.getOrCreateCollection({ name: COLLECTION_NAME })
  return collection
}

export async function resetCollection() {
  const c = await getCollection()
  await client.deleteCollection({ name: COLLECTION_NAME })
  collection = null
  return getCollection()
}
