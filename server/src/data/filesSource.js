/**
 * Single source of file list for RAG embedding.
 * When Supabase is configured, reads from Supabase; otherwise uses in-memory store.
 */
import { supabase, hasSupabase } from '../db.js'
import { isEmbeddable } from '../services/embedding.js'

export const memoryStore = { nodes: {}, rootIds: [] }

/**
 * Returns all embeddable file nodes (with content) for indexing.
 * Used by embed-all so RAG works with or without Supabase.
 */
export async function getFilesForEmbedding() {
  if (hasSupabase()) {
    const { data, error } = await supabase
      .from('files')
      .select('id, name, type, content, ext')
      .eq('type', 'file')
    if (error) throw new Error(`Failed to read files: ${error.message}`)
    return (data || []).filter((f) => f.content && isEmbeddable(f.ext))
  }
  const list = Object.values(memoryStore.nodes)
    .filter((n) => n.type === 'file')
    .map((n) => ({
      id: n.id,
      name: n.name,
      content: n.content ?? '',
      ext: n.ext,
    }))
  return list.filter((f) => f.content && isEmbeddable(f.ext))
}
