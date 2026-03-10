import { Router } from 'express'
import { memoryStore } from '../data/filesSource.js'
import { supabase, hasSupabase } from '../db.js'
import { embedFile, removeFileEmbeddings } from './ai.js'
import { isEmbeddable } from '../services/embedding.js'

const router = Router()

function triggerEmbed(file) {
  if (file.content && isEmbeddable(file.ext)) {
    embedFile(file).catch((err) =>
      console.warn('Auto-embed failed for', file.id, err.message)
    )
  }
}

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

router.post('/', async (req, res) => {
  const { id, name, type, parentId, content } = req.body || {}
  if (!id || !name || !type) {
    return res.status(400).json({ error: 'id, name, type required' })
  }
  const now = new Date().toISOString()
  const ext = type === 'file' ? (name.includes('.') ? `.${name.split('.').pop()}` : '') : null
  const row = {
    id,
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
    triggerEmbed({ id, name, content, ext })
    return
  }

  memoryStore.nodes[id] = {
    id,
    name,
    type,
    parentId: parentId ?? null,
    content,
    ext,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  if (!parentId) memoryStore.rootIds.push(id)
  res.status(201).json(row)
  triggerEmbed({ id, name, content, ext })
})

router.put('/:id', async (req, res) => {
  const id = req.params.id
  const { name, type, parentId, content } = req.body || {}
  const now = new Date().toISOString()

  if (hasSupabase()) {
    const updates = { updated_at: now }
    if (name != null) updates.name = name
    if (type != null) updates.type = type
    if (parentId !== undefined) updates.parent_id = parentId
    if (content !== undefined) updates.content = content

    const { error } = await supabase.from('files').update(updates).eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    res.json({ ok: true })

    if (content !== undefined) {
      const { data } = await supabase.from('files').select('id, name, content, ext').eq('id', id).single()
      if (data) triggerEmbed(data)
    }
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
  if (content !== undefined) triggerEmbed({ id: n.id, name: n.name, content: n.content, ext: n.ext })
})

function collectIds(nodes, pid) {
  const ids = [pid]
  for (const n of Object.values(nodes)) {
    if (n.parentId === pid) ids.push(...collectIds(nodes, n.id))
  }
  return ids
}

router.delete('/:id', async (req, res) => {
  const id = req.params.id

  if (hasSupabase()) {
    const { data, error } = await supabase.from('files').select('id, parent_id')
    if (error) return res.status(500).json({ error: error.message })

    const nodes = (data || []).reduce((acc, row) => {
      acc[row.id] = { id: row.id, parentId: row.parent_id }
      return acc
    }, {})
    const toDelete = collectIds(nodes, id)

    const { error: delErr } = await supabase.from('files').delete().in('id', toDelete)
    if (delErr) return res.status(500).json({ error: delErr.message })
    res.json({ ok: true })

    for (const did of toDelete) {
      removeFileEmbeddings(did).catch(() => {})
    }
    return
  }

  const toDelete = collectIds(memoryStore.nodes, id)
  toDelete.forEach((rid) => delete memoryStore.nodes[rid])
  memoryStore.rootIds = memoryStore.rootIds.filter((x) => !toDelete.includes(x))
  res.json({ ok: true })
})

export default router
