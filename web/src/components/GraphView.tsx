import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { useFileTreeStore } from '../store/fileTree'
import { loadGraph, saveGraph } from '../utils/graph'
import type { Graph, GraphNode } from '../utils/graph'

export default function GraphView() {
  const fgRef = useRef<{ d3Force: (name: string, fn?: unknown) => unknown } | null>(null)
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

  // 力导向图参数：连线稍长、拖动时少干扰其他节点、默认节点间距不要太远
  useEffect(() => {
    const id = setTimeout(() => {
      const fg = fgRef.current
      if (!fg?.d3Force) return
      const linkForce = fg.d3Force('link') as { distance: (v: number) => void; strength: (v: number) => void } | undefined
      const chargeForce = fg.d3Force('charge') as { strength: (v: number) => void } | undefined
      if (linkForce) {
        linkForce.distance(72)
        linkForce.strength(0.35)
      }
      if (chargeForce) chargeForce.strength(-14)
    }, 0)
    return () => clearTimeout(id)
  }, [])

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ForceGraph2D
        ref={fgRef}
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
