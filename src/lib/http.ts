import { API_BASE } from './config'
import type {
  AuditLog,
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

/* ===================================================================== */
/*  真实后端 HTTP 客户端                                                 */
/*  与 lib/api.ts 的函数签名完全一致，页面无需任何改动                    */
/*  启用方式：.env.local 设置 VITE_USE_MOCK=false                        */
/* ===================================================================== */

const TOKEN_KEY = 'shiliao:token'

export class ApiError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface Envelope<T> {
  code: number
  message: string
  data: T
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

function qs(params: Record<string, unknown>): string {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v))
  })
  const s = sp.toString()
  return s ? `?${s}` : ''
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, { ...init, headers })
  } catch {
    throw new ApiError('无法连接后端服务，请确认服务已启动', 0)
  }

  // 401：清理登录态，交由路由守卫跳转
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem('shiliao:session:v1')
    throw new ApiError('登录已过期，请重新登录', 401)
  }

  let body: Envelope<T> | null = null
  try {
    body = (await res.json()) as Envelope<T>
  } catch {
    /* 空响应 */
  }

  if (!res.ok || (body && body.code !== 200)) {
    throw new ApiError(body?.message ?? `请求失败（${res.status}）`, res.status)
  }
  return (body?.data ?? undefined) as T
}

/* ------------------------------- 认证 ------------------------------- */
const SESSION_KEY = 'shiliao:session:v1'

export async function login(username: string, password: string): Promise<Session> {
  const data = await request<{ token: string; user: Session['user']; expiresAt: number }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  localStorage.setItem(TOKEN_KEY, data.token)
  const session: Session = { token: data.token, user: data.user, expiresAt: data.expiresAt }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export async function logout(): Promise<void> {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(SESSION_KEY)
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as Session
    if (s.expiresAt < Date.now()) {
      localStorage.removeItem(SESSION_KEY)
      localStorage.removeItem(TOKEN_KEY)
      return null
    }
    return s
  } catch {
    return null
  }
}

export async function currentPermissions(): Promise<string[]> {
  const me = await request<{ permissions: string[] }>('/api/auth/me')
  return me.permissions
}

/* ------------------------------- 用户 ------------------------------- */
export interface UserQuery {
  page: number
  pageSize: number
  keyword?: string
  roleKey?: string
  status?: string
}

export function listUsers(q: UserQuery): Promise<Paginated<User>> {
  return request(`/api/users${qs({ ...q })}`)
}

export function createUser(input: Omit<User, 'id' | 'createdAt' | 'lastLoginAt' | 'avatarColor'>): Promise<User> {
  return request('/api/users', { method: 'POST', body: JSON.stringify(input) })
}

export function updateUser(id: string, patch: Partial<User>): Promise<User> {
  return request(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(patch) })
}

export function deleteUser(id: string): Promise<void> {
  return request(`/api/users/${id}`, { method: 'DELETE' })
}

/* ------------------------------- 角色 ------------------------------- */
export function listRoles(): Promise<Role[]> {
  return request('/api/roles')
}

export function updateRolePermissions(id: string, permissions: string[]): Promise<Role> {
  return request(`/api/roles/${id}/permissions`, { method: 'PUT', body: JSON.stringify(permissions) })
}

/* ------------------------------- 食材 ------------------------------- */
export interface IngredientQuery {
  page: number
  pageSize: number
  keyword?: string
  category?: string
  status?: string
}

export function listIngredients(q: IngredientQuery): Promise<Paginated<Ingredient>> {
  return request(`/api/ingredients${qs({ ...q })}`)
}

export function saveIngredient(input: Ingredient): Promise<Ingredient> {
  return request('/api/ingredients', { method: 'POST', body: JSON.stringify(input) })
}

export function deleteIngredient(id: string): Promise<void> {
  return request(`/api/ingredients/${id}`, { method: 'DELETE' })
}

/* ------------------------------- 食谱 ------------------------------- */
export interface RecipeQuery {
  page: number
  pageSize: number
  keyword?: string
  category?: string
  status?: string
}

export function listRecipes(q: RecipeQuery): Promise<Paginated<Recipe>> {
  return request(`/api/recipes${qs({ ...q })}`)
}

export function saveRecipe(input: Recipe): Promise<Recipe> {
  return request('/api/recipes', { method: 'POST', body: JSON.stringify(input) })
}

export function deleteRecipe(id: string): Promise<void> {
  return request(`/api/recipes/${id}`, { method: 'DELETE' })
}

/* ------------------------------ 用餐记录 ----------------------------- */
export interface MealQuery {
  page: number
  pageSize: number
  keyword?: string
  mealType?: string
}

export function listMeals(q: MealQuery): Promise<Paginated<MealRecord>> {
  return request(`/api/meals${qs({ ...q })}`)
}

/* ------------------------------ 健康档案 ----------------------------- */
export interface ProfileQuery {
  page: number
  pageSize: number
  keyword?: string
}

export type HealthRow = HealthProfile & { bmi: number; flag: string }

export function listProfiles(q: ProfileQuery): Promise<Paginated<HealthRow>> {
  return request(`/api/profiles${qs({ ...q })}`)
}

export function updateProfile(userId: string, patch: Partial<HealthProfile>): Promise<void> {
  return request(`/api/profiles/${userId}`, { method: 'PUT', body: JSON.stringify(patch) })
}

/* ------------------------------ 慢病方案 ----------------------------- */
export function listPlans(): Promise<ChronicPlan[]> {
  return request('/api/plans')
}

export function savePlan(plan: ChronicPlan): Promise<ChronicPlan> {
  return request(`/api/plans/${encodeURIComponent(plan.key)}`, { method: 'PUT', body: JSON.stringify(plan) })
}

/* ------------------------------ 审计日志 ----------------------------- */
export interface LogQuery {
  page: number
  pageSize: number
  keyword?: string
  action?: string
}

export function listLogs(q: LogQuery): Promise<Paginated<AuditLog>> {
  return request(`/api/logs${qs({ ...q })}`)
}

export function recordExport(_target: string, _count: number): Promise<void> {
  return Promise.resolve()
}

/* ------------------------------- 通知 ------------------------------- */
export function listNotifications(): Promise<Notification[]> {
  return Promise.resolve([
    {
      id: 'sys-1',
      title: '已连接后端服务',
      body: '当前为真实接口模式，数据来自 ' + API_BASE,
      kind: 'success',
      read: false,
      createdAt: new Date().toISOString(),
    },
  ])
}

export function markNotificationsRead(): void {
  /* 真实模式下由后端维护，此处留空 */
}
