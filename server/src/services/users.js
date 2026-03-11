import { hasSupabase, supabase } from '../db.js'
import { getSqlite } from '../db.js'

export function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase()
}

export async function findUserByUsername(username) {
  const normalized = normalizeUsername(username)
  if (!normalized) return null
  if (hasSupabase()) {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, password_hash')
      .eq('username', normalized)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data || null
  }

  const db = getSqlite()
  const row = db
    .prepare('SELECT id, username, password_hash FROM users WHERE username = ? LIMIT 1')
    .get(normalized)
  return row || null
}

export async function createUser({ id, username, password_hash }) {
  const normalized = normalizeUsername(username)
  if (!normalized) throw new Error('username required')

  if (hasSupabase()) {
    const now = new Date().toISOString()
    const row = { id, username: normalized, password_hash, created_at: now, updated_at: now }
    const { error } = await supabase.from('users').insert(row)
    if (error) throw new Error(error.message)
    return { id, username: normalized, password_hash }
  }

  const db = getSqlite()
  const now = new Date().toISOString()
  db
    .prepare(
      `INSERT INTO users (id, username, password_hash, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(id, normalized, password_hash, now, now)

  return { id, username: normalized, password_hash, created_at: now, updated_at: now }
}

