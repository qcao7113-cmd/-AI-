import { useCallback, useEffect, useMemo, useState } from 'react'
import * as api from '@/lib/api'
import type { Ingredient } from '@/types'
import { formatDate, toCsv, downloadFile } from '@/utils/format'
import { useAuth, useToast } from '@/context/AppContext'
import { DataTable, FilterSelect, SearchBox, Toolbar, type Column } from '@/components/ui/DataTable'
import { Badge, Button, Card } from '@/components/ui/Primitives'
import { ConfirmDialog, Drawer, Field, Select, TextInput } from '@/components/ui/Feedback'
import { Icon } from '@/components/ui/Icon'
import { PageHead } from '@/components/layout/PageHead'

const CATEGORIES: Ingredient['category'][] = ['谷物', '豆类', '蔬菜', '菌藻', '水果', '肉类', '水产', '药食同源']
const NATURES: Ingredient['nature'][] = ['寒', '凉', '平', '温', '热']
const NATURE_TONE: Record<Ingredient['nature'], string> = { 寒: 'nature-cold', 凉: 'nature-cool', 平: 'nature-neutral', 温: 'nature-warm', 热: 'nature-hot' }
const STATUS: Record<Ingredient['status'], { label: string; tone: 'success' | 'warning' | 'danger' }> = {
  available: { label: '充足', tone: 'success' },
  low: { label: '预警', tone: 'warning' },
  off: { label: '缺货', tone: 'danger' },
}

type FormState = {
  name: string
  category: Ingredient['category']
  nature: Ingredient['nature']
  flavor: string
  meridian: string
  efficacy: string
  calorie: string
  unit: string
  stock: string
}

const EMPTY: FormState = {
  name: '', category: '蔬菜', nature: '平', flavor: '甘', meridian: '脾、胃', efficacy: '', calorie: '50', unit: '克', stock: '100',
}

export default function IngredientsPage() {
  const { can } = useAuth()
  const toast = useToast()
  const [rows, setRows] = useState<Ingredient[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const [drawer, setDrawer] = useState<{ mode: 'create' | 'edit'; row?: Ingredient } | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState<Ingredient | null>(null)

  const canManage = can('ingredient:manage')

  const fetch = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    const res = await api.listIngredients({ page, pageSize, keyword, category, status })
    setRows(res.items)
    setTotal(res.total)
    setLoading(false)
  }, [page, pageSize, keyword, category, status])

  useEffect(() => {
    const t = setTimeout(() => void fetch(), 200)
    return () => clearTimeout(t)
  }, [fetch])
  useEffect(() => setPage(1), [keyword, category, status])

  const openCreate = () => {
    setForm(EMPTY)
    setDrawer({ mode: 'create' })
  }
  const openEdit = (row: Ingredient) => {
    setForm({
      name: row.name,
      category: row.category,
      nature: row.nature,
      flavor: row.flavor.join('、'),
      meridian: row.meridian,
      efficacy: row.efficacy,
      calorie: String(row.calorie),
      unit: row.unit,
      stock: String(row.stock),
    })
    setDrawer({ mode: 'edit', row })
  }

  const submit = async () => {
    if (!form.name.trim() || !form.efficacy.trim()) {
      toast.error('请填写食材名称与功效')
      return
    }
    setSaving(true)
    try {
      const stock = Number(form.stock) || 0
      const next: Ingredient = {
        id: drawer?.row?.id ?? '',
        name: form.name.trim(),
        category: form.category,
        nature: form.nature,
        flavor: form.flavor.split(/[、,，\s]+/).filter(Boolean),
        meridian: form.meridian.trim() || '—',
        efficacy: form.efficacy.trim(),
        calorie: Number(form.calorie) || 0,
        unit: form.unit,
        stock,
        status: stock === 0 ? 'off' : stock < 10 ? 'low' : 'available',
        updatedAt: new Date().toISOString(),
      }
      await api.saveIngredient(next)
      toast.success(drawer?.mode === 'edit' ? '食材已更新' : '食材已新增')
      setDrawer(null)
      await fetch(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!confirm) return
    try {
      await api.deleteIngredient(confirm.id)
      toast.success('食材已删除')
      setConfirm(null)
      await fetch(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  const exportCsv = async () => {
    const all = await api.listIngredients({ page: 1, pageSize: 1000, keyword, category, status })
    const csv = toCsv(
      ['名称', '分类', '四气', '五味', '归经', '功效', '热量(kcal/100g)', '单位', '库存', '状态'],
      all.items.map((i) => [i.name, i.category, i.nature, i.flavor.join('/'), i.meridian, i.efficacy, i.calorie, i.unit, i.stock, STATUS[i.status].label]),
    )
    downloadFile(`食材库_${formatDate(new Date().toISOString())}.csv`, csv)
    await api.recordExport('食材库', all.items.length)
    toast.success(`已导出 ${all.items.length} 条食材`)
  }

  const columns: Column<Ingredient>[] = useMemo(
    () => [
      {
        key: 'name', title: '食材', sortValue: (r) => r.name,
        render: (r) => (
          <div>
            <div className="cell-primary">{r.name}</div>
            <div className="cell-sub">{r.category}</div>
          </div>
        ),
      },
      {
        key: 'nature', title: '性味', width: 150,
        sortValue: (r) => NATURES.indexOf(r.nature),
        render: (r) => (
          <div className="stack-tags">
            <span className={`nature-badge ${NATURE_TONE[r.nature]}`}>{r.nature}性</span>
            <span className="muted-xs">{r.flavor.join('、')}</span>
          </div>
        ),
      },
      { key: 'meridian', title: '归经', width: 130, render: (r) => <span className="muted-xs">{r.meridian}</span> },
      { key: 'efficacy', title: '功效', render: (r) => <span className="cell-wrap">{r.efficacy}</span> },
      { key: 'calorie', title: '热量', width: 90, align: 'right', sortValue: (r) => r.calorie, render: (r) => `${r.calorie}` },
      {
        key: 'stock', title: '库存', width: 110, sortValue: (r) => r.stock,
        render: (r) => (
          <span>
            {r.stock} <span className="muted-xs">{r.unit}</span>
          </span>
        ),
      },
      { key: 'status', title: '状态', width: 86, render: (r) => <Badge tone={STATUS[r.status].tone} dot>{STATUS[r.status].label}</Badge> },
      {
        key: 'actions', title: '操作', width: 100, align: 'right',
        render: (r) => (
          <div className="cell-actions">
            {canManage ? (
              <>
                <button className="icon-btn" onClick={() => openEdit(r)} title="编辑"><Icon.Edit size={16} /></button>
                <button className="icon-btn danger" onClick={() => setConfirm(r)} title="删除"><Icon.Trash size={16} /></button>
              </>
            ) : (
              <span className="muted-xs">只读</span>
            )}
          </div>
        ),
      },
    ],
    [canManage],
  )

  return (
    <>
      <PageHead
        title="食材库"
        description="维护药食同源食材的四气五味、归经、功效与库存"
        actions={
          <>
            <Button icon={<Icon.Download size={16} />} onClick={exportCsv}>导出</Button>
            {canManage && <Button variant="primary" icon={<Icon.Plus size={16} />} onClick={openCreate}>新增食材</Button>}
          </>
        }
      />

      <div className="nature-legend">
        {NATURES.map((n) => (
          <span key={n} className={`nature-badge ${NATURE_TONE[n]}`}>{n}性</span>
        ))}
        <span className="muted-xs">四气：寒·凉·平·温·热</span>
      </div>

      <Card padded={false}>
        <Toolbar
          right={
            <Button variant="ghost" icon={<Icon.Refresh size={16} />} onClick={() => fetch()} loading={loading}>刷新</Button>
          }
        >
          <SearchBox value={keyword} onChange={setKeyword} placeholder="搜索食材名称 / 功效 / 归经" />
          <FilterSelect value={category} onChange={setCategory} placeholder="全部分类" options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
          <FilterSelect
            value={status}
            onChange={setStatus}
            placeholder="全部状态"
            options={Object.entries(STATUS).map(([v, s]) => ({ value: v, label: s.label }))}
          />
        </Toolbar>
        <DataTable columns={columns} rows={rows} loading={loading} total={total} page={page} pageSize={pageSize} onPageChange={setPage} empty="没有符合条件的食材" />
      </Card>

      <Drawer
        open={!!drawer}
        onClose={() => setDrawer(null)}
        title={drawer?.mode === 'edit' ? '编辑食材' : '新增食材'}
        footer={
          <>
            <Button onClick={() => setDrawer(null)}>取消</Button>
            <Button variant="primary" loading={saving} onClick={submit}>保存</Button>
          </>
        }
      >
        <div className="form-grid">
          <Field label="食材名称" required>
            <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如：山药" />
          </Field>
          <Field label="分类">
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Ingredient['category'] })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="四气">
            <Select value={form.nature} onChange={(e) => setForm({ ...form, nature: e.target.value as Ingredient['nature'] })}>
              {NATURES.map((n) => <option key={n}>{n}</option>)}
            </Select>
          </Field>
          <Field label="五味" hint="用顿号分隔，如：甘、微苦">
            <TextInput value={form.flavor} onChange={(e) => setForm({ ...form, flavor: e.target.value })} />
          </Field>
          <Field label="归经" span={2}>
            <TextInput value={form.meridian} onChange={(e) => setForm({ ...form, meridian: e.target.value })} placeholder="如：脾、肺、肾" />
          </Field>
          <Field label="功效" required span={2}>
            <TextInput value={form.efficacy} onChange={(e) => setForm({ ...form, efficacy: e.target.value })} placeholder="如：补脾养胃、生津益肺" />
          </Field>
          <Field label="热量 kcal/100g">
            <TextInput type="number" value={form.calorie} onChange={(e) => setForm({ ...form, calorie: e.target.value })} />
          </Field>
          <Field label="计量单位">
            <Select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
              <option>克</option><option>千克</option><option>份</option>
            </Select>
          </Field>
          <Field label="库存数量" span={2}>
            <TextInput type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          </Field>
        </div>
      </Drawer>

      <ConfirmDialog
        open={!!confirm}
        danger
        title="删除食材"
        message={<>确定删除食材「<b>{confirm?.name}</b>」吗？</>}
        confirmText="删除"
        onCancel={() => setConfirm(null)}
        onConfirm={remove}
      />
    </>
  )
}
