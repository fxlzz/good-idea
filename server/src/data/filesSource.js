/**
 * Single source of file list for RAG embedding.
 * When Supabase is configured, reads from Supabase; otherwise uses in-memory store.
 */
import { supabase, hasSupabase, getSqlite } from '../db.js'
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

  const db = getSqlite()
  const rows = db
    .prepare(
      "SELECT id, name, type, content, ext FROM files WHERE type = 'file'"
    )
    .all()

  const list = rows.map((row) => ({
    id: row.id,
    name: row.name,
    content: row.content ?? '',
    ext: row.ext,
  }))

  return list.filter((f) => f.content && isEmbeddable(f.ext))
}
