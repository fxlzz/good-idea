import { hasSupabase, supabase } from '../db.js'
import { getUserByUsername as memGet, insertUser as memInsert } from '../data/usersStore.js'

export async function findUserByUsername(username) {
  if (!username) return null
  if (hasSupabase()) {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, password_hash')
      .eq('username', username)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data || null
  }
  return memGet(username)
}

export async function createUser({ id, username, password_hash }) {
  if (hasSupabase()) {
    const now = new Date().toISOString()
    const row = { id, username, password_hash, created_at: now, updated_at: now }
    const { error } = await supabase.from('users').insert(row)
    if (error) throw new Error(error.message)
    return { id, username, password_hash }
  }
  return memInsert({ id, username, password_hash })
}

