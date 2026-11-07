import { useCallback, useEffect, useState } from 'react'
import * as api from '@/lib/api'
import type { HealthRow } from '@/lib/api'
import { formatDate } from '@/utils/format'
import { useAuth, useToast } from '@/context/AppContext'
import { DataTable, SearchBox, Toolbar, type Column } from '@/components/ui/DataTable'
import { Badge, Button, Card, Progress } from '@/components/ui/Primitives'
import { Drawer, Field, TextInput } from '@/components/ui/Feedback'
import { Icon } from '@/components/ui/Icon'
import { PageHead } from '@/components/layout/PageHead'

type Row = HealthRow & { id: string }

function bmiTone(bmi: number): { label: string; tone: 'success' | 'warning' | 'danger' } {
  if (bmi < 18.5) return { label: '偏瘦', tone: 'warning' }
  if (bmi < 24) return { label: '正常', tone: 'success' }
  if (bmi < 28) return { label: '超重', tone: 'warning' }
  return { label: '肥胖', tone: 'danger' }
}

export default function HealthPage() {
  const { can } = useAuth()
  const toast = useToast()
  const [rows, setRows] = useState<Row[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Row | null>(null)
  const [form, setForm] = useState({ height: '', weight: '', bloodSugar: '', uricAcid: '', systolic: '', diastolic: '' })
  const [saving, setSaving] = useState(false)

  const canManage = can('health:manage')

  const fetch = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    const res = await api.listProfiles({ page, pageSize, keyword })
    setRows(res.items.map((r) => ({ ...r, id: r.userId })))
    setTotal(res.total)
    setLoading(false)
  }, [page, pageSize, keyword])

  useEffect(() => {
    const t = setTimeout(() => void fetch(), 200)
    return () => clearTimeout(t)
  }, [fetch])
  useEffect(() => setPage(1), [keyword])

  const openEdit = (r: Row) => {
    setEditing(r)
    setForm({
      height: String(r.height),
      weight: String(r.weight),
      bloodSugar: String(r.bloodSugar),
      uricAcid: String(r.uricAcid),
      systolic: String(r.systolic),
      diastolic: String(r.diastolic),
    })
  }

  const submit = async () => {
    if (!editing) return
    setSaving(true)
    try {
      await api.updateProfile(editing.userId, {
        height: Number(form.height),
        weight: Number(form.weight),
        bloodSugar: Number(form.bloodSugar),
        uricAcid: Number(form.uricAcid),
        systolic: Number(form.systolic),
        diastolic: Number(form.diastolic),
      })
      toast.success('健康档案已更新')
      setEditing(null)
      await fetch(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '更新失败')
    } finally {
      setSaving(false)
    }
  }

  const abnormal = rows.filter((r) => r.flag === '需关注').length

  const columns: Column<Row>[] = [
    { key: 'customer', title: '用户', sortValue: (r) => r.customer, render: (r) => <span className="cell-primary">{r.customer}</span> },
    {
      key: 'bmi', title: 'BMI', width: 130, sortValue: (r) => r.bmi,
      render: (r) => {
        const t = bmiTone(r.bmi)
        const pct = Math.min(100, (r.bmi / 35) * 100)
        return (
          <div className="bmi-cell">
            <span>{r.bmi} <Badge tone={t.tone}>{t.label}</Badge></span>
            <Progress value={pct} tone={t.tone} />
          </div>
        )
      },
    },
    {
      key: 'bp', title: '血压', width: 120, sortValue: (r) => r.systolic,
      render: (r) => <span className={r.systolic >= 140 || r.diastolic >= 90 ? 'text-danger' : ''}>{r.systolic}/{r.diastolic} mmHg</span>,
    },
    {
      key: 'sugar', title: '血糖', width: 110, sortValue: (r) => r.bloodSugar,
      render: (r) => <span className={r.bloodSugar > 7 ? 'text-danger' : ''}>{r.bloodSugar} mmol/L</span>,
    },
    {
      key: 'uric', title: '尿酸', width: 110, sortValue: (r) => r.uricAcid,
      render: (r) => <span className={r.uricAcid > 420 ? 'text-danger' : ''}>{r.uricAcid} μmol/L</span>,
    },
    { key: 'flag', title: '评估', width: 96, render: (r) => <Badge tone={r.flag === '正常' ? 'success' : 'warning'} dot>{r.flag}</Badge> },
    { key: 'updated', title: '更新时间', width: 116, sortValue: (r) => r.updatedAt, render: (r) => <span className="muted-xs">{formatDate(r.updatedAt)}</span> },
    {
      key: 'actions', title: '操作', width: 80, align: 'right',
      render: (r) =>
        canManage ? (
          <div className="cell-actions">
            <button className="icon-btn" onClick={() => openEdit(r)} title="录入体检数据"><Icon.Edit size={16} /></button>
          </div>
        ) : (
          <span className="muted-xs">只读</span>
        ),
    },
  ]

  return (
    <>
      <PageHead title="健康档案" description="记录用户体检指标，自动评估 BMI 与异常风险" />

      <div className="mini-stats">
        <div><span>当前页档案</span><b>{rows.length}</b></div>
        <div><span>需关注人数</span><b className={abnormal ? 'text-danger' : ''}>{abnormal}</b></div>
        <div><span>异常判定标准</span><b className="muted-xs" style={{ fontSize: 13 }}>血糖 &gt; 7 / 收缩压 ≥ 140 / 尿酸 &gt; 420</b></div>
      </div>

      <Card padded={false}>
        <Toolbar right={<Button variant="ghost" icon={<Icon.Refresh size={16} />} onClick={() => fetch()} loading={loading}>刷新</Button>}>
          <SearchBox value={keyword} onChange={setKeyword} placeholder="搜索用户姓名" />
        </Toolbar>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          rowKey={(r) => r.userId}
          empty="暂无健康档案"
        />
      </Card>

      <Drawer
        open={!!editing}
        onClose={() => setEditing(null)}
        title={`录入体检数据 · ${editing?.customer ?? ''}`}
        footer={
          <>
            <Button onClick={() => setEditing(null)}>取消</Button>
            <Button variant="primary" loading={saving} onClick={submit}>保存</Button>
          </>
        }
      >
        <div className="form-grid">
          <Field label="身高 (cm)"><TextInput type="number" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} /></Field>
          <Field label="体重 (kg)"><TextInput type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} /></Field>
          <Field label="空腹血糖 (mmol/L)"><TextInput type="number" step="0.1" value={form.bloodSugar} onChange={(e) => setForm({ ...form, bloodSugar: e.target.value })} /></Field>
          <Field label="尿酸 (μmol/L)"><TextInput type="number" value={form.uricAcid} onChange={(e) => setForm({ ...form, uricAcid: e.target.value })} /></Field>
          <Field label="收缩压 (mmHg)"><TextInput type="number" value={form.systolic} onChange={(e) => setForm({ ...form, systolic: e.target.value })} /></Field>
          <Field label="舒张压 (mmHg)"><TextInput type="number" value={form.diastolic} onChange={(e) => setForm({ ...form, diastolic: e.target.value })} /></Field>
        </div>
      </Drawer>
    </>
  )
}
