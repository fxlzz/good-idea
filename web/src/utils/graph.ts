import type { FileNode } from '../store/fileTree'

export const GRAPH_STORAGE_KEY = 'good-idea-graph'

export type GraphNode = { id: string; name: string; x?: number; y?: number }
export type GraphLink = { source: string; target: string }
export type Graph = { nodes: GraphNode[]; links: GraphLink[] }

export function loadGraph(): Graph {
  try {
    const raw = localStorage.getItem(GRAPH_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Graph
      if (Array.isArray(parsed.nodes) && Array.isArray(parsed.links)) {
        return parsed
      }
    }
  } catch {
    // ignore broken local storage payload
  }
  return { nodes: [], links: [] }
}

export function saveGraph(graph: Graph) {
  localStorage.setItem(GRAPH_STORAGE_KEY, JSON.stringify(graph))
}

export function replaceOutgoingLinks(
  sourceId: string,
  targetIds: string[],
  nodes: Record<string, FileNode>,
) {
  const graph = loadGraph()
  const fileNodeIds = new Set(
    Object.values(nodes)
      .filter((node) => node.type === 'file')
      .map((node) => node.id),
  )
  const uniqueTargets = Array.from(new Set(targetIds)).filter(
    (targetId) => targetId !== sourceId && fileNodeIds.has(targetId),
  )

  const keptLinks = graph.links.filter(
    (link) =>
      String(link.source) !== sourceId &&
      fileNodeIds.has(String(link.source)) &&
      fileNodeIds.has(String(link.target)),
  )

  const nextLinks = [
    ...keptLinks,
    ...uniqueTargets.map((targetId) => ({ source: sourceId, target: targetId })),
  ]

  saveGraph({ ...graph, links: nextLinks })
}
