import fs from 'fs/promises'
import path from 'path'

export function resolveInputPath(cwd, inputPath = '.') {
  if (!inputPath || inputPath === '.') return cwd
  return path.resolve(cwd, inputPath)
}

export async function assertExists(targetPath) {
  await fs.access(targetPath)
}

export async function getPathType(targetPath) {
  const stat = await fs.stat(targetPath)
  if (stat.isDirectory()) return 'dir'
  if (stat.isFile()) return 'file'
  return 'other'
}

export async function listDirectory(targetPath, { all = false } = {}) {
  const entries = await fs.readdir(targetPath, { withFileTypes: true })
  const visible = all ? entries : entries.filter((entry) => !entry.name.startsWith('.'))
  return visible
    .map((entry) => ({
      name: entry.name,
      type: entry.isDirectory() ? 'dir' : 'file',
    }))
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
}

export async function removePath(targetPath, { recursive = false, force = false } = {}) {
  const type = await getPathType(targetPath)
  if (type === 'dir') {
    if (!recursive) throw new Error('Cannot remove directory without -r')
    await fs.rm(targetPath, { recursive: true, force })
    return
  }
  await fs.rm(targetPath, { force })
}

export async function mkdirPaths(paths, { recursive = false } = {}) {
  for (const dirPath of paths) {
    await fs.mkdir(dirPath, { recursive })
  }
}

export async function touchFile(filePath) {
  const now = new Date()
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, '', { flag: 'a' })
  await fs.utimes(filePath, now, now)
}

export async function readTextFile(filePath) {
  return fs.readFile(filePath, 'utf8')
}

export async function copyPath(source, target, { recursive = false } = {}) {
  const type = await getPathType(source)
  if (type === 'dir' && !recursive) {
    throw new Error('Cannot copy directory without -r')
  }
  await fs.cp(source, target, { recursive })
}

export async function movePath(source, target) {
  await fs.rename(source, target)
}

async function countRecursive(targetPath, totals) {
  const entries = await fs.readdir(targetPath, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory()) {
      totals.directories += 1
      await countRecursive(path.join(targetPath, entry.name), totals)
    } else if (entry.isFile()) {
      totals.files += 1
    }
  }
}

export async function countPathStats(targetPath, { recursive = false } = {}) {
  const totals = { files: 0, directories: 0 }
  const type = await getPathType(targetPath)

  if (type === 'file') {
    totals.files = 1
    return totals
  }

  if (recursive) {
    await countRecursive(targetPath, totals)
    return totals
  }

  const entries = await fs.readdir(targetPath, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory()) totals.directories += 1
    else if (entry.isFile()) totals.files += 1
  }
  return totals
}
