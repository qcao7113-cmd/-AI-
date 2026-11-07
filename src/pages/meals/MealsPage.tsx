import { useCallback, useEffect, useState } from 'react'
import * as api from '@/lib/data'
import type { MealRecord } from '@/types'
import { formatDateTime, toCsv, downloadFile, formatDate } from '@/utils/format'
import { useToast } from '@/context/AppContext'
import { DataTable, FilterSelect, SearchBox, Toolbar, type Column } from '@/components/ui/DataTable'
import { Badge, Button, Card } from '@/components/ui/Primitives'
import { Icon } from '@/components/ui/Icon'
import { PageHead } from '@/components/layout/PageHead'

const MEAL_TYPES: MealRecord['mealType'][] = ['早餐', '午餐', '晚餐', '加餐']
const TYPE_TONE: Record<MealRecord['mealType'], 'info' | 'brand' | 'warning' | 'muted'> = {
  早餐: 'info', 午餐: 'brand', 晚餐: 'warning', 加餐: 'muted',
}

export default function MealsPage() {
  const toast = useToast()
  const [rows, setRows] = useState<MealRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(12)
  const [keyword, setKeyword] = useState('')
  const [mealType, setMealType] = useState('')
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    const res = await api.listMeals({ page, pageSize, keyword, mealType })
    setRows(res.items)
    setTotal(res.total)
    setLoading(false)
  }, [page, pageSize, keyword, mealType])

  useEffect(() => {
    const t = setTimeout(() => void fetch(), 200)
    return () => clearTimeout(t)
  }, [fetch])
  useEffect(() => setPage(1), [keyword, mealType])

  const exportCsv = async () => {
    const all = await api.listMeals({ page: 1, pageSize: 1000, keyword, mealType })
    const csv = toCsv(
      ['用户', '食谱', '餐次', '份数', '热量(kcal)', '评分', '备注', '记录时间'],
      all.items.map((m) => [m.customer, m.recipeName, m.mealType, m.portion, m.calories, m.score, m.note, formatDateTime(m.createdAt)]),
    )
    downloadFile(`用餐记录_${formatDate(new Date().toISOString())}.csv`, csv)
    await api.recordExport('用餐记录', all.items.length)
    toast.success(`已导出 ${all.items.length} 条用餐记录`)
  }

  const avgScore = rows.length ? (rows.reduce((s, r) => s + r.score, 0) / rows.length).toFixed(1) : '—'
  const avgCal = rows.length ? Math.round(rows.reduce((s, r) => s + r.calories, 0) / rows.length) : 0

  const columns: Column<MealRecord>[] = [
    { key: 'customer', title: '用户', sortValue: (m) => m.customer, render: (m) => <span className="cell-primary">{m.customer}</span> },
    { key: 'recipe', title: '食谱', render: (m) => m.recipeName },
    { key: 'type', title: '餐次', width: 90, render: (m) => <Badge tone={TYPE_TONE[m.mealType]}>{m.mealType}</Badge> },
    { key: 'portion', title: '份数', width: 70, align: 'center', render: (m) => m.portion },
    { key: 'calories', title: '热量', width: 100, align: 'right', sortValue: (m) => m.calories, render: (m) => `${m.calories} kcal` },
    {
      key: 'score', title: '评分', width: 110, sortValue: (m) => m.score,
      render: (m) => <span className="stars">{'★'.repeat(m.score)}<i>{'★'.repeat(5 - m.score)}</i></span>,
    },
    { key: 'note', title: '备注', render: (m) => <span className="muted-xs">{m.note || '—'}</span> },
    { key: 'time', title: '记录时间', width: 140, sortValue: (m) => m.createdAt, render: (m) => <span className="muted-xs">{formatDateTime(m.createdAt)}</span> },
  ]

  return (
    <>
      <PageHead
        title="用餐记录"
        description="跟踪用户每日药膳摄入情况与满意度反馈"
        actions={<Button icon={<Icon.Download size={16} />} onClick={exportCsv}>导出</Button>}
      />

      <div className="mini-stats">
        <div><span>当前页用餐条数</span><b>{rows.length}</b></div>
        <div><span>平均满意度</span><b>{avgScore} / 5</b></div>
        <div><span>平均摄入热量</span><b>{avgCal} kcal</b></div>
      </div>

      <Card padded={false}>
        <Toolbar right={<Button variant="ghost" icon={<Icon.Refresh size={16} />} onClick={() => fetch()} loading={loading}>刷新</Button>}>
          <SearchBox value={keyword} onChange={setKeyword} placeholder="搜索用户 / 食谱 / 备注" />
          <FilterSelect value={mealType} onChange={setMealType} placeholder="全部餐次" options={MEAL_TYPES.map((t) => ({ value: t, label: t }))} />
        </Toolbar>
        <DataTable columns={columns} rows={rows} loading={loading} total={total} page={page} pageSize={pageSize} onPageChange={setPage} empty="暂无用餐记录" />
      </Card>
    </>
  )
}
