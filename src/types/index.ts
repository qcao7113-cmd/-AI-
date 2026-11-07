export type RoleKey = 'admin' | 'doctor' | 'user'

export interface Permission {
  code: string
  name: string
  group: '平台用户' | '食疗资源' | '健康管理' | '系统'
}

export interface Role {
  id: string
  key: RoleKey
  name: string
  description: string
  permissions: string[]
  builtin: boolean
  createdAt: string
}

export interface User {
  id: string
  name: string
  username: string
  phone: string
  email: string
  gender: '男' | '女'
  age: number
  constitution: Constitution
  chronicTags: ChronicKey[]
  roleKey: RoleKey
  status: 'active' | 'pending' | 'disabled'
  avatarColor: string
  createdAt: string
  lastLoginAt: string | null
}

export type Constitution = '平和质' | '气虚质' | '阳虚质' | '阴虚质' | '痰湿质' | '湿热质' | '血瘀质' | '气郁质'

export type ChronicKey = '糖尿病' | '高血压' | '高血脂' | '慢性胃炎' | '痛风'

/* ------------------------------- 食材 ------------------------------- */
export type IngredientCategory = '谷物' | '豆类' | '蔬菜' | '菌藻' | '水果' | '肉类' | '水产' | '药食同源'

export type FourNatures = '寒' | '凉' | '平' | '温' | '热'

export interface Ingredient {
  id: string
  name: string
  category: IngredientCategory
  nature: FourNatures
  flavor: string[]
  meridian: string
  efficacy: string
  calorie: number
  unit: string
  stock: number
  status: 'available' | 'low' | 'off'
  updatedAt: string
}

/* ------------------------------ 药膳食谱 ----------------------------- */
export type RecipeCategory = '汤羹' | '粥品' | '茶饮' | '主食' | '菜肴' | '糕点'

export interface Recipe {
  id: string
  name: string
  category: RecipeCategory
  suitedConstitution: Constitution[]
  suitedChronic: ChronicKey[]
  ingredients: { name: string; amount: string }[]
  effect: string
  calories: number
  cookTime: number
  status: 'published' | 'draft' | 'offline'
  cover: string
  views: number
  favorites: number
  updatedAt: string
}

/* ------------------------------ 用餐记录 ----------------------------- */
export interface MealRecord {
  id: string
  customer: string
  recipeName: string
  mealType: '早餐' | '午餐' | '晚餐' | '加餐'
  portion: number
  calories: number
  score: number
  note: string
  createdAt: string
}

/* ------------------------------ 健康档案 ----------------------------- */
export interface HealthProfile {
  userId: string
  customer: string
  height: number
  weight: number
  bloodSugar: number
  uricAcid: number
  systolic: number
  diastolic: number
  updatedAt: string
}

/* ------------------------------ 慢病方案 ----------------------------- */
export interface ChronicPlan {
  key: ChronicKey
  name: string
  icon: string
  color: string
  summary: string
  principles: string[]
  recommended: string[]
  avoid: string[]
  users: number
  updatedAt: string
}

export interface Notification {
  id: string
  title: string
  body: string
  kind: 'info' | 'warning' | 'success'
  read: boolean
  createdAt: string
}

export interface Session {
  token: string
  user: {
    id: string
    name: string
    username: string
    roleKey: RoleKey
    avatarColor: string
  }
  expiresAt: number
}

export interface AppSettings {
  theme: 'light' | 'dark'
  compact: boolean
  pageSize: number
  autoRefresh: boolean
  defaultLanding: string
}

export interface DashboardStats {
  kpis: { key: string; label: string; value: number; unit?: string; delta: number; sparkline: number[] }[]
  trend: { date: string; meals: number; users: number }[]
  chronicShare: { name: string; value: number }[]
  constitutionShare: { name: string; value: number }[]
  hotRecipes: { name: string; category: string; views: number; favorites: number }[]
  recentMeals: MealRecord[]
  lowStock: Ingredient[]
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
