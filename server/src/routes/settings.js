import { Router } from 'express'
import { getUserSettings, updateUserSettings } from '../data/settingsStore.js'

const router = Router()

function normalizeSettings(body = {}) {
  const out = {}

  if (typeof body.llmModel === 'string') out.llmModel = body.llmModel.trim()
  if (typeof body.embeddingModel === 'string') out.embeddingModel = body.embeddingModel.trim()
  if (body.storageEngine === 'local' || body.storageEngine === 'cloud') {
    out.storageEngine = body.storageEngine
  }

  if (body.chunkSize != null) {
    const v = Number(body.chunkSize)
    if (!Number.isNaN(v)) out.chunkSize = Math.min(4000, Math.max(100, v))
  }

  if (body.chunkOverlap != null) {
    const v = Number(body.chunkOverlap)
    if (!Number.isNaN(v)) out.chunkOverlap = Math.min(500, Math.max(0, v))
  }

  if (Array.isArray(body.chunkSeparators)) {
    out.chunkSeparators = body.chunkSeparators
      .map((s) => String(s).trim())
      .filter((s) => s.length > 0)
  }

  if (typeof body.enableParentChunks === 'boolean') {
    out.enableParentChunks = body.enableParentChunks
  }

  return out
}

router.get('/', async (req, res) => {
  try {
    const userId = req.user.id
    const settings = await getUserSettings(userId)
    res.json(settings)
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

router.post('/', async (req, res) => {
  try {
    const userId = req.user.id
    const partial = normalizeSettings(req.body || {})
    const next = await updateUserSettings(userId, partial)
    res.json(next)
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

export default router

