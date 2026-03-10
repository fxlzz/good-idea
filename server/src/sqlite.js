import Database from 'better-sqlite3'

const DEFAULT_DB_PATH = process.env.SQLITE_PATH || '/data/app.db'

let db

export function getDb() {
  if (db) return db

  db = new Database(DEFAULT_DB_PATH)

  db.pragma('journal_mode = WAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('file', 'folder')),
      parent_id TEXT REFERENCES files(id) ON DELETE CASCADE,
      content TEXT,
      ext TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS files_parent_id ON files(parent_id);
  `)

  return db
}

