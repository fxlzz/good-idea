import { useCallback, useEffect, useMemo, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { useFileTreeStore } from '../store/fileTree'

const STORAGE_KEY = 'good-idea-graph'

type GraphNode = { id: string; name: string }
type GraphLink = { source: string; target: string }
type Graph = { nodes: GraphNode[]; links: GraphLink[] }

function loadGraph(): Graph {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Graph
      if (parsed.nodes && parsed.links) return parsed
    }
  } catch {
    // ignore
  }
  return { nodes: [], links: [] }
}

function saveGraph(g: Graph) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(g))
}

export default function GraphView() {
  const nodes = useFileTreeStore((s) => s.nodes)
  const fileList = useMemo(
    () => Object.values(nodes).filter((n) => n.type === 'file'),
    [nodes]
  )

  const [graphData, setGraphData] = useState<Graph>(() => {
    const stored = loadGraph()
    const nodeIds = new Set(fileList.map((n) => n.id))
    const nodes = stored.nodes.filter((n) => nodeIds.has(n.id))
    const links = stored.links.filter(
      (l) => nodeIds.has(String(l.source)) && nodeIds.has(String(l.target))
    )
    return { nodes, links }
  })

  useEffect(() => {
    const nodeIds = new Set(fileList.map((n) => n.id))
    setGraphData((prev) => {
      const nextNodes = [...prev.nodes]
      fileList.forEach((f) => {
        if (!nextNodes.some((n) => n.id === f.id)) {
          nextNodes.push({ id: f.id, name: f.name })
        }
      })
      const nodes = nextNodes.filter((n) => nodeIds.has(n.id))
      const links = prev.links.filter(
        (l) => nodeIds.has(String(l.source)) && nodeIds.has(String(l.target))
      )
      const next = { nodes, links }
      saveGraph(next)
      return next
    })
  }, [fileList])

  const handleNodeDragEnd = useCallback(
    (node: { id: string; x?: number; y?: number }) => {
      setGraphData((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) =>
          n.id === node.id ? { ...n, x: node.x, y: node.y } : n
        ),
      }))
    },
    []
  )

  const fgData = useMemo(
    () => ({
      nodes: graphData.nodes,
      links: graphData.links.map((l) => ({ source: l.source, target: l.target })),
    }),
    [graphData]
  )

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ForceGraph2D
        graphData={fgData}
        nodeLabel="name"
        onNodeDragEnd={handleNodeDragEnd}
        nodeCanvasObject={(node, ctx) => {
          const n = node as GraphNode & { x?: number; y?: number }
          const x = n.x ?? 0
          const y = n.y ?? 0
          ctx.fillStyle = '#5b8ff9'
          ctx.beginPath()
          ctx.arc(x, y, 5, 0, 2 * Math.PI)
          ctx.fill()
          ctx.fillStyle = '#000'
          ctx.font = '12px sans-serif'
          ctx.fillText(n.name ?? n.id, x + 8, y + 4)
        }}
      />
    </div>
  )
}
