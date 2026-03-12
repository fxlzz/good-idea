#!/usr/bin/env node
import os from 'os'
import readline from 'readline'
import { executeCommand } from './commands.js'
import { createCompleter } from './completer.js'
import { fmt } from './formatter.js'
import { loadHistory, saveHistory } from './history.js'
import { parseCommand } from './parser.js'

const state = {
  cwd: process.cwd(),
}

function getPrompt() {
  const home = os.homedir()
  const displayCwd = state.cwd.startsWith(home) ? state.cwd.replace(home, '~') : state.cwd
  return `${fmt.title('good-idea')} ${fmt.dim(displayCwd)} ${fmt.info('> ')}`
}

async function start() {
  const loadedHistory = await loadHistory()
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    completer: createCompleter(() => state.cwd),
    historySize: 300,
  })

  rl.history = [...loadedHistory].reverse()
  rl.setPrompt(getPrompt())

  console.log(fmt.success('Custom CLI started. Type `help` to list commands.'))
  rl.prompt()

  rl.on('line', async (line) => {
    const input = line.trim()
    if (!input) {
      rl.setPrompt(getPrompt())
      rl.prompt()
      return
    }

    const parsed = parseCommand(input)
    const result = await executeCommand(parsed, state)
    if (result.output) console.log(result.output)

    if (result.shouldExit) {
      rl.close()
      return
    }

    rl.setPrompt(getPrompt())
    rl.prompt()
  })

  rl.on('close', async () => {
    const ordered = [...rl.history].reverse()
    await saveHistory(ordered)
    process.stdout.write('\n')
    process.exit(0)
  })

  rl.on('SIGINT', () => {
    rl.close()
  })
}

start().catch((error) => {
  console.error(fmt.error(error.message || String(error)))
  process.exit(1)
})
