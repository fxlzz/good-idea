import fs from 'fs'
import path from 'path'
import { COMMAND_OPTIONS, COMMANDS } from './commands.js'

const PATH_COMMANDS = new Set(['cat', 'cd', 'cp', 'ls', 'mkdir', 'mv', 'rm', 'stat', 'touch'])

function splitInput(line) {
  return line.trimStart().split(/\s+/)
}

function completeCommand(token) {
  const candidates = COMMANDS.filter((cmd) => cmd.startsWith(token))
  return candidates.length > 0 ? candidates : COMMANDS
}

function completeOptions(command, token) {
  const options = COMMAND_OPTIONS[command] || []
  const candidates = options.filter((opt) => opt.startsWith(token))
  return candidates.length > 0 ? candidates : options
}

function completePath(token, cwd) {
  const hasSlash = token.includes('/') || token.includes('\\')
  const dirPart = hasSlash ? path.dirname(token) : '.'
  const basePart = hasSlash ? path.basename(token) : token
  const absoluteDir = path.resolve(cwd, dirPart === '.' ? '' : dirPart)
  const prefix = dirPart === '.' ? '' : `${dirPart}${path.sep}`

  let entries = []
  try {
    entries = fs.readdirSync(absoluteDir, { withFileTypes: true })
  } catch {
    return []
  }

  return entries
    .filter((entry) => entry.name.startsWith(basePart))
    .map((entry) => {
      const suffix = entry.isDirectory() ? path.sep : ''
      return `${prefix}${entry.name}${suffix}`
    })
}

export function createCompleter(getCwd) {
  return (line) => {
    const endsWithSpace = /\s$/.test(line)
    const tokens = splitInput(line)

    if (tokens.length === 0 || (tokens.length === 1 && !endsWithSpace)) {
      const token = tokens[0] || ''
      return [completeCommand(token), token]
    }

    const command = tokens[0]
    const current = endsWithSpace ? '' : tokens.at(-1) || ''
    const cwd = getCwd()

    if (current.startsWith('-')) {
      const options = completeOptions(command, current)
      return [options, current]
    }

    if (PATH_COMMANDS.has(command)) {
      const paths = completePath(current, cwd)
      return [paths.length > 0 ? paths : [], current]
    }

    return [[], current]
  }
}
