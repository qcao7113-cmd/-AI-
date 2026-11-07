/**
 * 数据层统一出口
 *
 * 页面只从这里导入（`import * as api from '@/lib/data'`），
 * 内部根据 VITE_USE_MOCK 决定走本地模拟数据还是真实后端，
 * 因此切换到 Spring Boot 后端时页面代码无需任何改动。
 */
import { USE_MOCK } from './config'
import * as mock from './api'
import * as http from './http'
import type { RoleKey } from '@/types'

export type {
  UserQuery,
  IngredientQuery,
  RecipeQuery,
  MealQuery,
  ProfileQuery,
  LogQuery,
} from './api'

/** 审计日志条目（mock 与真实后端结构一致） */
export type AuditEntry = {
  id: string
  operator: string
  action: 'create' | 'update' | 'delete' | 'login' | 'export'
  target: string
  detail: string
  ip: string
  result: 'success' | 'fail'
  createdAt: string
}

export type HealthRow = {
  userId: string
  customer: string
  height: number
  weight: number
  bloodSugar: number
  uricAcid: number
  systolic: number
  diastolic: number
  updatedAt: string
  bmi: number
  flag: string
}

export { ApiError } from './api'

const impl = USE_MOCK ? mock : http

function pick<K extends keyof typeof http>(key: K) {
  const fn = (impl as unknown as Record<string, unknown>)[key]
  return fn as (typeof http)[K]
}

/* 认证 */
export const login = pick('login')
export const logout = pick('logout')
export const getSession = pick('getSession')
export const currentPermissions = pick('currentPermissions')

/* 用户 */
export const listUsers = pick('listUsers')
export const createUser = pick('createUser')
export const updateUser = pick('updateUser')
export const deleteUser = pick('deleteUser')

/* 角色 */
export const listRoles = pick('listRoles')
export const updateRolePermissions = pick('updateRolePermissions')

/* 食材 */
export const listIngredients = pick('listIngredients')
export const saveIngredient = pick('saveIngredient')
export const deleteIngredient = pick('deleteIngredient')

/* 食谱 */
export const listRecipes = pick('listRecipes')
export const saveRecipe = pick('saveRecipe')
export const deleteRecipe = pick('deleteRecipe')

/* 用餐记录 */
export const listMeals = pick('listMeals')

/* 健康档案 */
export const listProfiles = pick('listProfiles')
export const updateProfile = pick('updateProfile')

/* 慢病方案 */
export const listPlans = pick('listPlans')
export const savePlan = pick('savePlan')

/* 审计日志 */
export const listLogs = pick('listLogs')
export const recordExport = pick('recordExport')

/* 通知 */
export const listNotifications = pick('listNotifications')
export const markNotificationsRead = pick('markNotificationsRead')

/* ------------------------- 本地偏好与模拟数据工具 ------------------------- */
export const loadSettings = mock.loadSettings
export const saveSettings = mock.saveSettings
export const resetDatabase = mock.resetDatabase
export const getDashboard = mock.getDashboard

/** 当前会话角色对应的权限（同步，用于首屏避免闪烁） */
export function sessionPermissions(): Promise<string[]> | string[] {
  const s = getSession()
  if (!s) return []
  return mock.peekPermissions(s.user.roleKey as RoleKey)
}
