import { useCallback, useEffect, useMemo, useState } from 'react'
import * as api from '@/lib/data'
import type { User, RoleKey, Constitution, ChronicKey } from '@/types'
import { CHRONIC_KEYS, CONSTITUTIONS } from '@/lib/seed'
import { formatDate, toCsv, downloadFile } from '@/utils/format'
import { ROLE_LABEL } from '@/utils/permissions'
import { useAuth, useToast } from '@/context/AppContext'
import { DataTable, FilterSelect, SearchBox, Toolbar, type Column } from '@/components/ui/DataTable'
import { Badge, Button, Card } from '@/components/ui/Primitives'
import { ConfirmDialog, Drawer, Field, Select, TextInput } from '@/components/ui/Feedback'
import { Icon } from '@/components/ui/Icon'
import { PageHead } from '@/components/layout/PageHead'

const STATUS_META: Record<User['status'], { label: string; tone: 'success' | 'warning' | 'danger' }> = {
  active: { label: '正常', tone: 'success' },
  pending: { label: '待激活', tone: 'warning' },
  disabled: { label: '已停用', tone: 'danger' },
}

type FormState = {
  name: string
  username: string
  email: string
  phone: string
  gender: '男' | '女'
  age: string
  constitution: Constitution
  chronicTags: ChronicKey[]
  roleKey: RoleKey
  status: User['status']
}

const EMPTY_FORM: FormState = {
  name: '',
  username: '',
  email: '',
  phone: '',
  gender: '男',
  age: '30',
  constitution: '平和质',
  chronicTags: [],
  roleKey: 'user',
  status: 'active',
}

export default function UsersPage() {
  const { can } = useAuth()
  const toast = useToast()
  const [rows, setRows] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [roleKey, setRoleKey] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const [drawer, setDrawer] = useState<{ mode: 'create' | 'edit'; user?: User } | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState<User | null>(null)

  const canManage = can('user:manage')

  const fetch = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    const res = await api.listUsers({ page, pageSize, keyword, roleKey, status })
    setRows(res.items)
    setTotal(res.total)
    setLoading(false)
  }, [page, pageSize, keyword, roleKey, status])

  useEffect(() => {
    const t = setTimeout(() => void fetch(), 200)
    return () => clearTimeout(t)
  }, [fetch])

  useEffect(() => setPage(1), [keyword, roleKey, status])

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setErrors({})
    setDrawer({ mode: 'create' })
  }

  const openEdit = (u: User) => {
    setForm({
      name: u.name,
      username: u.username,
      email: u.email,
      phone: u.phone,
      gender: u.gender,
      age: String(u.age),
      constitution: u.constitution,
      chronicTags: u.chronicTags,
      roleKey: u.roleKey,
      status: u.status,
    })
    setErrors({})
    setDrawer({ mode: 'edit', user: u })
  }

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {}
    if (!form.name.trim()) e.name = '请输入姓名'
    if (!/^[a-zA-Z][a-zA-Z0-9_]{2,19}$/.test(form.username)) e.username = '3-20 位字母开头的账号'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = '邮箱格式不正确'
    if (!/^1[3-9]\d{9}$/.test(form.phone)) e.phone = '手机号格式不正确'
    const age = Number(form.age)
    if (!Number.isFinite(age) || age < 1 || age > 120) e.age = '年龄需在 1-120 之间'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        gender: form.gender,
        age: Number(form.age),
        constitution: form.constitution,
        chronicTags: form.chronicTags,
        roleKey: form.roleKey,
        status: form.status,
      }
      if (drawer?.mode === 'edit' && drawer.user) {
        await api.updateUser(drawer.user.id, payload)
        toast.success('用户信息已更新')
      } else {
        await api.createUser(payload)
        toast.success('用户已创建')
      }
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
      await api.deleteUser(confirm.id)
      toast.success('用户已删除')
      setConfirm(null)
      await fetch(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  const exportCsv = async () => {
    const all = await api.listUsers({ page: 1, pageSize: 1000, keyword, roleKey, status })
    const csv = toCsv(
      ['姓名', '账号', '手机', '邮箱', '性别', '年龄', '体质', '慢病', '角色', '状态', '注册时间'],
      all.items.map((u) => [
        u.name, u.username, u.phone, u.email, u.gender, u.age, u.constitution,
        u.chronicTags.join('/'), ROLE_LABEL[u.roleKey], STATUS_META[u.status].label, formatDate(u.createdAt),
      ]),
    )
    downloadFile(`用户列表_${formatDate(new Date().toISOString())}.csv`, csv)
    await api.recordExport('用户列表', all.items.length)
    toast.success(`已导出 ${all.items.length} 条用户数据`)
  }

  const columns: Column<User>[] = useMemo(
    () => [
      {
        key: 'name',
        title: '用户',
        sortValue: (u) => u.name,
        render: (u) => (
          <div className="row-user">
            <span className="avatar" style={{ background: u.avatarColor }}>{u.name.slice(0, 1)}</span>
            <div>
              <div className="cell-primary">{u.name}</div>
              <div className="cell-sub">{u.username}</div>
            </div>
          </div>
        ),
      },
      { key: 'contact', title: '联系方式', render: (u) => (<div><div>{u.phone}</div><div className="cell-sub">{u.email}</div></div>) },
      {
        key: 'basic', title: '性别 / 年龄', width: 110,
        sortValue: (u) => u.age,
        render: (u) => <span>{u.gender} · {u.age} 岁</span>,
      },
      {
        key: 'constitution', title: '体质 / 慢病',
        render: (u) => (
          <div className="stack-tags">
            <Badge tone="brand">{u.constitution}</Badge>
            {u.chronicTags.map((t) => <Badge key={t} tone="warning">{t}</Badge>)}
          </div>
        ),
      },
      { key: 'role', title: '角色', render: (u) => ROLE_LABEL[u.roleKey] },
      {
        key: 'status', title: '状态', width: 96,
        render: (u) => <Badge tone={STATUS_META[u.status].tone} dot>{STATUS_META[u.status].label}</Badge>,
      },
      { key: 'created', title: '注册时间', width: 120, sortValue: (u) => u.createdAt, render: (u) => formatDate(u.createdAt) },
      {
        key: 'actions', title: '操作', width: 100, align: 'right',
        render: (u) => (
          <div className="cell-actions" onClick={(e) => e.stopPropagation()}>
            {canManage && (
              <>
                <button className="icon-btn" onClick={() => openEdit(u)} title="编辑"><Icon.Edit size={16} /></button>
                <button className="icon-btn danger" onClick={() => setConfirm(u)} title="删除"><Icon.Trash size={16} /></button>
              </>
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
        title="用户管理"
        description="管理平台注册用户资料、中医体质辨识与慢病标签"
        actions={
          <>
            <Button icon={<Icon.Download size={16} />} onClick={exportCsv}>导出</Button>
            {canManage && <Button variant="primary" icon={<Icon.Plus size={16} />} onClick={openCreate}>新增用户</Button>}
          </>
        }
      />

      <Card padded={false}>
        <Toolbar
          right={
            <Button variant="ghost" icon={<Icon.Refresh size={16} />} onClick={() => fetch()} loading={loading}>
              刷新
            </Button>
          }
        >
          <SearchBox value={keyword} onChange={setKeyword} placeholder="搜索姓名 / 账号 / 手机 / 邮箱" />
          <FilterSelect
            value={roleKey}
            onChange={setRoleKey}
            placeholder="全部角色"
            options={Object.entries(ROLE_LABEL).map(([v, l]) => ({ value: v, label: l }))}
          />
          <FilterSelect
            value={status}
            onChange={setStatus}
            placeholder="全部状态"
            options={Object.entries(STATUS_META).map(([v, m]) => ({ value: v, label: m.label }))}
          />
        </Toolbar>

        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          empty="没有符合条件的用户"
        />
      </Card>

      <Drawer
        open={!!drawer}
        onClose={() => setDrawer(null)}
        title={drawer?.mode === 'edit' ? '编辑用户' : '新增用户'}
        subtitle="完善用户基础信息与健康标签"
        footer={
          <>
            <Button onClick={() => setDrawer(null)}>取消</Button>
            <Button variant="primary" loading={saving} onClick={submit}>保存</Button>
          </>
        }
      >
        <div className="form-grid">
          <Field label="姓名" required error={errors.name}>
            <TextInput value={form.name} invalid={!!errors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="请输入真实姓名" />
          </Field>
          <Field label="登录账号" required error={errors.username}>
            <TextInput value={form.username} invalid={!!errors.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="如 zhangsan" />
          </Field>
          <Field label="手机号" required error={errors.phone}>
            <TextInput value={form.phone} invalid={!!errors.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="11 位手机号" />
          </Field>
          <Field label="邮箱" required error={errors.email}>
            <TextInput value={form.email} invalid={!!errors.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@example.com" />
          </Field>
          <Field label="性别">
            <Select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as '男' | '女' })}>
              <option value="男">男</option>
              <option value="女">女</option>
            </Select>
          </Field>
          <Field label="年龄" required error={errors.age}>
            <TextInput type="number" value={form.age} invalid={!!errors.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
          </Field>
          <Field label="中医体质">
            <Select value={form.constitution} onChange={(e) => setForm({ ...form, constitution: e.target.value as Constitution })}>
              {CONSTITUTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="系统角色">
            <Select value={form.roleKey} onChange={(e) => setForm({ ...form, roleKey: e.target.value as RoleKey })}>
              {Object.entries(ROLE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </Field>
          <Field label="慢病标签" span={2} hint="可多选，用于匹配食疗方案">
            <div className="chips">
              {CHRONIC_KEYS.map((t) => {
                const active = form.chronicTags.includes(t)
                return (
                  <button
                    type="button"
                    key={t}
                    className={`chip ${active ? 'active' : ''}`}
                    onClick={() =>
                      setForm({
                        ...form,
                        chronicTags: active ? form.chronicTags.filter((x) => x !== t) : [...form.chronicTags, t],
                      })
                    }
                  >
                    {active && <Icon.Check size={13} />}
                    {t}
                  </button>
                )
              })}
            </div>
          </Field>
          <Field label="账号状态">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as User['status'] })}>
              {(Object.keys(STATUS_META) as User['status'][]).map((k) => <option key={k} value={k}>{STATUS_META[k].label}</option>)}
            </Select>
          </Field>
        </div>
      </Drawer>

      <ConfirmDialog
        open={!!confirm}
        danger
        title="删除用户"
        message={<>确定要删除用户 <b>{confirm?.name}</b>（{confirm?.username}）吗？此操作不可撤销。</>}
        confirmText="删除"
        onCancel={() => setConfirm(null)}
        onConfirm={remove}
      />
    </>
  )
}
