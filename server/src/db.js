import { createClient } from '@supabase/supabase-js'
import { getDb } from './sqlite.js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_ANON_KEY

export const supabase = url && key ? createClient(url, key) : null

export function hasSupabase() {
  return !!supabase
}

export function getSqlite() {
  return getDb()
}
