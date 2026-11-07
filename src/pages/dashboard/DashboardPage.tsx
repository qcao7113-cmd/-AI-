import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as api from '@/lib/data'
import type { DashboardStats } from '@/types'
import { formatDateTime, formatNumber } from '@/utils/format'
import { Badge, Button, Card, Skeleton } from '@/components/ui/Primitives'
import { Icon } from '@/components/ui/Icon'
import { BarChart, DonutChart, LineChart, Sparkline } from '@/components/charts/Charts'
import { PageHead } from '@/components/layout/PageHead'

const NATURE_TONE: Record<string, string> = { 寒: 'cold', 凉: 'cool', 平: 'neutral', 温: 'warm', 热: 'hot' }

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    api.getDashboard().then((d) => {
      if (alive) {
        setData(d)
        setLoading(false)
      }
    })
    return () => {
      alive = false
    }
  }, [])

  return (
    <>
      <PageHead
        title="数据概览"
        description="平台整体运营与健康管理数据总览"
        actions={
          <Link to="/recipes">
            <Button icon={<Icon.Bowl size={16} />}>查看食谱库</Button>
          </Link>
        }
      />

      {/* KPI 卡片 */}
      <div className="kpi-grid">
        {loading || !data
          ? Array.from({ length: 4 }).map((_, i) => (
              <div className="kpi-card" key={i}>
                <Skeleton h={14} w="45%" />
                <Skeleton h={30} w="60%" style={{ marginTop: 12 }} />
                <Skeleton h={12} w="80%" style={{ marginTop: 12 }} />
              </div>
            ))
          : data.kpis.map((k, i) => (
              <div className="kpi-card" key={k.key} style={{ animationDelay: `${i * 60}ms` }}>
                <div className="kpi-top">
                  <span className="kpi-label">{k.label}</span>
                  <span className={`delta ${k.delta >= 0 ? 'up' : 'down'}`}>
                    {k.delta >= 0 ? '▲' : '▼'} {Math.abs(k.delta)}%
                  </span>
                </div>
                <div className="kpi-value">
                  {k.unit === '%' ? k.value.toFixed(1) : formatNumber(k.value)}
                  {k.unit && <em>{k.unit}</em>}
                </div>
                <div className="kpi-foot">
                  <span className="muted-xs">较上周</span>
                  <Sparkline values={k.sparkline} tone={k.delta >= 0 ? 'var(--success)' : 'var(--danger)'} />
                </div>
              </div>
            ))}
      </div>

      {/* 趋势 + 慢病分布 */}
      <div className="grid-2-1">
        <Card
          title="近两周用餐趋势"
          subtitle="每日用药膳记录与活跃用户数"
          extra={
            <div className="legend-inline">
              <span><i style={{ background: 'var(--brand)' }} />用餐记录</span>
              <span><i style={{ background: '#c98a2b' }} />活跃用户</span>
            </div>
          }
        >
          {loading || !data ? <Skeleton h={220} radius={10} /> : <LineChart data={data.trend.map((t) => ({ label: t.date, a: t.meals, b: t.users }))} />}
        </Card>

        <Card title="慢病人群分布" subtitle="按慢病类型统计">
          {loading || !data ? <Skeleton h={200} radius={10} /> : <DonutChart data={data.chronicShare} centerLabel="在管人群" />}
        </Card>
      </div>

      {/* 三列 */}
      <div className="grid-3">
        <Card title="体质分布" subtitle="用户中医体质辨识结果">
          {loading || !data ? <Skeleton h={200} radius={10} /> : <BarChart data={data.constitutionShare.filter((c) => c.value > 0)} />}
        </Card>

        <Card title="热门食谱" subtitle="按浏览量排序" extra={<Link className="link-btn" to="/recipes">更多</Link>}>
          {loading || !data ? (
            <Skeleton h={200} radius={10} />
          ) : (
            <ul className="rank-list">
              {data.hotRecipes.map((r, i) => (
                <li key={r.name}>
                  <span className={`rank-no rank-${i + 1}`}>{i + 1}</span>
                  <div className="rank-main">
                    <b>{r.name}</b>
                    <span className="muted-xs">{r.category} · 收藏 {r.favorites}</span>
                  </div>
                  <span className="muted-xs">{formatNumber(r.views)} 浏览</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="库存预警" subtitle="库存不足 10 份的食材">
          {loading || !data ? (
            <Skeleton h={200} radius={10} />
          ) : data.lowStock.length ? (
            <ul className="stock-list">
              {data.lowStock.map((i) => (
                <li key={i.id}>
                  <span className={`nature-badge nature-${NATURE_TONE[i.nature]}`}>{i.nature}</span>
                  <b>{i.name}</b>
                  <Badge tone="warning">剩余 {i.stock} {i.unit}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <div className="muted-xs" style={{ padding: '20px 0', textAlign: 'center' }}>库存充足，暂无预警</div>
          )}
        </Card>
      </div>

      {/* 最新用餐 */}
      <Card
        title="最新用餐记录"
        subtitle="用户近期用药膳情况"
        padded={false}
        extra={<Link className="link-btn" to="/meals">全部记录</Link>}
      >
        {loading || !data ? (
          <div style={{ padding: 20 }}>
            <Skeleton h={140} radius={10} />
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>用户</th>
                  <th>食谱</th>
                  <th>餐次</th>
                  <th>摄入热量</th>
                  <th>评分</th>
                  <th>记录时间</th>
                </tr>
              </thead>
              <tbody>
                {data.recentMeals.map((m) => (
                  <tr key={m.id}>
                    <td className="cell-primary">{m.customer}</td>
                    <td>{m.recipeName}</td>
                    <td>
                      <Badge tone="brand">{m.mealType}</Badge>
                    </td>
                    <td>{m.calories} kcal</td>
                    <td>{'★'.repeat(m.score)}</td>
                    <td className="muted-xs">{formatDateTime(m.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
