import { WebSocketServer } from 'ws'
import { executeCommand } from './commands.js'
import { fmt } from './formatter.js'
import { parseCommand } from './parser.js'

function createPrompt(cwd) {
  return `${fmt.title('cli')} ${fmt.dim(cwd)} ${fmt.info('> ')}`
}

function normalizeForXterm(text) {
  return text.replace(/\r?\n/g, '\r\n')
}

function send(ws, text) {
  if (ws.readyState === ws.OPEN) ws.send(normalizeForXterm(text))
}

export function attachCliWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws/terminal' })

  wss.on('connection', (ws) => {
    const state = { cwd: process.cwd() }
    send(
      ws,
      `${fmt.success('CLI connected. Run `help` to list commands.')}\r\n${createPrompt(state.cwd)}`,
    )

    ws.on('message', async (message) => {
      let payload = null
      try {
        payload = JSON.parse(String(message))
      } catch {
        send(ws, `${fmt.error('Invalid payload')}\r\n${createPrompt(state.cwd)}`)
        return
      }

      if (payload?.type !== 'command') {
        send(ws, `${fmt.error('Unsupported message type')}\r\n${createPrompt(state.cwd)}`)
        return
      }

      const input = String(payload.input || '').trim()
      if (!input) {
        send(ws, createPrompt(state.cwd))
        return
      }

      const parsed = parseCommand(input)
      const result = await executeCommand(parsed, state)
      let output = ''
      if (result.output) output += `${result.output}\r\n`

      if (result.shouldExit) {
        output += fmt.dim('Session closed.')
        send(ws, output)
        ws.close()
        return
      }

      output += createPrompt(state.cwd)
      send(ws, output)
    })
  })

  return wss
}
