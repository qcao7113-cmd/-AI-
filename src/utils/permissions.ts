import type { Permission, RoleKey } from '@/types'

/** 系统内全部可授予权限 */
export const PERMISSIONS: Permission[] = [
  { code: 'user:view', name: '查看用户', group: '平台用户' },
  { code: 'user:manage', name: '管理用户', group: '平台用户' },
  { code: 'ingredient:view', name: '查看食材', group: '食疗资源' },
  { code: 'ingredient:manage', name: '维护食材', group: '食疗资源' },
  { code: 'recipe:view', name: '查看食谱', group: '食疗资源' },
  { code: 'recipe:manage', name: '编辑食谱', group: '食疗资源' },
  { code: 'meal:view', name: '查看用餐记录', group: '健康管理' },
  { code: 'health:view', name: '查看健康档案', group: '健康管理' },
  { code: 'health:manage', name: '管理健康档案', group: '健康管理' },
  { code: 'plan:manage', name: '慢病管理方案', group: '健康管理' },
  { code: 'role:manage', name: '角色与设置', group: '系统' },
]

/** 内置角色的默认权限 */
export const ROLE_DEFAULTS: Record<RoleKey, { name: string; description: string; permissions: string[] }> = {
  admin: {
    name: '超级管理员',
    description: '拥有平台全部权限，负责用户、角色与系统配置',
    permissions: PERMISSIONS.map((p) => p.code),
  },
  doctor: {
    name: '健康管理师',
    description: '可查看用户健康档案、维护食疗方案与用餐记录',
    permissions: [
      'user:view',
      'ingredient:view',
      'ingredient:manage',
      'recipe:view',
      'recipe:manage',
      'meal:view',
      'health:view',
      'health:manage',
      'plan:manage',
    ],
  },
  user: {
    name: '普通用户',
    description: '仅可浏览食谱与自己的健康记录',
    permissions: ['recipe:view', 'meal:view', 'health:view'],
  },
}

export const ROLE_LABEL: Record<RoleKey, string> = {
  admin: '超级管理员',
  doctor: '健康管理师',
  user: '普通用户',
}

/** 演示账号（密码统一 123456） */
export const DEMO_ACCOUNTS = [
  { username: 'admin', password: '123456', role: '超级管理员', desc: '全部功能可用' },
  { username: 'doctor', password: '123456', role: '健康管理师', desc: '可维护食材/食谱、管理档案' },
  { username: 'user', password: '123456', role: '普通用户', desc: '仅可浏览，写操作被隐藏' },
]
