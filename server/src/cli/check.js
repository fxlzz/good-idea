import assert from 'assert/strict'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { executeCommand } from './commands.js'
import { parseCommand } from './parser.js'

async function run() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'good-idea-cli-'))
  const state = { cwd: root }

  const runCmd = async (input) => executeCommand(parseCommand(input), state)

  let res = await runCmd('mkdir alpha')
  assert.equal(res.shouldExit, false)

  res = await runCmd('touch alpha/a.txt')
  assert.equal(res.shouldExit, false)

  res = await runCmd('ls alpha')
  assert.match(res.output, /a\.txt/)

  res = await runCmd('cp alpha/a.txt alpha/b.txt')
  assert.match(res.output, /copied/)

  res = await runCmd('mv alpha/b.txt alpha/c.txt')
  assert.match(res.output, /moved/)

  res = await runCmd('stat alpha')
  assert.match(res.output, /Files:/)
  assert.match(res.output, /Directories:/)

  res = await runCmd('rm alpha/c.txt')
  assert.match(res.output, /removed/)

  res = await runCmd('rm -r alpha')
  assert.match(res.output, /removed/)

  await fs.rm(root, { recursive: true, force: true })
  console.log('cli check passed')
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
