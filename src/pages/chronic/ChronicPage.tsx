import { useEffect, useState } from 'react'
import * as api from '@/lib/api'
import type { ChronicPlan } from '@/types'
import { formatDate, formatNumber } from '@/utils/format'
import { useAuth, useToast } from '@/context/AppContext'
import { Badge, Button, Card, Progress, Skeleton } from '@/components/ui/Primitives'
import { Drawer, Field, TextInput } from '@/components/ui/Feedback'
import { Icon } from '@/components/ui/Icon'
import { PageHead } from '@/components/layout/PageHead'

export default function ChronicPage() {
  const { can } = useAuth()
  const toast = useToast()
  const [plans, setPlans] = useState<ChronicPlan[] | null>(null)
  const [editing, setEditing] = useState<ChronicPlan | null>(null)
  const [form, setForm] = useState({ summary: '', principles: '', recommended: '', avoid: '' })
  const [saving, setSaving] = useState(false)
  const canManage = can('plan:manage')

  useEffect(() => {
    api.listPlans().then(setPlans)
  }, [])

  const openEdit = (p: ChronicPlan) => {
    setEditing(p)
    setForm({
      summary: p.summary,
      principles: p.principles.join('\n'),
      recommended: p.recommended.join('、'),
      avoid: p.avoid.join('、'),
    })
  }

  const submit = async () => {
    if (!editing) return
    setSaving(true)
    try {
      const next: ChronicPlan = {
        ...editing,
        summary: form.summary.trim(),
        principles: form.principles.split('\n').map((s) => s.trim()).filter(Boolean),
        recommended: form.recommended.split(/[、,，\s]+/).filter(Boolean),
        avoid: form.avoid.split(/[、,，\s]+/).filter(Boolean),
      }
      const saved = await api.savePlan(next)
      setPlans((list) => list?.map((p) => (p.key === saved.key ? saved : p)) ?? null)
      toast.success(`「${saved.name}」已更新`)
      setEditing(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const maxUsers = plans ? Math.max(...plans.map((p) => p.users)) : 1

  return (
    <>
      <PageHead title="慢病食疗方案" description="针对每类慢性病制定食疗原则、推荐与禁忌食材" />

      {!plans ? (
        <div className="plan-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><Skeleton h={220} /></Card>
          ))}
        </div>
      ) : (
        <div className="plan-grid">
          {plans.map((p) => (
            <Card key={p.key} className="plan-card">
              <div className="plan-head" style={{ borderColor: p.color }}>
                <span className="plan-icon" style={{ background: `${p.color}1f`, color: p.color }}>{p.icon}</span>
                <div>
                  <h3>{p.name}</h3>
                  <span className="muted-xs">更新于 {formatDate(p.updatedAt)}</span>
                </div>
                {canManage && (
                  <button className="icon-btn" style={{ marginLeft: 'auto' }} onClick={() => openEdit(p)} title="编辑方案">
                    <Icon.Edit size={16} />
                  </button>
                )}
              </div>
              <p className="plan-summary">{p.summary}</p>

              <div className="plan-users">
                <span className="muted-xs">在管人群</span>
                <b>{formatNumber(p.users)}</b> 人
                <Progress value={(p.users / maxUsers) * 100} tone="brand" />
              </div>

              <h5 className="block-title sm">食疗原则</h5>
              <ul className="dot-list">
                {p.principles.map((x) => <li key={x}>{x}</li>)}
              </ul>

              <h5 className="block-title sm">推荐食材</h5>
              <div className="stack-tags">
                {p.recommended.map((x) => <Badge key={x} tone="success">{x}</Badge>)}
              </div>

              <h5 className="block-title sm">忌口提示</h5>
              <div className="stack-tags">
                {p.avoid.map((x) => <Badge key={x} tone="danger">{x}</Badge>)}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Drawer
        open={!!editing}
        onClose={() => setEditing(null)}
        title={`编辑方案 · ${editing?.name ?? ''}`}
        footer={
          <>
            <Button onClick={() => setEditing(null)}>取消</Button>
            <Button variant="primary" loading={saving} onClick={submit}>保存</Button>
          </>
        }
      >
        <Field label="方案概述">
          <TextInput value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
        </Field>
        <Field label="食疗原则" hint="每行一条">
          <textarea className="input textarea" rows={5} value={form.principles} onChange={(e) => setForm({ ...form, principles: e.target.value })} />
        </Field>
        <Field label="推荐食材" hint="用顿号分隔，如：芹菜、木耳、海带">
          <TextInput value={form.recommended} onChange={(e) => setForm({ ...form, recommended: e.target.value })} />
        </Field>
        <Field label="忌口提示" hint="用顿号分隔">
          <TextInput value={form.avoid} onChange={(e) => setForm({ ...form, avoid: e.target.value })} />
        </Field>
      </Drawer>
    </>
  )
}
