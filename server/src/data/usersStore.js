const usersByUsername = new Map()

function nowIso() {
  return new Date().toISOString()
}

export function getUserByUsername(username) {
  return usersByUsername.get(username) || null
}

export function insertUser({ id, username, password_hash }) {
  const row = {
    id,
    username,
    password_hash,
    created_at: nowIso(),
    updated_at: nowIso(),
  }
  usersByUsername.set(username, row)
  return row
}

