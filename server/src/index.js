import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import express from 'express'
import { createServer } from 'http'
// import { WebSocketServer } from 'ws'
// import pty from 'node-pty'
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
app.use(express.json())

const staticRoot = path.resolve(__dirname, '../../web/dist')

app.get('/api/health', (_, res) => {
  res.json({ ok: true })
})

app.use('/api/auth', authRouter)
app.use('/api/files', requireAuth, filesRouter)
app.use('/api/ai', requireAuth, aiRouter)
app.use('/api/settings', requireAuth, settingsRouter)

// WebSocket for terminal
// const wss = new WebSocketServer({ server, path: '/ws/terminal' })
// wss.on('connection', (ws) => {
//   const shell = process.platform === 'win32' ? 'powershell.exe' : '/bin/bash'
//   const ptyProcess = pty.spawn(shell, [], {
//     name: 'xterm-256color',
//     cols: 80,
//     rows: 24,
//     cwd: process.cwd(),
//     env: process.env,
//   })

//   ptyProcess.onData((data) => {
//     if (ws.readyState === 1) ws.send(data)
//   })

//   ws.on('message', (msg) => {
//     ptyProcess.write(msg.toString())
//   })

//   ws.on('close', () => {
//     ptyProcess.kill()
//   })

//   ptyProcess.onExit(() => {
//     if (ws.readyState === 1) ws.close()
//   })
// })

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
