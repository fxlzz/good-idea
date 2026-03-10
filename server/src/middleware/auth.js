import jwt from 'jsonwebtoken'

function getTokenFromHeader(req) {
  const header = req.headers.authorization || ''
  const [type, token] = header.split(' ')
  if (type !== 'Bearer' || !token) return null
  return token
}

export function requireAuth(req, res, next) {
  const token = getTokenFromHeader(req)
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const secret = process.env.JWT_SECRET
  if (!secret) return res.status(503).json({ error: 'Auth not configured: set JWT_SECRET' })

  try {
    const payload = jwt.verify(token, secret)
    const userId = payload?.sub
    const username = payload?.username
    if (!userId || !username) return res.status(401).json({ error: 'Invalid token' })
    req.user = { id: String(userId), username: String(username) }
    next()
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
}

