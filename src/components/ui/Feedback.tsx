import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '@/utils/format'
import { Icon } from './Icon'
import { Button } from './Primitives'

/* ============================== 模态框 ============================== */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 520,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
  width?: number
}) {
  useLockBody(open)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width }} role="dialog" aria-modal="true">
        <header className="modal-head">
          <div>
            <h3>{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="关闭">
            <Icon.Close size={18} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>,
    document.body,
  )
}

/* ============================== 抽屉 ============================== */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 560,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
  width?: number
}) {
  useLockBody(open)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="overlay drawer-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="drawer" style={{ width }} role="dialog" aria-modal="true">
        <header className="modal-head">
          <div>
            <h3>{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="关闭">
            <Icon.Close size={18} />
          </button>
        </header>
        <div className="drawer-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </aside>
    </div>,
    document.body,
  )
}

/* ============================ 确认对话框 ============================ */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = '确认',
  danger,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: ReactNode
  confirmText?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      width={420}
      footer={
        <>
          <Button onClick={onCancel}>取消</Button>
          <Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>
            {confirmText}
          </Button>
        </>
      }
    >
      <div className={cx('confirm-body', danger && 'confirm-danger')}>
        <span className="confirm-icon">{danger ? <Icon.Alert size={22} /> : <Icon.Info size={22} />}</span>
        <div>{message}</div>
      </div>
    </Modal>
  )
}

/* ============================== 表单 ============================== */
export function Field({
  label,
  required,
  error,
  hint,
  children,
  span,
}: {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: ReactNode
  span?: 1 | 2
}) {
  return (
    <label className={cx('field', span === 2 && 'field-span')}>
      <span className="field-label">
        {label}
        {required && <i>*</i>}
      </span>
      {children}
      {error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  )
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  const { invalid, className, ...rest } = props
  return <input className={cx('input', invalid && 'invalid', className)} {...rest} />
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, children, ...rest } = props
  return (
    <div className={cx('select-wrap', className)}>
      <select {...rest}>{children}</select>
      <Icon.ChevronDown size={15} />
    </div>
  )
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props
  return <textarea className={cx('input textarea', className)} rows={3} {...rest} />
}

/** 开关 */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={cx('switch', checked && 'on')}
      onClick={() => onChange(!checked)}
    >
      <span className="switch-thumb" />
    </button>
  )
}

/** 多选胶囊 */
export function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; tone?: string }[]
  value: T[]
  onChange: (v: T[]) => void
}) {
  const toggle = (v: T) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
  return (
    <div className="chips">
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          className={cx('chip', value.includes(o.value) && 'active')}
          onClick={() => toggle(o.value)}
        >
          {value.includes(o.value) && <Icon.Check size={13} />}
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ============================== Tabs ============================== */
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

/* ============================== 提示 ============================== */
export function useLockBody(lock: boolean) {
  useEffect(() => {
    if (!lock) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [lock])
}
