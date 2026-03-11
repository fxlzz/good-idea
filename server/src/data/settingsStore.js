import { supabase, hasSupabase, getSqlite } from '../db.js'

export const DEFAULT_SETTINGS = {
  llmModel: 'qwen-turbo',
  embeddingModel: 'text-embedding-v3',
  storageEngine: 'local',
  chunkSize: 512,
  chunkOverlap: 100,
  chunkSeparators: ['\n\n', '\n', '。', '！', '？', ';', '；'],
  enableParentChunks: false,
  llmApiKey: '',
}

export async function getUserSettings(userId) {
  if (!userId) throw new Error('userId is required for settings')

  if (hasSupabase()) {
    const { data, error } = await supabase
      .from('user_settings')
      .select(
        'llm_model, embedding_model, storage_engine, chunk_size, chunk_overlap, chunk_separators, enable_parent_chunks, llm_api_key'
      )
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw new Error(`Failed to read settings: ${error.message}`)

    if (!data) return { ...DEFAULT_SETTINGS }

    return {
      llmModel: data.llm_model ?? DEFAULT_SETTINGS.llmModel,
      embeddingModel: data.embedding_model ?? DEFAULT_SETTINGS.embeddingModel,
      storageEngine: data.storage_engine ?? DEFAULT_SETTINGS.storageEngine,
      chunkSize: data.chunk_size ?? DEFAULT_SETTINGS.chunkSize,
      chunkOverlap: data.chunk_overlap ?? DEFAULT_SETTINGS.chunkOverlap,
      chunkSeparators:
        Array.isArray(data.chunk_separators) && data.chunk_separators.length > 0
          ? data.chunk_separators
          : DEFAULT_SETTINGS.chunkSeparators,
      enableParentChunks:
        typeof data.enable_parent_chunks === 'boolean'
          ? data.enable_parent_chunks
          : Boolean(data.enable_parent_chunks ?? DEFAULT_SETTINGS.enableParentChunks),
      llmApiKey: data.llm_api_key ?? DEFAULT_SETTINGS.llmApiKey,
    }
  }

  const db = getSqlite()
  db
    .prepare(
      `CREATE TABLE IF NOT EXISTS user_settings (
         user_id TEXT PRIMARY KEY,
         llm_model TEXT,
         embedding_model TEXT,
         storage_engine TEXT,
         chunk_size INTEGER,
         chunk_overlap INTEGER,
         chunk_separators TEXT,
         enable_parent_chunks INTEGER,
         llm_api_key TEXT
       );`
    )
    .run()

  const existing = db
    .prepare(
      `SELECT llm_model, embedding_model, storage_engine, chunk_size, chunk_overlap, chunk_separators, enable_parent_chunks, llm_api_key
       FROM user_settings
       WHERE user_id = ?`
    )
    .get(userId)

  if (!existing) return { ...DEFAULT_SETTINGS }

  return {
    llmModel: existing.llm_model ?? DEFAULT_SETTINGS.llmModel,
    embeddingModel: existing.embedding_model ?? DEFAULT_SETTINGS.embeddingModel,
    storageEngine: existing.storage_engine ?? DEFAULT_SETTINGS.storageEngine,
    chunkSize: existing.chunk_size ?? DEFAULT_SETTINGS.chunkSize,
    chunkOverlap: existing.chunk_overlap ?? DEFAULT_SETTINGS.chunkOverlap,
    chunkSeparators:
      existing.chunk_separators != null && String(existing.chunk_separators).length > 0
        ? String(existing.chunk_separators).split('|')
        : DEFAULT_SETTINGS.chunkSeparators,
    enableParentChunks:
      typeof existing.enable_parent_chunks === 'boolean'
        ? existing.enable_parent_chunks
        : Boolean(existing.enable_parent_chunks ?? DEFAULT_SETTINGS.enableParentChunks),
    llmApiKey: existing.llm_api_key ?? DEFAULT_SETTINGS.llmApiKey,
  }
}

export async function updateUserSettings(userId, partial) {
  if (!userId) throw new Error('userId is required for settings')

  const current = await getUserSettings(userId)
  const next = { ...current, ...partial }

  if (hasSupabase()) {
    const payload = {
      user_id: userId,
      llm_model: next.llmModel,
      embedding_model: next.embeddingModel,
      storage_engine: next.storageEngine,
      chunk_size: next.chunkSize,
      chunk_overlap: next.chunkOverlap,
      chunk_separators: next.chunkSeparators,
      enable_parent_chunks: next.enableParentChunks,
      llm_api_key: next.llmApiKey,
    }
    const { error } = await supabase.from('user_settings').upsert(payload, {
      onConflict: 'user_id',
    })
    if (error) throw new Error(`Failed to update settings: ${error.message}`)
    return next
  }

  const db = getSqlite()
  db
    .prepare(
      `CREATE TABLE IF NOT EXISTS user_settings (
         user_id TEXT PRIMARY KEY,
         llm_model TEXT,
         embedding_model TEXT,
         storage_engine TEXT,
         chunk_size INTEGER,
         chunk_overlap INTEGER,
         chunk_separators TEXT,
         enable_parent_chunks INTEGER,
         llm_api_key TEXT
       );`
    )
    .run()

  const stmt = db.prepare(
    `INSERT INTO user_settings (
       user_id, llm_model, embedding_model, storage_engine,
       chunk_size, chunk_overlap, chunk_separators, enable_parent_chunks, llm_api_key
     ) VALUES (@user_id, @llm_model, @embedding_model, @storage_engine,
               @chunk_size, @chunk_overlap, @chunk_separators, @enable_parent_chunks, @llm_api_key)
     ON CONFLICT(user_id) DO UPDATE SET
       llm_model = excluded.llm_model,
       embedding_model = excluded.embedding_model,
       storage_engine = excluded.storage_engine,
       chunk_size = excluded.chunk_size,
       chunk_overlap = excluded.chunk_overlap,
       chunk_separators = excluded.chunk_separators,
       enable_parent_chunks = excluded.enable_parent_chunks,
       llm_api_key = excluded.llm_api_key`
  )

  stmt.run({
    user_id: userId,
    llm_model: next.llmModel,
    embedding_model: next.embeddingModel,
    storage_engine: next.storageEngine,
    chunk_size: next.chunkSize,
    chunk_overlap: next.chunkOverlap,
    chunk_separators: next.chunkSeparators.join('|'),
    enable_parent_chunks: next.enableParentChunks ? 1 : 0,
    llm_api_key: next.llmApiKey ?? '',
  })

  return next
}

