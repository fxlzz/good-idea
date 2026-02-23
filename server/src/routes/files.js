import { Router } from 'express'
import { supabase, hasSupabase } from '../db.js'

const router = Router()

// In-memory fallback when Supabase not configured
let memoryStore = { nodes: {}, rootIds: [] }

function getNodes(req, res, next) {
  if (hasSupabase()) {
    supabase
      .from('files')
      .select('*')
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
  req.filesData = memoryStore
  next()
}

router.get('/', getNodes, (req, res) => {
  const { nodes, rootIds } = req.filesData
  res.json({ nodes, rootIds })
})

router.post('/', (req, res) => {
  const { id, name, type, parentId, content } = req.body || {}
  if (!id || !name || !type) {
    return res.status(400).json({ error: 'id, name, type required' })
  }
  const now = new Date().toISOString()
  const row = {
    id,
    name,
    type,
    parent_id: parentId ?? null,
    content: content ?? null,
    ext: type === 'file' ? (name.split('.').pop() || null) : null,
    created_at: now,
    updated_at: now,
  }

  if (hasSupabase()) {
    supabase
      .from('files')
      .insert(row)
      .then(({ error }) => {
        if (error) return res.status(500).json({ error: error.message })
        res.status(201).json(row)
      })
    return
  }

  memoryStore.nodes[id] = {
    id,
    name,
    type,
    parentId: parentId ?? null,
    content,
    ext: row.ext,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  if (!parentId) memoryStore.rootIds.push(id)
  res.status(201).json(row)
})

router.put('/:id', (req, res) => {
  const id = req.params.id
  const { name, type, parentId, content } = req.body || {}
  const now = new Date().toISOString()

  if (hasSupabase()) {
    const updates = { updated_at: now }
    if (name != null) updates.name = name
    if (type != null) updates.type = type
    if (parentId !== undefined) updates.parent_id = parentId
    if (content !== undefined) updates.content = content
    supabase
      .from('files')
      .update(updates)
      .eq('id', id)
      .then(({ error }) => {
        if (error) return res.status(500).json({ error: error.message })
        res.json({ ok: true })
      })
    return
  }

  const n = memoryStore.nodes[id]
  if (!n) return res.status(404).json({ error: 'not found' })
  if (name != null) n.name = name
  if (type != null) n.type = type
  if (parentId !== undefined) n.parentId = parentId
  if (content !== undefined) n.content = content
  n.updatedAt = Date.now()
  res.json({ ok: true })
})

function collectIds(nodes, pid) {
  const ids = [pid]
  for (const n of Object.values(nodes)) {
    if (n.parentId === pid) ids.push(...collectIds(nodes, n.id))
  }
  return ids
}

router.delete('/:id', (req, res) => {
  const id = req.params.id

  if (hasSupabase()) {
    supabase
      .from('files')
      .select('id, parent_id')
      .then(({ data, error }) => {
        if (error) return res.status(500).json({ error: error.message })
        const nodes = (data || []).reduce((acc, row) => {
          acc[row.id] = { id: row.id, parentId: row.parent_id }
          return acc
        }, {})
        const toDelete = collectIds(nodes, id)
        return supabase.from('files').delete().in('id', toDelete)
      })
      .then(({ error }) => {
        if (error) return res.status(500).json({ error: error.message })
        res.json({ ok: true })
      })
    return
  }

  const toDelete = collectIds(memoryStore.nodes, id)
  toDelete.forEach((rid) => delete memoryStore.nodes[rid])
  memoryStore.rootIds = memoryStore.rootIds.filter((x) => !toDelete.includes(x))
  res.json({ ok: true })
})

export default router
