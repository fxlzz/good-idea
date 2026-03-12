import { Router } from 'express'
import { supabase, hasSupabase, getSqlite } from '../db.js'
import { embedFile, removeFileEmbeddings } from './ai.js'
import { isEmbeddable } from '../services/embedding.js'

const router = Router()

function triggerEmbed(file, userId) {
  if (file.content && isEmbeddable(file.ext)) {
    embedFile(file, userId).catch((err) =>
      console.warn('Auto-embed failed for', file.id, err.message)
    )
  }
}

function getNodes(req, res, next) {
  const userId = req.user.id
  if (hasSupabase()) {
    supabase
      .from('files')
      .select('*')
      .eq('user_id', userId)
      .then(({ data, error }) => {
        if (error) return res.status(500).json({ error: error.message })
        const nodes = {}
        const rootIds = []
        for (const row of data || []) {
          nodes[row.id] = {
            id: row.id,
            name: row.name,
            type: row.type,
            parentId: row.parent_id,
            content: row.content ?? undefined,
            ext: row.ext,
            createdAt: new Date(row.created_at).getTime(),
            updatedAt: new Date(row.updated_at).getTime(),
          }
          if (!row.parent_id) rootIds.push(row.id)
        }
        req.filesData = { nodes, rootIds }
        next()
      })
    return
  }

  const db = getSqlite()
  const rows = db.prepare('SELECT * FROM files WHERE user_id = ?').all(userId)

  const nodes = {}
  const rootIds = []

  for (const row of rows) {
    nodes[row.id] = {
      id: row.id,
      name: row.name,
      type: row.type,
      parentId: row.parent_id,
      content: row.content ?? undefined,
      ext: row.ext,
      createdAt: new Date(row.created_at).getTime(),
      updatedAt: new Date(row.updated_at).getTime(),
    }
    if (!row.parent_id) rootIds.push(row.id)
  }

  req.filesData = { nodes, rootIds }
  next()
}

router.get('/', getNodes, (req, res) => {
  const { nodes, rootIds } = req.filesData
  res.json({ nodes, rootIds })
})

router.post('/', async (req, res) => {
  const userId = req.user.id
  const { id, name, type, parentId, content } = req.body || {}
  if (!id || !name || !type) {
    return res.status(400).json({ error: 'id, name, type required' })
  }
  const now = new Date().toISOString()
  const ext = type === 'file' ? (name.includes('.') ? `.${name.split('.').pop()}` : '') : null
  const row = {
    id,
    user_id: userId,
    name,
    type,
    parent_id: parentId ?? null,
    content: content ?? null,
    ext,
    created_at: now,
    updated_at: now,
  }

  if (hasSupabase()) {
    const { error } = await supabase.from('files').insert(row)
    if (error) return res.status(500).json({ error: error.message })
    res.status(201).json(row)
    triggerEmbed({ id, name, content, ext }, userId)
    return
  }

  try {
    const db = getSqlite()
    db
      .prepare(
        `INSERT INTO files (id, user_id, name, type, parent_id, content, ext, created_at, updated_at)
         VALUES (@id, @user_id, @name, @type, @parent_id, @content, @ext, @created_at, @updated_at)`
      )
      .run(row)
    res.status(201).json(row)
    triggerEmbed({ id, name, content, ext }, userId)
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

router.put('/:id', async (req, res) => {
  const userId = req.user.id
  const id = req.params.id
  const { name, type, parentId, content } = req.body || {}
  const now = new Date().toISOString()

  if (hasSupabase()) {
    const updates = { updated_at: now }
    if (name != null) updates.name = name
    if (type != null) updates.type = type
    if (parentId !== undefined) updates.parent_id = parentId
    if (content !== undefined) updates.content = content

    const { error } = await supabase.from('files').update(updates).eq('id', id).eq('user_id', userId)
    if (error) return res.status(500).json({ error: error.message })
    res.json({ ok: true })

    if (content !== undefined) {
      const { data } = await supabase
        .from('files')
        .select('id, name, content, ext')
        .eq('id', id)
        .eq('user_id', userId)
        .single()
      if (data) triggerEmbed(data, userId)
    }
    return
  }

  const db = getSqlite()

  const existing = db.prepare('SELECT * FROM files WHERE id = ? AND user_id = ?').get(id, userId)
  if (!existing) return res.status(404).json({ error: 'not found' })

  const updated = {
    ...existing,
    name: name != null ? name : existing.name,
    type: type != null ? type : existing.type,
    parent_id: parentId !== undefined ? parentId : existing.parent_id,
    content: content !== undefined ? content : existing.content,
    updated_at: new Date().toISOString(),
  }

  try {
    db
      .prepare(
        `UPDATE files
         SET name = @name,
             type = @type,
             parent_id = @parent_id,
             content = @content,
             updated_at = @updated_at
         WHERE id = @id AND user_id = @user_id`
      )
      .run(updated)
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) })
  }

  res.json({ ok: true })
  if (content !== undefined) {
    triggerEmbed({
      id: updated.id,
      name: updated.name,
      content: updated.content,
      ext: updated.ext,
    }, userId)
  }
})

function collectIds(nodes, pid) {
  const ids = [pid]
  for (const n of Object.values(nodes)) {
    if (n.parentId === pid) ids.push(...collectIds(nodes, n.id))
  }
  return ids
}

router.delete('/:id', async (req, res) => {
  const userId = req.user.id
  const id = req.params.id

  if (hasSupabase()) {
    const { data, error } = await supabase.from('files').select('id, parent_id').eq('user_id', userId)
    if (error) return res.status(500).json({ error: error.message })

    const nodes = (data || []).reduce((acc, row) => {
      acc[row.id] = { id: row.id, parentId: row.parent_id }
      return acc
    }, {})
    const toDelete = collectIds(nodes, id)

    const { error: delErr } = await supabase.from('files').delete().in('id', toDelete).eq('user_id', userId)
    if (delErr) return res.status(500).json({ error: delErr.message })
    res.json({ ok: true })

    for (const did of toDelete) {
      removeFileEmbeddings(did, userId).catch(() => { })
    }
    return
  }

  const db = getSqlite()
  const rows = db.prepare('SELECT id, parent_id FROM files WHERE user_id = ?').all(userId)
  const nodes = rows.reduce((acc, row) => {
    acc[row.id] = { id: row.id, parentId: row.parent_id }
    return acc
  }, {})

  const toDelete = collectIds(nodes, id)

  const stmt = db.prepare('DELETE FROM files WHERE id = ? AND user_id = ?')
  const transaction = db.transaction((ids) => {
    for (const rid of ids) {
      stmt.run(rid, userId)
    }
  })

  try {
    transaction(toDelete)
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) })
  }

  for (const did of toDelete) {
    removeFileEmbeddings(did, userId).catch(() => { })
  }

  res.json({ ok: true })
})

export default router
