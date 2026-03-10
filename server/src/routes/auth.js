import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import { createUser, findUserByUsername } from '../services/users.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

function normalizeUsername(username) {
  return String(username || '').trim()
}

function getJwtConfig() {
  const secret = process.env.JWT_SECRET
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d'
  return { secret, expiresIn }
}

router.post('/login', async (req, res) => {
  const username = normalizeUsername(req.body?.username)
  const password = String(req.body?.password || '')

  if (!username || !password) return res.status(400).json({ error: 'username and password required' })

  const { secret, expiresIn } = getJwtConfig()
  if (!secret) return res.status(503).json({ error: 'Auth not configured: set JWT_SECRET' })

  try {
    const existing = await findUserByUsername(username)

    let user
    if (!existing) {
      const password_hash = await bcrypt.hash(password, 10)
      const id = randomUUID()
      user = await createUser({ id, username, password_hash })
    } else {
      const ok = await bcrypt.compare(password, existing.password_hash)
      if (!ok) return res.status(401).json({ error: 'invalid credentials' })
      user = existing
    }

    const token = jwt.sign({ sub: user.id, username: user.username }, secret, { expiresIn })
    res.json({ token, user: { id: user.id, username: user.username } })
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) })
  }
})

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user })
})

export default router

