import type { ReactNode } from 'react'
import { cx } from '@/utils/format'
import { Icon } from './Icon'

/* =============================== 按钮 =============================== */
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft'

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  icon,
  loading,
  block,
  className,
  ...rest
}: {
  children?: ReactNode
  variant?: ButtonVariant
  size?: 'sm' | 'md'
  icon?: ReactNode
  loading?: boolean
  block?: boolean
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cx('btn', `btn-${variant}`, `btn-${size}`, block && 'btn-block', className)}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading ? <Spinner size={14} /> : icon}
      {children}
    </button>
  )
}

export function Spinner({ size = 18 }: { size?: number }) {
  return <span className="spinner" style={{ width: size, height: size }} aria-label="加载中" />
}

/* =============================== 状态徽章 =============================== */
type BadgeTone = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'muted'

export function Badge({ tone = 'muted', dot, children }: { tone?: BadgeTone; dot?: boolean; children: ReactNode }) {
  return (
    <span className={cx('badge', `badge-${tone}`)}>
      {dot && <i className="badge-dot" />}
      {children}
    </span>
  )
}

/* =============================== 卡片 =============================== */
export function Card({
  title,
  subtitle,
  extra,
  children,
  className,
  padded = true,
}: {
  title?: ReactNode
  subtitle?: ReactNode
  extra?: ReactNode
  children?: ReactNode
  className?: string
  padded?: boolean
}) {
  return (
    <section className={cx('card', className)}>
      {(title || extra) && (
        <header className="card-head">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-sub">{subtitle}</p>}
          </div>
          {extra && <div className="card-extra">{extra}</div>}
        </header>
      )}
      <div className={cx(padded && 'card-body')}>{children}</div>
    </section>
  )
}

/* =============================== 空状态 =============================== */
export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon ?? <Icon.Info size={26} />}</div>
      <b>{title}</b>
      {description && <p>{description}</p>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  )
}

/* =============================== 骨架屏 =============================== */
export function Skeleton({ w = '100%', h = 16, radius = 6, style }: { w?: number | string; h?: number; radius?: number; style?: React.CSSProperties }) {
  return <span className="skeleton" style={{ width: w, height: h, borderRadius: radius, ...style }} />
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="table-skeleton">
      {Array.from({ length: rows }).map((_, r) => (
        <div className="table-skeleton-row" key={r}>
          {Array.from({ length: cols }).map((__, c) => (
            <Skeleton key={c} h={14} w={c === 0 ? '70%' : c === cols - 1 ? '40%' : '60%'} />
          ))}
        </div>
      ))}
    </div>
  )
}

/* =============================== 进度条 =============================== */
export function Progress({ value, tone = 'brand', label }: { value: number; tone?: BadgeTone; label?: string }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className="progress-wrap">
      {label && <span className="progress-label">{label}</span>}
      <div className="progress">
        <div className={cx('progress-bar', `progress-${tone}`)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/* =============================== 分段标签 =============================== */
export function Tag({ children, tone = 'muted' }: { children: ReactNode; tone?: BadgeTone | 'nature-cold' | 'nature-cool' | 'nature-neutral' | 'nature-warm' | 'nature-hot' }) {
  return <span className={cx('tag', `tag-${tone}`)}>{children}</span>
}

/* =============================== Tabs =============================== */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { key: T; label: ReactNode; count?: number }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="tabs" role="tablist">
      {items.map((it) => (
        <button
          key={it.key}
          role="tab"
          aria-selected={value === it.key}
          className={cx('tab', value === it.key && 'active')}
          onClick={() => onChange(it.key)}
        >
          {it.label}
          {typeof it.count === 'number' && <em className="tab-count">{it.count}</em>}
        </button>
      ))}
    </div>
  )
}

/* =============================== 分页 =============================== */
export function Pagination({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number
  pageSize: number
  total: number
  onChange: (page: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const window: number[] = []
  const start = Math.max(1, Math.min(page - 1, pages - 2))
  for (let i = start; i <= Math.min(pages, start + 2); i++) window.push(i)
  return (
    <div className="pagination">
      <span className="pagination-info">
        共 {total} 条 · 第 {page}/{pages} 页
      </span>
      <div className="pagination-btns">
        <button className="page-btn" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="上一页">
          <Icon.ChevronLeft size={16} />
        </button>
        {window[0] > 1 && <span className="page-ellipsis">…</span>}
        {window.map((p) => (
          <button key={p} className={cx('page-btn', p === page && 'active')} onClick={() => onChange(p)}>
            {p}
          </button>
        ))}
        {window[window.length - 1] < pages && <span className="page-ellipsis">…</span>}
        <button className="page-btn" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="下一页">
          <Icon.ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
