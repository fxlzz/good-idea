import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

const DEFAULT_DB_PATH = process.env.SQLITE_PATH || path.join(process.cwd(), 'data', 'app.db')

let db

function ensureDir(filePath) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

export function getDb() {
  if (db) return db

  ensureDir(DEFAULT_DB_PATH)
  db = new Database(DEFAULT_DB_PATH)

  db.pragma('journal_mode = WAL')

  const fileColumns = db.prepare('PRAGMA table_info(files)').all()
  const hasLegacyFilesSchema =
    fileColumns.length > 0 && !fileColumns.some((col) => col.name === 'user_id')
  if (hasLegacyFilesSchema) {
    // One-time reset for legacy schema: old rows are intentionally discarded.
    db.exec('DROP TABLE IF EXISTS files')
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS users_username ON users(username);

    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('file', 'folder')),
      parent_id TEXT REFERENCES files(id) ON DELETE CASCADE,
      content TEXT,
      ext TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS files_parent_id ON files(parent_id);
    CREATE INDEX IF NOT EXISTS files_user_id ON files(user_id);
    CREATE INDEX IF NOT EXISTS files_user_parent_id ON files(user_id, parent_id);
  `)

  return db
}

