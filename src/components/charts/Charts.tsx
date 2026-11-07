import { useId, useMemo, useState } from 'react'

/* ===================================================================== */
/*  纯 SVG 图表：无第三方依赖，自动适配主题变量                            */
/* ===================================================================== */

const PALETTE = ['#2f8f5b', '#c98a2b', '#4a7fb5', '#b8553a', '#8a6fae', '#6f7f3a', '#3f9a8e', '#a05f8f']

function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i]
    const p1 = points[i + 1]
    const mx = (p0.x + p1.x) / 2
    d += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`
  }
  return d
}

/* ------------------------------ 折线图 ------------------------------ */
function compactNumber(v: number): string {
  if (v >= 10000) return `${(v / 10000).toFixed(1)}万`
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`
  return String(Math.round(v))
}

export function LineChart({
  data,
  height = 220,
  formatY = compactNumber,
}: {
  data: { label: string; a: number; b: number }[]
  height?: number
  formatY?: (v: number) => string
}) {
  const gid = useId().replace(/:/g, '')
  const [hover, setHover] = useState<number | null>(null)
  const W = 720
  const H = height
  const pad = { t: 14, r: 14, b: 26, l: 44 }
  const iw = W - pad.l - pad.r
  const ih = H - pad.t - pad.b

  const max = Math.max(...data.flatMap((d) => [d.a, d.b])) * 1.15
  const stepX = iw / Math.max(1, data.length - 1)
  const x = (i: number) => pad.l + i * stepX
  const y = (v: number) => pad.t + ih - (v / max) * ih

  const ptsA = data.map((d, i) => ({ x: x(i), y: y(d.a) }))
  const ptsB = data.map((d, i) => ({ x: x(i), y: y(d.b) }))
  const areaA = `${smoothPath(ptsA)} L ${x(data.length - 1)} ${pad.t + ih} L ${pad.l} ${pad.t + ih} Z`

  const ticks = [0, 0.25, 0.5, 0.75, 1]
    .map((t) => max * t)
    // 刻度取整，避免浮点误差出现 4999999999 之类的数值
    .map((v, i, arr) => (i === arr.length - 1 ? v : Math.round(v)))

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="chart" preserveAspectRatio="none" onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id={`ga${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.26" />
            <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeDasharray="3 4" />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" className="axis-text">
              {formatY(t)}
            </text>          </g>
        ))}
        <path d={areaA} fill={`url(#ga${gid})`} />
        <path d={smoothPath(ptsA)} fill="none" stroke="var(--brand)" strokeWidth="2.4" strokeLinecap="round" />
        <path d={smoothPath(ptsB)} fill="none" stroke="#c98a2b" strokeWidth="2" strokeDasharray="5 4" strokeLinecap="round" />
        {data.map((d, i) => (
          <g key={i}>
            <rect x={x(i) - stepX / 2} y={pad.t} width={stepX} height={ih} fill="transparent" onMouseEnter={() => setHover(i)} />
            {hover === i && <line x1={x(i)} x2={x(i)} y1={pad.t} y2={pad.t + ih} stroke="var(--border-strong)" />}
            <circle cx={x(i)} cy={y(d.a)} r={hover === i ? 5 : 3} fill="var(--surface)" stroke="var(--brand)" strokeWidth="2" />
            <text x={x(i)} y={H - 6} textAnchor="middle" className="axis-text">
              {d.label}
            </text>
          </g>
        ))}
      </svg>
      {hover !== null && (
        <div className="chart-tip" style={{ left: `${(x(hover) / W) * 100}%` }}>
          <b>{data[hover].label}</b>
          <span>
            <i style={{ background: 'var(--brand)' }} /> 用餐 {data[hover].a}
          </span>
          <span>
            <i style={{ background: '#c98a2b' }} /> 用户 {data[hover].b}
          </span>
        </div>
      )}
    </div>
  )
}

/* ------------------------------ 迷你走势 ------------------------------ */
export function Sparkline({ values, tone = 'var(--brand)', width = 96, height = 32 }: { values: number[]; tone?: string; width?: number; height?: number }) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * (width - 4) + 2,
    y: height - 3 - ((v - min) / span) * (height - 8),
  }))
  return (
    <svg width={width} height={height} className="sparkline" aria-hidden>
      <path d={smoothPath(pts)} fill="none" stroke={tone} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="2.4" fill={tone} />
    </svg>
  )
}

/* ------------------------------ 柱状图 ------------------------------ */
export function BarChart({ data, height = 220 }: { data: { name: string; value: number }[]; height?: number }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="bar-chart" style={{ height }}>
      {data.map((d, i) => (
        <div className="bar-col" key={d.name} title={`${d.name}: ${d.value}`}>
          <span className="bar-value">{d.value}</span>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ height: `${Math.max(4, (d.value / max) * 100)}%`, background: PALETTE[i % PALETTE.length] }}
            />
          </div>
          <span className="bar-label">{d.name}</span>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------ 环形图 ------------------------------ */
export function DonutChart({
  data,
  size = 168,
  thickness = 22,
  centerLabel,
  centerValue,
}: {
  data: { name: string; value: number }[]
  size?: number
  thickness?: number
  centerLabel?: string
  centerValue?: string | number
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  const segments = useMemo(() => {
    let acc = 0
    return data.map((d, i) => {
      const frac = d.value / total
      const seg = { ...d, color: PALETTE[i % PALETTE.length], dash: frac * c, offset: -acc * c }
      acc += frac
      return seg
    })
  }, [data, total, c])

  return (
    <div className="donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="donut">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={thickness} />
        {segments.map((s) => (
          <circle
            key={s.name}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={`${Math.max(0, s.dash - 2)} ${c}`}
            strokeDashoffset={s.offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dasharray 400ms ease' }}
          >
            <title>{`${s.name}: ${s.value}`}</title>
          </circle>
        ))}
        <text x="50%" y="47%" textAnchor="middle" className="donut-value">
          {centerValue ?? total}
        </text>
        <text x="50%" y="60%" textAnchor="middle" className="donut-label">
          {centerLabel ?? '总计'}
        </text>
      </svg>
      <ul className="legend">
        {segments.map((s) => (
          <li key={s.name}>
            <i style={{ background: s.color }} />
            <span>{s.name}</span>
            <b>{s.value}</b>
          </li>
        ))}
      </ul>
    </div>
  )
}
