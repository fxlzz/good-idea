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
import { requireAuth } from './middleware/auth.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const server = createServer(app)

app.use(cors({ origin: true }))
app.use(express.json())

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const staticRoot = path.resolve(__dirname, '../../web/dist')

app.get('/api/health', (_, res) => {
  res.json({ ok: true })
})

app.use('/api/auth', authRouter)
app.use('/api/files', requireAuth, filesRouter)
app.use('/api/ai', requireAuth, aiRouter)

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

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
