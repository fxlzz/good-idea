import fs from 'fs/promises'
import os from 'os'
import path from 'path'

const HISTORY_FILE = path.join(os.homedir(), '.good-idea-cli-history')
const MAX_HISTORY = 300

export async function loadHistory() {
  try {
    const raw = await fs.readFile(HISTORY_FILE, 'utf8')
    return raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(-MAX_HISTORY)
  } catch {
    return []
  }
}

export async function saveHistory(history) {
  const lines = history
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, MAX_HISTORY)
  await fs.writeFile(HISTORY_FILE, `${lines.join('\n')}\n`, 'utf8')
}
