import type { FileNode } from '../store/fileTree'

export const FILE_TREE_DRAG_MIME = 'application/x-goodidea-node-id'

function normalizePathSegments(input: string): string[] {
  const raw = input.replaceAll('\\', '/').split('/')
  const normalized: string[] = []

  raw.forEach((seg) => {
    const part = seg.trim()
    if (!part || part === '.') return
    if (part === '..') {
      normalized.pop()
      return
    }
    normalized.push(part)
  })

  return normalized
}

function getNodePathSegments(nodeId: string, nodes: Record<string, FileNode>): string[] | null {
  const path: string[] = []
  let cursor: FileNode | undefined = nodes[nodeId]
  const visited = new Set<string>()

  while (cursor) {
    if (visited.has(cursor.id)) return null
    visited.add(cursor.id)
    path.unshift(cursor.name)
    if (!cursor.parentId) break
    cursor = nodes[cursor.parentId]
  }

  return path.length ? path : null
}

function toRelativePath(fromFilePath: string[], toFilePath: string[]): string {
  const fromDir = fromFilePath.slice(0, -1)
  let common = 0

  while (
    common < fromDir.length &&
    common < toFilePath.length &&
    fromDir[common] === toFilePath[common]
  ) {
    common += 1
  }

  const upLevels = fromDir.length - common
  const downSegments = toFilePath.slice(common)
  const parts = [...new Array(upLevels).fill('..'), ...downSegments]

  if (parts.length === 0) return './'
  if (parts[0] === '..') return parts.join('/')
  return `./${parts.join('/')}`
}

function parseMarkdownLinkTarget(rawTarget: string): string | null {
  const target = rawTarget.trim()
  if (!target) return null

  const withoutBracket =
    target.startsWith('<') && target.endsWith('>') ? target.slice(1, -1).trim() : target
  if (!withoutBracket) return null

  const [pathPart] = withoutBracket.split('#')
  const [cleanPath] = pathPart.split('?')
  if (!cleanPath) return null
  return cleanPath
}

function decodePathSafely(path: string): string {
  try {
    return decodeURIComponent(path)
  } catch {
    return path
  }
}

export function buildRelativeMarkdownLink(
  fromNodeId: string,
  toNodeId: string,
  nodes: Record<string, FileNode>,
): string | null {
  const fromPath = getNodePathSegments(fromNodeId, nodes)
  const toPath = getNodePathSegments(toNodeId, nodes)
  const toNode = nodes[toNodeId]
  if (!fromPath || !toPath || !toNode || toNode.type !== 'file') return null

  const relativePath = toRelativePath(fromPath, toPath)
  const displayName = toNode.name.replace(/\.md$/i, '') || toNode.name

  return `[${displayName}](${relativePath})`
}

export function extractMarkdownRelativeRefs(content: string): string[] {
  const refs = new Set<string>()
  const regex = /\[[^\]]*]\(([^)]+)\)/g

  for (const match of content.matchAll(regex)) {
    const target = parseRelativeMarkdownRef(match[1] ?? '')
    if (!target) continue
    refs.add(target)
  }

  return Array.from(refs)
}

export function parseRelativeMarkdownRef(rawTarget: string): string | null {
  const target = parseMarkdownLinkTarget(rawTarget)
  if (!target) return null
  if (!(target.startsWith('./') || target.startsWith('../'))) return null
  if (!target.toLowerCase().endsWith('.md')) return null
  return decodePathSafely(target)
}

export function resolveRefToNodeId(
  fromNodeId: string,
  refPath: string,
  nodes: Record<string, FileNode>,
): string | null {
  const fromPath = getNodePathSegments(fromNodeId, nodes)
  if (!fromPath) return null

  const baseDir = fromPath.slice(0, -1)
  const resolved = normalizePathSegments([...baseDir, ...normalizePathSegments(refPath)].join('/'))
  const resolvedKey = resolved.join('/')

  for (const node of Object.values(nodes)) {
    if (node.type !== 'file') continue
    const nodePath = getNodePathSegments(node.id, nodes)
    if (!nodePath) continue
    if (nodePath.join('/') === resolvedKey) return node.id
  }

  return null
}

export function getReferencedMarkdownNodeIds(
  fromNodeId: string,
  content: string,
  nodes: Record<string, FileNode>,
): string[] {
  const refs = extractMarkdownRelativeRefs(content)
  const ids = new Set<string>()

  refs.forEach((ref) => {
    const id = resolveRefToNodeId(fromNodeId, ref, nodes)
    if (!id || id === fromNodeId) return
    const target = nodes[id]
    if (!target || target.type !== 'file' || (target.ext ?? '').toLowerCase() !== '.md') return
    ids.add(id)
  })

  return Array.from(ids)
}
