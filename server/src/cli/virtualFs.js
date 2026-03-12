import { randomUUID } from 'crypto'
import { supabase, hasSupabase, getSqlite } from '../db.js'

// Virtual path helpers
export function normalizeVirtualPath(cwd, inputPath = '.') {
  if (!inputPath || inputPath === '.') return cwd || '/'
  const isAbs = inputPath.startsWith('/')
  const base = isAbs ? '/' : cwd || '/'
  const parts = `${base}/${inputPath}`.split('/').filter(Boolean)
  const stack = []
  for (const part of parts) {
    if (part === '.' || part === '') continue
    if (part === '..') {
      if (stack.length > 0) stack.pop()
      continue
    }
    stack.push(part)
  }
  return `/${stack.join('/')}`
}

async function loadNodesForUser(userId) {
  if (hasSupabase()) {
    const { data, error } = await supabase
      .from('files')
      .select('id, name, type, parent_id, created_at, updated_at')
      .eq('user_id', userId)
    if (error) throw new Error(error.message || 'Failed to load files')
    const nodes = {}
    for (const row of data || []) {
      nodes[row.id] = {
        id: row.id,
        name: row.name,
        type: row.type,
        parentId: row.parent_id,
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: new Date(row.updated_at).getTime(),
      }
    }
    return nodes
  }

  const db = getSqlite()
  const rows = db
    .prepare('SELECT id, name, type, parent_id, created_at, updated_at FROM files WHERE user_id = ?')
    .all(userId)
  const nodes = {}
  for (const row of rows) {
    nodes[row.id] = {
      id: row.id,
      name: row.name,
      type: row.type,
      parentId: row.parent_id,
      createdAt: new Date(row.created_at).getTime(),
      updatedAt: new Date(row.updated_at).getTime(),
    }
  }
  return nodes
}

function findNodeByPath(nodes, virtualPath, { allowFile = true } = {}) {
  const clean = virtualPath || '/'
  if (clean === '/' || clean === '') return { node: null, path: '/' }
  const parts = clean.split('/').filter(Boolean)
  const rootCandidates = Object.values(nodes).filter((n) => n.parentId == null)
  let current = null
  for (let i = 0; i < parts.length; i += 1) {
    const name = parts[i]
    const children = Object.values(nodes).filter((n) =>
      current == null ? n.parentId == null : n.parentId === current.id,
    )
    const next = children.find((n) => n.name === name)
    if (!next) {
      throw new Error(`路径不存在: ${clean}`)
    }
    if (i < parts.length - 1 && next.type !== 'folder') {
      throw new Error(`不是目录: ${name}`)
    }
    current = next
  }
  if (!allowFile && current && current.type !== 'folder') {
    throw new Error(`不是目录: ${clean}`)
  }
  return { node: current, path: clean }
}

export async function vfsListChildren(userId, virtualPath) {
  const nodes = await loadNodesForUser(userId)
  const { node } = findNodeByPath(nodes, virtualPath, { allowFile: false })
  const parentId = node ? node.id : null
  const children = Object.values(nodes).filter((n) => n.parentId === parentId)
  return children
}

export async function vfsStat(userId, virtualPath, { recursive = false } = {}) {
  const nodes = await loadNodesForUser(userId)
  const { node } = findNodeByPath(nodes, virtualPath, { allowFile: true })

  if (node && node.type === 'file') {
    return { files: 1, directories: 0 }
  }

  const startId = node ? node.id : null
  const totals = { files: 0, directories: 0 }

  if (!recursive) {
    for (const n of Object.values(nodes)) {
      if (n.parentId === startId) {
        if (n.type === 'file') totals.files += 1
        else if (n.type === 'folder') totals.directories += 1
      }
    }
    return totals
  }

  const visit = (pid) => {
    for (const n of Object.values(nodes)) {
      if (n.parentId === pid) {
        if (n.type === 'file') totals.files += 1
        else if (n.type === 'folder') {
          totals.directories += 1
          visit(n.id)
        }
      }
    }
  }

  visit(startId)
  return totals
}

export async function vfsMkdir(userId, virtualPath, name) {
  if (!name) throw new Error('目录名不能为空')
  const nodes = await loadNodesForUser(userId)
  const { node } = findNodeByPath(nodes, virtualPath, { allowFile: false })
  const parentId = node ? node.id : null
  const siblings = Object.values(nodes).filter((n) => n.parentId === parentId)
  if (siblings.some((n) => n.name === name)) {
    throw new Error(`已存在同名项: ${name}`)
  }

  const id = randomUUID()
  const now = new Date().toISOString()

  if (hasSupabase()) {
    const row = {
      id,
      user_id: userId,
      name,
      type: 'folder',
      parent_id: parentId,
      content: null,
      ext: null,
      created_at: now,
      updated_at: now,
    }
    const { error } = await supabase.from('files').insert(row)
    if (error) throw new Error(error.message || '创建目录失败')
    return id
  }

  const db = getSqlite()
  const stmt = db.prepare(
    `INSERT INTO files (id, user_id, name, type, parent_id, content, ext, created_at, updated_at)
     VALUES (@id, @user_id, @name, @type, @parent_id, @content, @ext, @created_at, @updated_at)`,
  )
  stmt.run({
    id,
    user_id: userId,
    name,
    type: 'folder',
    parent_id: parentId,
    content: null,
    ext: null,
    created_at: now,
    updated_at: now,
  })
  return id
}

export async function vfsTouch(userId, virtualPath, name) {
  if (!name) throw new Error('文件名不能为空')
  const nodes = await loadNodesForUser(userId)
  const { node } = findNodeByPath(nodes, virtualPath, { allowFile: false })
  const parentId = node ? node.id : null
  const siblings = Object.values(nodes).filter((n) => n.parentId === parentId)
  if (siblings.some((n) => n.name === name)) {
    // 和 Unix touch 一样，存在就视为更新时间，不报错
    return siblings.find((n) => n.name === name)?.id
  }

  const id = randomUUID()
  const now = new Date().toISOString()
  const ext = name.includes('.') ? `.${name.split('.').pop()}` : ''

  if (hasSupabase()) {
    const row = {
      id,
      user_id: userId,
      name,
      type: 'file',
      parent_id: parentId,
      content: null,
      ext,
      created_at: now,
      updated_at: now,
    }
    const { error } = await supabase.from('files').insert(row)
    if (error) throw new Error(error.message || '创建文件失败')
    return id
  }

  const db = getSqlite()
  const stmt = db.prepare(
    `INSERT INTO files (id, user_id, name, type, parent_id, content, ext, created_at, updated_at)
     VALUES (@id, @user_id, @name, @type, @parent_id, @content, @ext, @created_at, @updated_at)`,
  )
  stmt.run({
    id,
    user_id: userId,
    name,
    type: 'file',
    parent_id: parentId,
    content: null,
    ext,
    created_at: now,
    updated_at: now,
  })
  return id
}

