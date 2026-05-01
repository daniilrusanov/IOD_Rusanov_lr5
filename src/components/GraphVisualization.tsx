import type { GraphPreset, SubsystemDef } from '../lib/graphs'
import type { DeviceResult } from '../lib/compute'

type Props = {
  preset: GraphPreset
  devices: DeviceResult[]
}

const W = 920
const H = 420
const PAD = 24
const NODE_R = 18

function topologicalSort(
  nodes: readonly number[],
  edges: readonly { readonly from: number; readonly to: number }[],
): number[] {
  const indeg = new Map<number, number>()
  for (const n of nodes) indeg.set(n, 0)
  for (const e of edges) {
    indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1)
  }
  const q: number[] = []
  for (const n of nodes) {
    if ((indeg.get(n) ?? 0) === 0) q.push(n)
  }
  const out: number[] = []
  while (q.length) {
    const n = q.shift()!
    out.push(n)
    for (const e of edges) {
      if (e.from !== n) continue
      const t = e.to
      const next = (indeg.get(t) ?? 0) - 1
      indeg.set(t, next)
      if (next === 0) q.push(t)
    }
  }
  if (out.length !== nodes.length) {
    throw new Error('Підсистема містить цикл або некоректні ребра')
  }
  return out
}

function computeLevels(
  nodes: readonly number[],
  edges: readonly { readonly from: number; readonly to: number }[],
): Map<number, number> {
  const preds = new Map<number, number[]>()
  for (const n of nodes) preds.set(n, [])
  for (const e of edges) {
    preds.get(e.to)!.push(e.from)
  }
  const topo = topologicalSort(nodes, edges)
  const level = new Map<number, number>()
  for (const n of topo) {
    const ps = preds.get(n) ?? []
    if (ps.length === 0) level.set(n, 0)
    else level.set(n, Math.max(...ps.map((p) => level.get(p)!)) + 1)
  }
  return level
}

/** Позиції з normalized coords (див. graphs.fixedLayout), узгоджено з layoutDag по внутрішній області. */
function layoutFixed(
  sub: SubsystemDef,
  x0: number,
  innerTop: number,
  innerH: number,
  colW: number,
): Map<number, { x: number; y: number }> {
  const pos = new Map<number, { x: number; y: number }>()
  const padX = 20
  const innerLeft = x0 + padX
  const innerW = colW - 2 * padX
  for (const p of sub.fixedLayout ?? []) {
    pos.set(p.deviceIndex, {
      x: innerLeft + p.fx * innerW,
      y: innerTop + p.fy * innerH,
    })
  }
  return pos
}

function layoutDag(
  sub: SubsystemDef,
  cx: number,
  innerTop: number,
  innerH: number,
  colW: number,
): Map<number, { x: number; y: number }> {
  const nodes = sub.deviceIndices
  const edges = sub.edges!
  const level = computeLevels(nodes, edges)
  const byLevel = new Map<number, number[]>()
  let maxL = 0
  for (const n of nodes) {
    const L = level.get(n) ?? 0
    maxL = Math.max(maxL, L)
    if (!byLevel.has(L)) byLevel.set(L, [])
    byLevel.get(L)!.push(n)
  }
  for (const arr of byLevel.values()) arr.sort((a, b) => a - b)

  const pos = new Map<number, { x: number; y: number }>()
  const maxSpan = Math.min(colW * 0.42, 150)
  for (let L = 0; L <= maxL; L++) {
    const row = byLevel.get(L) ?? []
    const k = row.length
    const y =
      maxL === 0
        ? innerTop + innerH / 2
        : innerTop + (L / maxL) * (innerH - 2 * NODE_R) + NODE_R
    if (k === 0) continue
    if (k === 1) {
      pos.set(row[0], { x: cx, y })
    } else {
      for (let i = 0; i < k; i++) {
        const t = k === 1 ? 0 : (2 * i) / (k - 1) - 1
        pos.set(row[i], { x: cx + t * maxSpan, y })
      }
    }
  }
  return pos
}

function shortenToCircle(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  r: number,
): { x1: number; y1: number; x2: number; y2: number } {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  return {
    x1: x1 + ux * r,
    y1: y1 + uy * r,
    x2: x2 - ux * r,
    y2: y2 - uy * r,
  }
}

export function GraphVisualization({ preset, devices }: Props) {
  const colCount = preset.subsystems.length
  const colW = (W - 2 * PAD) / colCount

  return (
    <div className="graph-viz">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="graph-svg"
        role="img"
        aria-label="Граф системи функціональних пристроїв"
      >
        <defs>
          <marker
            id="arrow"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="4"
            orient="auto"
          >
            <path d="M0,0 L8,4 L0,8 z" fill="var(--edge)" />
          </marker>
        </defs>

        {preset.subsystems.map((sub, c) => {
          const x0 = PAD + c * colW
          const chain = sub.deviceIndices
          const n = chain.length
          const innerTop = 56
          const innerH = H - innerTop - PAD
          const cx = x0 + colW / 2
          const edges = sub.edges

          if (edges && edges.length > 0) {
            const pos =
              sub.fixedLayout && sub.fixedLayout.length > 0
                ? layoutFixed(sub, x0, innerTop, innerH, colW)
                : layoutDag(sub, cx, innerTop, innerH, colW)
            return (
              <g key={sub.id}>
                <rect
                  x={x0 + 6}
                  y={32}
                  width={colW - 12}
                  height={H - 40}
                  rx={10}
                  className="graph-subsystem-bg"
                />
                <text
                  x={x0 + colW / 2}
                  y={22}
                  textAnchor="middle"
                  className="graph-subsystem-title"
                >
                  {sub.label}
                </text>

                {edges.map((e, ei) => {
                  const p1 = pos.get(e.from)
                  const p2 = pos.get(e.to)
                  if (!p1 || !p2) return null
                  const s = shortenToCircle(p1.x, p1.y, p2.x, p2.y, NODE_R)
                  return (
                    <line
                      key={`${e.from}-${e.to}-${ei}`}
                      x1={s.x1}
                      y1={s.y1}
                      x2={s.x2}
                      y2={s.y2}
                      className="graph-edge"
                      markerEnd="url(#arrow)"
                    />
                  )
                })}

                {chain.map((devIdx) => {
                  const p = pos.get(devIdx)
                  if (!p) return null
                  const d = devices[devIdx]
                  const load = d?.load ?? 0
                  const isBottleneck = Math.abs(load - 1) < 1e-6
                  return (
                    <g key={devIdx}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={NODE_R}
                        className={`graph-node ${isBottleneck ? 'bottleneck' : ''}`}
                      />
                      <text
                        x={p.x}
                        y={p.y + 5}
                        textAnchor="middle"
                        className="graph-node-label"
                      >
                        {devIdx}
                      </text>
                    </g>
                  )
                })}
              </g>
            )
          }

          const step = n > 1 ? innerH / (n - 1) : 0
          return (
            <g key={sub.id}>
              <rect
                x={x0 + 6}
                y={32}
                width={colW - 12}
                height={H - 40}
                rx={10}
                className="graph-subsystem-bg"
              />
              <text x={x0 + colW / 2} y={22} textAnchor="middle" className="graph-subsystem-title">
                {sub.label}
              </text>

              {chain.map((devIdx, k) => {
                const y = n === 1 ? innerTop + innerH / 2 : innerTop + k * step
                const d = devices[devIdx]
                const load = d?.load ?? 0
                const isBottleneck = Math.abs(load - 1) < 1e-6

                return (
                  <g key={devIdx}>
                    {k < n - 1 && (
                      <line
                        x1={cx}
                        y1={y + 18}
                        x2={cx}
                        y2={y + step - 18}
                        className="graph-edge"
                        markerEnd="url(#arrow)"
                      />
                    )}
                    <circle
                      cx={cx}
                      cy={y}
                      r={NODE_R}
                      className={`graph-node ${isBottleneck ? 'bottleneck' : ''}`}
                    />
                    <text x={cx} y={y + 5} textAnchor="middle" className="graph-node-label">
                      {devIdx}
                    </text>
                  </g>
                )
              })}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
