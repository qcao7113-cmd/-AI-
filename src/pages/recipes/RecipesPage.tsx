import { useCallback, useEffect, useState } from 'react'
import * as api from '@/lib/api'
import type { Recipe, RecipeCategory } from '@/types'
import { CHRONIC_KEYS, CONSTITUTIONS } from '@/lib/seed'
import { formatDate, formatNumber } from '@/utils/format'
import { useAuth, useToast } from '@/context/AppContext'
import { FilterSelect, SearchBox, Toolbar } from '@/components/ui/DataTable'
import { Badge, Button, Card, Pagination } from '@/components/ui/Primitives'
import { ConfirmDialog, Drawer, Field, Select, TextInput } from '@/components/ui/Feedback'
import { Icon } from '@/components/ui/Icon'
import { PageHead } from '@/components/layout/PageHead'

const CATEGORIES: RecipeCategory[] = ['汤羹', '粥品', '茶饮', '主食', '菜肴', '糕点']
const STATUS: Record<Recipe['status'], { label: string; tone: 'success' | 'muted' | 'danger' }> = {
  published: { label: '已发布', tone: 'success' },
  draft: { label: '草稿', tone: 'muted' },
  offline: { label: '已下架', tone: 'danger' },
}

type FormState = {
  name: string
  category: RecipeCategory
  effect: string
  calories: string
  cookTime: string
  suitedConstitution: string[]
  suitedChronic: string[]
  ingredientsRaw: string
  status: Recipe['status']
}

const EMPTY: FormState = {
  name: '', category: '汤羹', effect: '', calories: '200', cookTime: '30',
  suitedConstitution: [], suitedChronic: [], ingredientsRaw: '', status: 'published',
}

export default function RecipesPage() {
  const { can } = useAuth()
  const toast = useToast()
  const [rows, setRows] = useState<Recipe[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(9)
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const [detail, setDetail] = useState<Recipe | null>(null)
  const [drawer, setDrawer] = useState<{ mode: 'create' | 'edit'; row?: Recipe } | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState<Recipe | null>(null)

  const canManage = can('recipe:manage')

  const fetch = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    const res = await api.listRecipes({ page, pageSize, keyword, category, status })
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
  const openEdit = (r: Recipe) => {
    setForm({
      name: r.name,
      category: r.category,
      effect: r.effect,
      calories: String(r.calories),
      cookTime: String(r.cookTime),
      suitedConstitution: r.suitedConstitution,
      suitedChronic: r.suitedChronic,
      ingredientsRaw: r.ingredients.map((i) => `${i.name} ${i.amount}`).join('\n'),
      status: r.status,
    })
    setDrawer({ mode: 'edit', row: r })
  }

  const submit = async () => {
    if (!form.name.trim() || !form.effect.trim()) {
      toast.error('请填写食谱名称与功效')
      return
    }
    setSaving(true)
    try {
      const next: Recipe = {
        id: drawer?.row?.id ?? '',
        name: form.name.trim(),
        category: form.category,
        effect: form.effect.trim(),
        calories: Number(form.calories) || 0,
        cookTime: Number(form.cookTime) || 0,
        suitedConstitution: form.suitedConstitution as Recipe['suitedConstitution'],
        suitedChronic: form.suitedChronic as Recipe['suitedChronic'],
        ingredients: form.ingredientsRaw
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => {
            const [n, ...rest] = line.split(/\s+/)
            return { name: n, amount: rest.join(' ') || '适量' }
          }),
        status: form.status,
        cover: drawer?.row?.cover ?? `linear-gradient(135deg, hsl(${Math.floor(Math.random() * 360)} 38% 62%), hsl(${Math.floor(Math.random() * 360)} 42% 48%))`,
        views: drawer?.row?.views ?? 0,
        favorites: drawer?.row?.favorites ?? 0,
        updatedAt: new Date().toISOString(),
      }
      await api.saveRecipe(next)
      toast.success(drawer?.mode === 'edit' ? '食谱已更新' : '食谱已新增')
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
      await api.deleteRecipe(confirm.id)
      toast.success('食谱已删除')
      setConfirm(null)
      setDetail(null)
      await fetch(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  return (
    <>
      <PageHead
        title="药膳食谱"
        description="按中医辨证施膳原则维护食疗食谱库"
        actions={canManage && <Button variant="primary" icon={<Icon.Plus size={16} />} onClick={openCreate}>新增食谱</Button>}
      />

      <Card padded={false}>
        <Toolbar
          right={<Button variant="ghost" icon={<Icon.Refresh size={16} />} onClick={() => fetch()} loading={loading}>刷新</Button>}
        >
          <SearchBox value={keyword} onChange={setKeyword} placeholder="搜索食谱 / 功效 / 适用慢病" />
          <FilterSelect value={category} onChange={setCategory} placeholder="全部类型" options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
          <FilterSelect value={status} onChange={setStatus} placeholder="全部状态" options={Object.entries(STATUS).map(([v, s]) => ({ value: v, label: s.label }))} />
        </Toolbar>

        {loading ? (
          <div className="recipe-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="recipe-card skeleton-card" key={i} />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="table-empty">没有符合条件的食谱</div>
        ) : (
          <div className="recipe-grid">
            {rows.map((r) => (
              <article className="recipe-card" key={r.id} onClick={() => setDetail(r)}>
                <div className="recipe-cover" style={{ background: r.cover }}>
                  <span className="recipe-cat">{r.category}</span>
                  <div className="recipe-cover-mark">膳</div>
                </div>
                <div className="recipe-body">
                  <div className="recipe-title-row">
                    <h4>{r.name}</h4>
                    <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>
                  </div>
                  <p className="recipe-effect">{r.effect}</p>
                  <div className="stack-tags">
                    {r.suitedChronic.map((c) => <Badge key={c} tone="warning">{c}</Badge>)}
                    {r.suitedConstitution.slice(0, 2).map((c) => <Badge key={c} tone="brand">{c}</Badge>)}
                  </div>
                  <div className="recipe-meta">
                    <span><Icon.Clock size={13} /> {r.cookTime} 分钟</span>
                    <span><Icon.Flask size={13} /> {r.calories} kcal</span>
                    <span><Icon.Eye size={13} /> {formatNumber(r.views)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {total > 0 && <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />}
      </Card>

      {/* 详情 */}
      <Drawer
        open={!!detail}
        onClose={() => setDetail(null)}
        width={620}
        title={detail?.name ?? ''}
        subtitle={detail ? `${detail.category} · 更新于 ${formatDate(detail.updatedAt)}` : ''}
        footer={
          canManage && detail ? (
            <>
              <Button variant="danger" icon={<Icon.Trash size={16} />} onClick={() => setConfirm(detail)}>删除</Button>
              <Button variant="primary" icon={<Icon.Edit size={16} />} onClick={() => { const d = detail; setDetail(null); openEdit(d) }}>编辑</Button>
            </>
          ) : undefined
        }
      >
        {detail && (
          <>
            <div className="detail-cover" style={{ background: detail.cover }}>
              <span>{detail.effect}</span>
            </div>
            <div className="detail-stats">
              <div><b>{detail.cookTime}</b><span>烹饪分钟</span></div>
              <div><b>{detail.calories}</b><span>千卡/份</span></div>
              <div><b>{formatNumber(detail.views)}</b><span>浏览量</span></div>
              <div><b>{formatNumber(detail.favorites)}</b><span>收藏</span></div>
            </div>
            <h4 className="block-title">适用人群</h4>
            <div className="stack-tags" style={{ marginBottom: 16 }}>
              {detail.suitedChronic.map((c) => <Badge key={c} tone="warning">慢病：{c}</Badge>)}
              {detail.suitedConstitution.map((c) => <Badge key={c} tone="brand">体质：{c}</Badge>)}
            </div>
            <h4 className="block-title">食材配比</h4>
            <ul className="ing-list">
              {detail.ingredients.map((i) => (
                <li key={i.name}>
                  <span>{i.name}</span>
                  <em>{i.amount}</em>
                </li>
              ))}
            </ul>
            <h4 className="block-title">功效说明</h4>
            <p className="detail-text">{detail.effect}。本食谱依据中医「药食同源」理论配伍，建议在健康管理师指导下按体质与病程调整用量。</p>
          </>
        )}
      </Drawer>

      {/* 编辑 */}
      <Drawer
        open={!!drawer}
        onClose={() => setDrawer(null)}
        width={620}
        title={drawer?.mode === 'edit' ? '编辑食谱' : '新增食谱'}
        footer={
          <>
            <Button onClick={() => setDrawer(null)}>取消</Button>
            <Button variant="primary" loading={saving} onClick={submit}>保存</Button>
          </>
        }
      >
        <div className="form-grid">
          <Field label="食谱名称" required>
            <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如：山药薏米芡实粥" />
          </Field>
          <Field label="类型">
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as RecipeCategory })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="功效" required span={2}>
            <TextInput value={form.effect} onChange={(e) => setForm({ ...form, effect: e.target.value })} placeholder="如：健脾祛湿、益气固精" />
          </Field>
          <Field label="烹饪时长（分钟）">
            <TextInput type="number" value={form.cookTime} onChange={(e) => setForm({ ...form, cookTime: e.target.value })} />
          </Field>
          <Field label="每份热量（kcal）">
            <TextInput type="number" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} />
          </Field>
          <Field label="适用体质" span={2}>
            <div className="chips">
              {CONSTITUTIONS.map((c) => {
                const active = form.suitedConstitution.includes(c)
                return (
                  <button type="button" key={c} className={`chip ${active ? 'active' : ''}`}
                    onClick={() => setForm({ ...form, suitedConstitution: active ? form.suitedConstitution.filter((x) => x !== c) : [...form.suitedConstitution, c] })}>
                    {c}
                  </button>
                )
              })}
            </div>
          </Field>
          <Field label="适用慢病" span={2}>
            <div className="chips">
              {CHRONIC_KEYS.map((c) => {
                const active = form.suitedChronic.includes(c)
                return (
                  <button type="button" key={c} className={`chip ${active ? 'active' : ''}`}
                    onClick={() => setForm({ ...form, suitedChronic: active ? form.suitedChronic.filter((x) => x !== c) : [...form.suitedChronic, c] })}>
                    {c}
                  </button>
                )
              })}
            </div>
          </Field>
          <Field label="食材配比" span={2} hint="每行一项，格式：食材名 用量">
            <textarea
              className="input textarea"
              rows={5}
              value={form.ingredientsRaw}
              onChange={(e) => setForm({ ...form, ingredientsRaw: e.target.value })}
              placeholder={'山药 50g\n薏米 30g\n芡实 20g'}
            />
          </Field>
          <Field label="状态" span={2}>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Recipe['status'] })}>
              {(Object.keys(STATUS) as Recipe['status'][]).map((k) => <option key={k} value={k}>{STATUS[k].label}</option>)}
            </Select>
          </Field>
        </div>
      </Drawer>

      <ConfirmDialog
        open={!!confirm}
        danger
        title="删除食谱"
        message={<>确定删除食谱「<b>{confirm?.name}</b>」吗？</>}
        confirmText="删除"
        onCancel={() => setConfirm(null)}
        onConfirm={remove}
      />
    </>
  )
}
