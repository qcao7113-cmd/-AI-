import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import * as api from '@/lib/data'
import { USE_MOCK } from '@/lib/config'
import type { Session } from '@/types'

/* ===================================================================== */
/*  AuthProvider —— 会话、权限、登录/登出                                   */
/* ===================================================================== */

interface AuthValue {
  session: Session | null
  permissions: string[]
  permissionLoading: boolean
  can: (code: string) => boolean
  login: (u: string, p: string) => Promise<void>
  logout: () => Promise<void>
  refreshPermissions: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => api.getSession())
  const [permissions, setPermissions] = useState<string[]>(() => {
    const s = api.getSession()
    if (!s) return []
    const p = api.sessionPermissions()
    return Array.isArray(p) ? p : []
  })
  const [permissionLoading, setPermissionLoading] = useState(false)

  /** 重新拉取权限：mock 模式同步读取本地角色，真实模式请求 /api/auth/me */
  const refreshPermissions = useCallback(() => {
    if (USE_MOCK) {
      const p = api.sessionPermissions()
      if (Array.isArray(p)) setPermissions(p)
      return
    }
    setPermissionLoading(true)
    api
      .currentPermissions()
      .then((list) => setPermissions(Array.isArray(list) ? list : []))
      .catch(() => {
        const p = api.sessionPermissions()
        setPermissions(Array.isArray(p) ? p : [])
      })
      .finally(() => setPermissionLoading(false))
  }, [])

  // 登录态变化时同步权限
  useEffect(() => {
    if (session) refreshPermissions()
    else setPermissions([])
  }, [session, refreshPermissions])

  const login = useCallback(async (username: string, password: string) => {
    const s = await api.login(username, password)
    setSession(s)
    if (USE_MOCK) {
      const p = api.sessionPermissions()
      if (Array.isArray(p)) setPermissions(p)
    }
  }, [])

  const logout = useCallback(async () => {
    await api.logout()
    setSession(null)
    setPermissions([])
  }, [])

  const can = useCallback((code: string) => permissions.includes(code), [permissions])

  const value = useMemo(
    () => ({ session, permissions, permissionLoading, can, login, logout, refreshPermissions }),
    [session, permissions, permissionLoading, can, login, logout, refreshPermissions],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

/* ===================================================================== */
/*  路由守卫                                                              */
/* ===================================================================== */

export function RequireAuth() {
  const { session } = useAuth()
  const location = useLocation()
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

export function RequirePermission({ code }: { code: string }) {
  const { can, permissionLoading } = useAuth()
  if (permissionLoading) {
    return (
      <div className="forbidden">
        <div className="spinner" style={{ width: 26, height: 26, color: 'var(--brand)' }} />
        <p>正在校验权限…</p>
      </div>
    )
  }
  if (!can(code)) {
    return (
      <div className="forbidden">
        <div className="forbidden-icon">🔒</div>
        <h2>无访问权限</h2>
        <p>当前账号的角色未授予该模块的访问权限，请联系管理员在「角色权限」中开通。</p>
      </div>
    )
  }
  return <Outlet />
}

/** 仅在拥有权限时渲染子元素（用于按钮级控制） */
export function Can({ code, children, fallback = null }: { code: string; children: ReactNode; fallback?: ReactNode }) {
  const { can } = useAuth()
  return <>{can(code) ? children : fallback}</>
}

/* ===================================================================== */
/*  Toast                                                                 */
/* ===================================================================== */

type ToastKind = 'success' | 'error' | 'info'
interface ToastItem {
  id: number
  kind: ToastKind
  text: string
}

interface ToastValue {
  toast: (text: string, kind?: ToastKind) => void
  success: (text: string) => void
  error: (text: string) => void
}
const ToastContext = createContext<ToastValue | null>(null)

let seq = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const toast = useCallback((text: string, kind: ToastKind = 'info') => {
    const id = ++seq
    setItems((list) => [...list, { id, kind, text }])
    setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 3200)
  }, [])

  const value = useMemo<ToastValue>(
    () => ({
      toast,
      success: (t: string) => toast(t, 'success'),
      error: (t: string) => toast(t, 'error'),
    }),
    [toast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack">
        {items.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            <span className="toast-icon">{t.kind === 'success' ? '✓' : t.kind === 'error' ? '!' : 'i'}</span>
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

/* ===================================================================== */
/*  设置（主题 / 密度 / 分页大小）                                         */
/* ===================================================================== */

export function useThemeEffect(theme: 'light' | 'dark', compact: boolean) {
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.dataset.compact = String(compact)
  }, [theme, compact])
}
