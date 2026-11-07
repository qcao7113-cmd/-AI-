import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AppContext'
import * as api from '@/lib/api'
import type { Notification } from '@/types'
import { cx, relativeTime } from '@/utils/format'
import { ROLE_LABEL } from '@/utils/permissions'
import { Icon } from '@/components/ui/Icon'

interface NavEntry {
  to: string
  label: string
  icon: keyof typeof Icon
  permission?: string
  badge?: number
}

interface NavSection {
  title: string
  items: NavEntry[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: '总览',
    items: [{ to: '/dashboard', label: '数据概览', icon: 'Dashboard' }],
  },
  {
    title: '平台用户',
    items: [
      { to: '/users', label: '用户管理', icon: 'Users', permission: 'user:view' },
      { to: '/roles', label: '角色权限', icon: 'Shield', permission: 'role:manage' },
    ],
  },
  {
    title: '食疗资源',
    items: [
      { to: '/ingredients', label: '食材库', icon: 'Leaf', permission: 'ingredient:view' },
      { to: '/recipes', label: '药膳食谱', icon: 'Bowl', permission: 'recipe:view' },
    ],
  },
  {
    title: '健康管理',
    items: [
      { to: '/meals', label: '用餐记录', icon: 'Utensils', permission: 'meal:view' },
      { to: '/health', label: '健康档案', icon: 'Heart', permission: 'health:view' },
      { to: '/chronic', label: '慢病方案', icon: 'Stethoscope', permission: 'plan:manage' },
    ],
  },
  {
    title: '系统',
    items: [
      { to: '/audit', label: '审计日志', icon: 'Scroll', permission: 'role:manage' },
      { to: '/settings', label: '系统设置', icon: 'Settings' },
    ],
  },
]

const COLLAPSE_KEY = 'shiliao:sidebar-collapsed'

export default function AppLayout() {
  const { session, can, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (document.documentElement.dataset.theme as 'light' | 'dark') || 'light')

  useEffect(() => localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0'), [collapsed])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    // 与设置页保持一致，避免两处状态冲突
    const s = api.loadSettings()
    api.saveSettings({ ...s, theme })
  }, [theme])
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])
  // 启动时同步设置主题
  useEffect(() => {
    setTheme(api.loadSettings().theme)
  }, [])

  const visibleSections = NAV_SECTIONS.map((s) => ({
    ...s,
    items: s.items.filter((i) => !i.permission || can(i.permission)),
  })).filter((s) => s.items.length > 0)

  const currentLabel =
    visibleSections.flatMap((s) => s.items).find((i) => location.pathname.startsWith(i.to))?.label ?? '数据概览'

  return (
    <div className="app-shell">
      {mobileOpen && <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />}
      <aside className={cx('sidebar', collapsed && 'collapsed', mobileOpen && 'mobile-open')}>
        <div className="sidebar-brand">
          <div className="brand-logo">膳</div>
          <div className="brand-text">
            <b>药膳智养</b>
            <span>慢性病食疗管理平台</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {visibleSections.map((section) => (
            <div key={section.title}>
              <div className="nav-group-label">{section.title}</div>
              {section.items.map((item) => {
                const Ico = Icon[item.icon]
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => cx('nav-item', isActive && 'active')}
                    title={collapsed ? item.label : undefined}
                  >
                    <Ico size={18} />
                    <span className="nav-label">{item.label}</span>
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar-foot">
          <button className="sidebar-collapse-btn" onClick={() => setCollapsed((c) => !c)} aria-label="折叠侧边栏">
            {collapsed ? <Icon.ChevronRight size={16} /> : <Icon.ChevronLeft size={16} />}
            <span className="sidebar-foot-text">{collapsed ? '' : '收起菜单'}</span>
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button className="icon-btn mobile-only" onClick={() => setMobileOpen(true)} aria-label="打开菜单">
            <Icon.Menu size={20} />
          </button>
          <span className="topbar-title">{currentLabel}</span>
          <div className="topbar-actions">
            <button
              className="icon-btn"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              aria-label="切换主题"
              title={theme === 'dark' ? '切换到浅色' : '切换到深色'}
            >
              {theme === 'dark' ? <Icon.Sun size={18} /> : <Icon.Moon size={18} />}
            </button>
            <NotificationBell />
            <UserMenu name={session?.user.name ?? ''} role={session ? ROLE_LABEL[session.user.roleKey] : ''} color={session?.user.avatarColor ?? '#2f8f5b'} onLogout={async () => { await logout(); navigate('/login', { replace: true }) }} />
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

/* ----------------------------- 通知铃铛 ----------------------------- */
function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.listNotifications().then(setItems)
  }, [])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const unread = items.filter((n) => !n.read).length

  const markAll = () => {
    api.markNotificationsRead()
    setItems((list) => list.map((n) => ({ ...n, read: true })))
  }

  return (
    <div className="dropdown" ref={ref}>
      <button className="icon-btn" onClick={() => setOpen((o) => !o)} aria-label="通知">
        <Icon.Bell size={18} />
        {unread > 0 && <span className="dot" />}
      </button>
      {open && (
        <div className="dropdown-menu">
          <div className="dropdown-head">
            <span>通知中心</span>
            {unread > 0 && (
              <button className="link-btn" onClick={markAll}>
                全部已读
              </button>
            )}
          </div>
          {items.length === 0 && <div className="dropdown-empty">暂无通知</div>}
          {items.map((n) => (
            <div className="dropdown-item" key={n.id}>
              <i
                className="dot"
                style={{ background: n.kind === 'warning' ? 'var(--warning)' : n.kind === 'success' ? 'var(--success)' : 'var(--info)' }}
              />
              <div>
                <b>
                  {n.title}
                  {!n.read && <span className="unread-mark" />}
                </b>
                <p>{n.body}</p>
                <p className="muted-xs">{relativeTime(n.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ------------------------------ 用户菜单 ------------------------------ */
function UserMenu({ name, role, color, onLogout }: { name: string; role: string; color: string; onLogout: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div className="dropdown" ref={ref}>
      <button className="user-chip" onClick={() => setOpen((o) => !o)}>
        <span className="avatar" style={{ background: color }}>
          {name.slice(0, 1)}
        </span>
        <span className="user-chip-meta">
          <b>{name}</b>
          <span>{role}</span>
        </span>
        <Icon.ChevronDown size={14} />
      </button>
      {open && (
        <div className="dropdown-menu" style={{ minWidth: 180 }}>
          <button className="menu-item" onClick={() => { setOpen(false); navigate('/settings') }}>
            <Icon.Settings size={16} /> 系统设置
          </button>
          <div className="dropdown-sep" />
          <button className="menu-item danger" onClick={onLogout}>
            <Icon.LogOut size={16} /> 退出登录
          </button>
        </div>
      )}
    </div>
  )
}
