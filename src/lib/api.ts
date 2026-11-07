import type {
  AppSettings,
  ChronicKey,
  ChronicPlan,
  HealthProfile,
  Ingredient,
  MealRecord,
  Notification,
  Paginated,
  Recipe,
  Role,
  Session,
  User,
} from '@/types'
import {
  CHRONIC_KEYS,
  CONSTITUTIONS,
  DEFAULT_SETTINGS,
  buildTrend,
  seedChronicPlans,
  seedIngredients,
  seedMeals,
  seedProfiles,
  seedRecipes,
  seedRoles,
  seedUsers,
} from './seed'
import { DEMO_ACCOUNTS, ROLE_DEFAULTS } from '@/utils/permissions'
import { uid } from '@/utils/format'

/* ==================================================================== */
/*  模拟后端：async + 延迟 + 统一分页协议                                 */
/*  接入真实接口时，把函数体替换成 fetch 即可，调用方无需改动              */
/*  数据持久化在 localStorage，刷新页面不丢失                             */
/* ==================================================================== */

const KEY = 'shiliao:db:v1'
const SESSION_KEY = 'shiliao:session:v1'
const SETTINGS_KEY = 'shiliao:settings'

interface AuditEntry {
  id: string
  operator: string
  action: 'create' | 'update' | 'delete' | 'login' | 'export'
  target: string
  detail: string
  ip: string
  result: 'success' | 'fail'
  createdAt: string
}
export type { AuditEntry as AuditLog }

export interface DB {
  users: User[]
  roles: Role[]
  ingredients: Ingredient[]
  recipes: Recipe[]
  meals: MealRecord[]
  profiles: HealthProfile[]
  plans: ChronicPlan[]
  notifications: Notification[]
  logs: AuditEntry[]
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/* --------------------------- 持久化与缓存 --------------------------- */
let cache: DB | null = null

function createDb(): DB {
  const users = seedUsers()
  const recipes = seedRecipes()
  return {
    users,
    roles: seedRoles(),
    ingredients: seedIngredients(),
    recipes,
    meals: seedMeals(users.filter((u) => u.roleKey === 'user'), recipes.filter((r) => r.status === 'published')),
    profiles: seedProfiles(users),
    plans: seedChronicPlans(),
    notifications: [
      { id: 'n1', title: '本周有 12 位用户需要随访', body: '糖尿病方案用户中，有 12 人已超过 7 天未记录用餐。', kind: 'warning', read: false, createdAt: new Date(Date.now() - 18 * 60000).toISOString() },
      { id: 'n2', title: '食材库存预警', body: '「芹菜」「苦瓜」库存不足 10 份，建议及时补充。', kind: 'warning', read: false, createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
      { id: 'n3', title: '食疗周报已生成', body: '上周用药膳用户数环比上升 12.4%，可在仪表盘中查看详情。', kind: 'info', read: false, createdAt: new Date(Date.now() - 9 * 3600000).toISOString() },
      { id: 'n4', title: '系统升级完成', body: 'v1.2.0 已发布：新增体质辨识与慢病方案匹配。', kind: 'success', read: true, createdAt: new Date(Date.now() - 40 * 3600000).toISOString() },
    ],
    logs: Array.from({ length: 56 }, (_, i) => {
      const tpl: Array<[AuditEntry['action'], string, string]> = [
        ['login', '认证中心', '账号密码登录成功'],
        ['update', '食谱「山药薏米芡实粥」', '更新适用体质：气虚质、痰湿质'],
        ['create', '食材「黄精」', '新增药食同源食材'],
        ['update', '用户 user118', '健康档案更新：血糖 6.8 mmol/L'],
        ['export', '用餐记录', '导出 96 条用餐记录为 CSV'],
        ['delete', '食谱「凉拌苦菊木耳」', '下架并删除草稿'],
        ['update', '慢病方案「高血压」', '调整推荐食材列表'],
      ]
      const [action, target, detail] = tpl[i % tpl.length]
      return {
        id: `log_${7000 + i}`,
        operator: ['林知远', '苏晓棠', '陈默', '王淑芬', '李志强'][i % 5],
        action,
        target,
        detail,
        ip: `10.${i % 255}.${(i * 7) % 255}.${(i * 13) % 254 + 1}`,
        result: i % 17 === 0 ? 'fail' : 'success',
        createdAt: new Date(Date.now() - (i * 5.3 + 1) * 3600_000).toISOString(),
      } as AuditEntry
    }),
  }
}

function load(): DB {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      cache = JSON.parse(raw) as DB
      return cache
    }
  } catch {
    /* 数据损坏时重建 */
  }
  cache = createDb()
  persist()
  return cache
}

function persist() {
  if (cache) localStorage.setItem(KEY, JSON.stringify(cache))
}

const delay = (ms = 240) => new Promise<void>((r) => setTimeout(r, ms))

function paginate<T>(all: T[], page: number, pageSize: number): Paginated<T> {
  const start = (page - 1) * pageSize
  return { items: all.slice(start, start + pageSize), total: all.length, page, pageSize }
}

function writeLog(action: AuditEntry['action'], target: string, detail: string, result: AuditEntry['result'] = 'success') {
  const db = load()
  db.logs.unshift({
    id: uid('log'),
    operator: getSession()?.user.name ?? '匿名用户',
    action,
    target,
    detail,
    ip: '127.0.0.1',
    result,
    createdAt: new Date().toISOString(),
  })
  db.logs = db.logs.slice(0, 300)
  persist()
}

/* ------------------------------- 认证 ------------------------------- */
export async function login(username: string, password: string): Promise<Session> {
  await delay(520)
  const db = load()
  if (!DEMO_ACCOUNTS.some((a) => a.username === username)) {
    throw new ApiError('账号不存在，请使用下方演示账号登录', 401)
  }
  if (password !== '123456') {
    writeLog('login', '认证中心', `账号 ${username} 密码错误`, 'fail')
    throw new ApiError('密码错误，演示密码为 123456', 401)
  }
  const user = db.users.find((u) => u.username === username)
  if (!user) throw new ApiError('账号不存在', 401)
  if (user.status === 'disabled') throw new ApiError('该账号已被停用，请联系管理员', 403)
  user.lastLoginAt = new Date().toISOString()
  user.status = 'active'
  writeLog('login', '认证中心', `账号 ${username} 登录成功`)
  const session: Session = {
    token: uid('tk'),
    user: { id: user.id, name: user.name, username: user.username, roleKey: user.roleKey, avatarColor: user.avatarColor },
    expiresAt: Date.now() + 8 * 3600_000,
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export async function logout(): Promise<void> {
  localStorage.removeItem(SESSION_KEY)
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as Session
    if (s.expiresAt < Date.now()) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return s
  } catch {
    return null
  }
}

/* ------------------------------- 用户 ------------------------------- */
export interface UserQuery {
  page: number
  pageSize: number
  keyword?: string
  roleKey?: string
  status?: string
}

export async function listUsers(q: UserQuery): Promise<Paginated<User>> {
  await delay()
  const rows = load()
    .users.filter((u) => (q.roleKey ? u.roleKey === q.roleKey : true))
    .filter((u) => (q.status ? u.status === q.status : true))
    .filter((u) => {
      const k = (q.keyword ?? '').trim().toLowerCase()
      if (!k) return true
      return [u.name, u.username, u.email, u.phone].some((v) => v.toLowerCase().includes(k))
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return paginate(rows, q.page, q.pageSize)
}

export async function createUser(input: Omit<User, 'id' | 'createdAt' | 'lastLoginAt' | 'avatarColor'>): Promise<User> {
  await delay()
  const db = load()
  if (db.users.some((u) => u.username === input.username)) throw new ApiError(`登录名「${input.username}」已被占用`)
  if (db.users.some((u) => u.email === input.email)) throw new ApiError(`邮箱「${input.email}」已被占用`)
  const colors = ['#2f8f5b', '#0ea5a4', '#c98a2b', '#b8553a', '#6f7f3a', '#4a7fb5']
  const user: User = {
    ...input,
    id: uid('u'),
    avatarColor: colors[db.users.length % colors.length],
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
  }
  db.users.unshift(user)
  writeLog('create', `用户 ${user.username}`, `新建用户「${user.name}」`)
  persist()
  return { ...user }
}

export async function updateUser(id: string, patch: Partial<User>): Promise<User> {
  await delay()
  const db = load()
  const idx = db.users.findIndex((u) => u.id === id)
  if (idx < 0) throw new ApiError('用户不存在', 404)
  if (patch.username && db.users.some((u) => u.id !== id && u.username === patch.username)) {
    throw new ApiError(`登录名「${patch.username}」已被占用`)
  }
  db.users[idx] = { ...db.users[idx], ...patch, id }
  writeLog('update', `用户 ${db.users[idx].username}`, `更新用户「${db.users[idx].name}」资料`)
  persist()
  return { ...db.users[idx] }
}

export async function deleteUser(id: string): Promise<void> {
  await delay()
  const db = load()
  const u = db.users.find((x) => x.id === id)
  if (!u) throw new ApiError('用户不存在', 404)
  if (u.username === 'admin') throw new ApiError('内置管理员账号不可删除', 403)
  db.users = db.users.filter((x) => x.id !== id)
  writeLog('delete', `用户 ${u.username}`, `删除用户「${u.name}」`)
  persist()
}

/* ------------------------------- 角色 ------------------------------- */
export async function listRoles(): Promise<Role[]> {
  await delay(140)
  return load().roles.map((r) => ({ ...r }))
}

/** 供 UI 首选判断权限（同步读取本地角色配置，避免闪烁） */
export function peekPermissions(roleKey: Role['key']): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const db = JSON.parse(raw) as DB
      const role = db.roles?.find((r) => r.key === roleKey)
      if (role) return role.permissions
    }
  } catch {
    /* ignore */
  }
  return ROLE_DEFAULTS[roleKey].permissions
}

export async function updateRolePermissions(id: string, permissions: string[]): Promise<Role> {
  await delay()
  const db = load()
  const role = db.roles.find((r) => r.id === id)
  if (!role) throw new ApiError('角色不存在', 404)
  if (role.key === 'admin') throw new ApiError('超级管理员权限不可修改', 403)
  role.permissions = permissions
  writeLog('update', `角色 ${role.name}`, `权限变更：${permissions.join(', ') || '无'}`)
  persist()
  return { ...role }
}

export async function currentPermissions(): Promise<string[]> {
  const s = getSession()
  if (!s) return []
  const db = load()
  const role = db.roles.find((r) => r.key === s.user.roleKey)
  return role ? role.permissions : ROLE_DEFAULTS[s.user.roleKey].permissions
}

export type { HealthProfile }

/* ------------------------------- 食材 ------------------------------- */
export interface IngredientQuery {
  page: number
  pageSize: number
  keyword?: string
  category?: string
  status?: string
}

export async function listIngredients(q: IngredientQuery): Promise<Paginated<Ingredient>> {
  await delay()
  const rows = load()
    .ingredients.filter((i) => (q.category ? i.category === q.category : true))
    .filter((i) => (q.status ? i.status === q.status : true))
    .filter((i) => {
      const k = (q.keyword ?? '').trim()
      if (!k) return true
      return [i.name, i.efficacy, i.meridian].some((v) => v.includes(k))
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
  return paginate(rows, q.page, q.pageSize)
}

export async function saveIngredient(input: Ingredient): Promise<Ingredient> {
  await delay()
  const db = load()
  const next: Ingredient = { ...input, updatedAt: new Date().toISOString() }
  const idx = db.ingredients.findIndex((i) => i.id === input.id)
  if (idx >= 0) {
    db.ingredients[idx] = next
    writeLog('update', `食材「${next.name}」`, `更新食材属性：${next.nature}性`)
  } else {
    next.id = uid('ing')
    db.ingredients.unshift(next)
    writeLog('create', `食材「${next.name}」`, `新增${next.category}食材`)
  }
  persist()
  return { ...next }
}

export async function deleteIngredient(id: string): Promise<void> {
  await delay()
  const db = load()
  const i = db.ingredients.find((x) => x.id === id)
  if (!i) throw new ApiError('食材不存在', 404)
  db.ingredients = db.ingredients.filter((x) => x.id !== id)
  writeLog('delete', `食材「${i.name}」`, '删除食材')
  persist()
}

/* ------------------------------- 食谱 ------------------------------- */
export interface RecipeQuery {
  page: number
  pageSize: number
  keyword?: string
  category?: string
  status?: string
}

export async function listRecipes(q: RecipeQuery): Promise<Paginated<Recipe>> {
  await delay()
  const rows = load()
    .recipes.filter((r) => (q.category ? r.category === q.category : true))
    .filter((r) => (q.status ? r.status === q.status : true))
    .filter((r) => {
      const k = (q.keyword ?? '').trim()
      if (!k) return true
      return [r.name, r.effect, ...r.suitedConstitution, ...r.suitedChronic].some((v) => v.includes(k))
    })
    .sort((a, b) => b.views - a.views)
  return paginate(rows, q.page, q.pageSize)
}

export async function saveRecipe(input: Recipe): Promise<Recipe> {
  await delay()
  const db = load()
  const next: Recipe = { ...input, updatedAt: new Date().toISOString() }
  const idx = db.recipes.findIndex((r) => r.id === input.id)
  if (idx >= 0) {
    db.recipes[idx] = next
    writeLog('update', `食谱「${next.name}」`, `更新食谱信息`)
  } else {
    next.id = uid('rec')
    db.recipes.unshift(next)
    writeLog('create', `食谱「${next.name}」`, `新增${next.category}食谱`)
  }
  persist()
  return { ...next }
}

export async function deleteRecipe(id: string): Promise<void> {
  await delay()
  const db = load()
  const r = db.recipes.find((x) => x.id === id)
  if (!r) throw new ApiError('食谱不存在', 404)
  db.recipes = db.recipes.filter((x) => x.id !== id)
  writeLog('delete', `食谱「${r.name}」`, '删除食谱')
  persist()
}

/* ------------------------------ 用餐记录 ----------------------------- */
export interface MealQuery {
  page: number
  pageSize: number
  keyword?: string
  mealType?: string
}

export async function listMeals(q: MealQuery): Promise<Paginated<MealRecord>> {
  await delay()
  const rows = load()
    .meals.filter((m) => (q.mealType ? m.mealType === q.mealType : true))
    .filter((m) => {
      const k = (q.keyword ?? '').trim()
      if (!k) return true
      return [m.customer, m.recipeName, m.note].some((v) => v.includes(k))
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return paginate(rows, q.page, q.pageSize)
}

/* ------------------------------ 健康档案 ----------------------------- */
export interface ProfileQuery {
  page: number
  pageSize: number
  keyword?: string
}

export type HealthRow = HealthProfile & { bmi: number; flag: string }

export async function listProfiles(q: ProfileQuery): Promise<Paginated<HealthRow>> {
  await delay()
  const rows = load()
    .profiles.map((p) => {
      const bmi = Number((p.weight / Math.pow(p.height / 100, 2)).toFixed(1))
      const abnormal = p.bloodSugar > 7 || p.systolic >= 140 || p.uricAcid > 420
      return { ...p, bmi, flag: abnormal ? '需关注' : '正常' }
    })
    .filter((p) => {
      const k = (q.keyword ?? '').trim()
      return k ? p.customer.includes(k) : true
    })
  return paginate(rows, q.page, q.pageSize)
}

export async function updateProfile(userId: string, patch: Partial<HealthProfile>): Promise<void> {
  await delay()
  const db = load()
  const idx = db.profiles.findIndex((p) => p.userId === userId)
  if (idx < 0) throw new ApiError('健康档案不存在', 404)
  db.profiles[idx] = { ...db.profiles[idx], ...patch, updatedAt: new Date().toISOString() }
  writeLog('update', `健康档案「${db.profiles[idx].customer}」`, '更新体检指标')
  persist()
}

/* ------------------------------ 慢病方案 ----------------------------- */
export async function listPlans(): Promise<ChronicPlan[]> {
  await delay(150)
  return load().plans.map((p) => ({ ...p }))
}

export async function savePlan(plan: ChronicPlan): Promise<ChronicPlan> {
  await delay()
  const db = load()
  const idx = db.plans.findIndex((p) => p.key === plan.key)
  const next = { ...plan, updatedAt: new Date().toISOString() }
  if (idx >= 0) db.plans[idx] = next
  writeLog('update', `慢病方案「${plan.name}」`, '更新食疗原则与推荐食材')
  persist()
  return next
}

/* ------------------------------ 审计日志 ----------------------------- */
export interface LogQuery {
  page: number
  pageSize: number
  keyword?: string
  action?: string
}

export async function listLogs(q: LogQuery): Promise<Paginated<AuditEntry>> {
  await delay()
  const rows = load()
    .logs.filter((l) => (q.action ? l.action === q.action : true))
    .filter((l) => {
      const k = (q.keyword ?? '').trim()
      return k ? [l.operator, l.target, l.detail].some((v) => v.includes(k)) : true
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return paginate(rows, q.page, q.pageSize)
}

export async function recordExport(target: string, count: number): Promise<void> {
  writeLog('export', target, `导出 ${count} 条数据`)
}

/* ------------------------------- 通知 ------------------------------- */
export async function listNotifications(): Promise<Notification[]> {
  await delay(100)
  return load().notifications.map((n) => ({ ...n }))
}

export function markNotificationsRead(): void {
  const db = load()
  db.notifications = db.notifications.map((n) => ({ ...n, read: true }))
  persist()
}

/* ------------------------------- 设置 ------------------------------- */
export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) } : { ...DEFAULT_SETTINGS }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(s: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}

export function resetDatabase(): void {
  localStorage.removeItem(KEY)
  cache = null
  load()
}

/* ------------------------------- 仪表盘 ------------------------------ */
export async function getDashboard(): Promise<import('@/types').DashboardStats> {
  await delay(360)
  const db = load()
  const trend = buildTrend()
  const totalMeals = db.meals.length
  const recipeCount = db.recipes.length
  const userCount = db.users.filter((u) => u.roleKey === 'user').length

  const chronicMap = new Map<ChronicKey, number>()
  CHRONIC_KEYS.forEach((k) => chronicMap.set(k, 0))
  db.users.forEach((u) => u.chronicTags.forEach((t) => chronicMap.set(t, (chronicMap.get(t) ?? 0) + 1)))

  const constMap = new Map<string, number>()
  CONSTITUTIONS.forEach((c) => constMap.set(c, 0))
  db.users.forEach((u) => constMap.set(u.constitution, (constMap.get(u.constitution) ?? 0) + 1))

  return {
    kpis: [
      { key: 'users', label: '注册用户', value: db.users.length, delta: 12.4, sparkline: trend.map((t) => t.users) },
      { key: 'recipes', label: '药膳食谱', value: recipeCount, delta: 6.2, sparkline: [12, 14, 13, 16, 18, 17, 20, 21, 20, 23, 24, 24] },
      { key: 'meals', label: '本月用餐记录', value: totalMeals * 12, delta: 8.7, sparkline: trend.map((t) => t.meals) },
      { key: 'plans', label: '在管慢病人群', value: userCount * 9, delta: -1.8, sparkline: [40, 44, 47, 45, 50, 53, 51, 55, 58, 56, 60, 62] },
    ],
    trend,
    chronicShare: [...chronicMap.entries()].map(([name, value]) => ({ name, value })),
    constitutionShare: [...constMap.entries()].map(([name, value]) => ({ name, value })),
    hotRecipes: [...db.recipes]
      .filter((r) => r.status === 'published')
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
      .map((r) => ({ name: r.name, category: r.category, views: r.views, favorites: r.favorites })),
    recentMeals: [...db.meals].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
    lowStock: db.ingredients.filter((i) => i.status === 'low').slice(0, 5),
  }
}

export { seedRoles }
