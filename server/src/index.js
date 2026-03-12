import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import express from 'express'
import { createServer } from 'http'
import { attachCliWebSocket } from './cli/wsTerminal.js'
import filesRouter from './routes/files.js'
import aiRouter from './routes/ai.js'
import authRouter from './routes/auth.js'
import settingsRouter from './routes/settings.js'
import { requireAuth } from './middleware/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const app = express()
const PORT = process.env.PORT || 3001
const server = createServer(app)

app.use(cors({ origin: true }))
app.use(
  express.json({
    limit: process.env.JSON_BODY_LIMIT || '10mb',
  }),
)
app.use(
  express.urlencoded({
    extended: true,
    limit: process.env.JSON_BODY_LIMIT || '10mb',
  }),
)

const staticRoot = path.resolve(__dirname, '../../web/dist')

app.get('/api/health', (_, res) => {
  res.json({ ok: true })
})

app.get('/api/config/upload-limit', (_, res) => {
  const raw = process.env.JSON_BODY_LIMIT || '10mb'
  const match = raw.match(/^(\d+(?:\.\d+)?)\s*(kb|mb|gb|b)?$/i)
  if (!match) return res.json({ bytes: 10 * 1024 * 1024, label: '10MB' })
  const num = parseFloat(match[1])
  const unit = (match[2] || 'b').toLowerCase()
  const multiplier = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 }[unit] ?? 1
  const bytes = Math.floor(num * multiplier)
  res.json({ bytes, label: raw.toUpperCase() })
})

app.use('/api/auth', authRouter)
app.use('/api/files', requireAuth, filesRouter)
app.use('/api/ai', requireAuth, aiRouter)
app.use('/api/settings', requireAuth, settingsRouter)

attachCliWebSocket(server)

app.use(express.static(staticRoot))

app.get('*', (req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
    return res.status(404).end()
  }
  res.sendFile(path.join(staticRoot, 'index.html'))
})

server.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}`)
  const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000'
  try {
    const u = new URL(chromaUrl)
    const base = `${u.protocol}//${u.hostname}:${u.port || (u.protocol === 'https:' ? 443 : 8000)}`
    const res = await fetch(`${base}/api/v2/heartbeat`, { signal: AbortSignal.timeout(3000) })
    if (res.ok) console.log(`Chroma: ${base} ok`)
    else console.warn(`Chroma: ${base} returned ${res.status}`)
  } catch (e) {
    console.warn(`Chroma: cannot reach ${chromaUrl} —`, e.message || e)
    console.warn('Start Chroma (e.g. docker run -p 8000:8000 chromadb/chroma) or set CHROMA_URL.')
  }
})
