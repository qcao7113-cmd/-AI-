import { useEffect, useMemo, useState } from 'react'
import * as api from '@/lib/data'
import type { Role } from '@/types'
import { PERMISSIONS } from '@/utils/permissions'
import { useAuth, useToast } from '@/context/AppContext'
import { Badge, Button, Card, Skeleton } from '@/components/ui/Primitives'
import { Switch } from '@/components/ui/Feedback'
import { Icon } from '@/components/ui/Icon'
import { PageHead } from '@/components/layout/PageHead'

const GROUP_ORDER: string[] = ['平台用户', '食疗资源', '健康管理', '系统']

export default function RolesPage() {
  const { can, refreshPermissions, session } = useAuth()
  const toast = useToast()
  const [roles, setRoles] = useState<Role[] | null>(null)
  const [draft, setDraft] = useState<Record<string, string[]>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const isAdmin = can('role:manage')

  useEffect(() => {
    api.listRoles().then((list) => {
      setRoles(list)
      setDraft(Object.fromEntries(list.map((r) => [r.id, r.permissions])))
    })
  }, [])

  const grouped = useMemo(
    () =>
      GROUP_ORDER.map((g) => ({
        group: g,
        items: PERMISSIONS.filter((p) => p.group === g),
      })),
    [],
  )

  const toggle = (roleId: string, code: string) => {
    setDraft((d) => {
      const cur = d[roleId] ?? []
      return { ...d, [roleId]: cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code] }
    })
  }

  const save = async (role: Role) => {
    setSaving(role.id)
    try {
      const updated = await api.updateRolePermissions(role.id, draft[role.id] ?? [])
      setRoles((list) => list?.map((r) => (r.id === role.id ? updated : r)) ?? null)
      if (session?.user.roleKey === role.key) refreshPermissions()
      toast.success(`「${role.name}」权限已保存`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(null)
    }
  }

  return (
    <>
      <PageHead title="角色权限" description="为不同岗位配置功能权限，权限变更即时生效" />

      {!roles ? (
        <div className="role-grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><Skeleton h={260} radius={10} /></Card>
          ))}
        </div>
      ) : (
        <div className="role-grid">
          {roles.map((role) => {
            const perms = draft[role.id] ?? []
            const disabled = role.key === 'admin' || !isAdmin
            return (
              <Card
                key={role.id}
                title={
                  <span className="role-title">
                    {role.name}
                    {role.builtin && <Badge tone="muted">内置</Badge>}
                  </span>
                }
                subtitle={role.description}
              >
                <div className="perm-groups">
                  {grouped.map((g) => (
                    <div key={g.group} className="perm-group">
                      <div className="perm-group-label">{g.group}</div>
                      {g.items.map((p) => (
                        <label key={p.code} className="perm-row">
                          <span>
                            {p.name}
                            <em className="perm-code">{p.code}</em>
                          </span>
                          <Switch
                            checked={perms.includes(p.code)}
                            disabled={disabled}
                            label={p.name}
                            onChange={() => toggle(role.id, p.code)}
                          />
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="perm-foot">
                  <span className="muted-xs">已选 {perms.length} / {PERMISSIONS.length} 项权限</span>
                  {isAdmin && role.key !== 'admin' && (
                    <Button
                      size="sm"
                      variant="primary"
                      icon={<Icon.Check size={14} />}
                      loading={saving === role.id}
                      onClick={() => save(role)}
                    >
                      保存
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
