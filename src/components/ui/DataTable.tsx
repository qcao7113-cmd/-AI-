import { useMemo, useState, type ReactNode } from 'react'
import { cx } from '@/utils/format'
import { Icon } from './Icon'
import { Pagination, TableSkeleton } from './Primitives'

/* ===================================================================== */
/*  DataTable —— 泛型数据表格：排序 / 多选 / 空态 / 骨架 / 分页           */
/* ===================================================================== */

export interface Column<T> {
  key: string
  title: ReactNode
  width?: number | string
  align?: 'left' | 'right' | 'center'
  /** 返回原始值用于排序 */
  sortValue?: (row: T) => string | number
  render: (row: T, index: number) => ReactNode
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  loading,
  rowKey = (r) => r.id,
  selectable,
  selected,
  onSelectedChange,
  onRowClick,
  empty,
  total,
  page,
  pageSize,
  onPageChange,
}: {
  columns: Column<T>[]
  rows: T[]
  loading?: boolean
  rowKey?: (r: T) => string
  selectable?: boolean
  selected?: string[]
  onSelectedChange?: (ids: string[]) => void
  onRowClick?: (row: T) => void
  empty?: ReactNode
  total?: number
  page?: number
  pageSize?: number
  onPageChange?: (p: number) => void
}) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null)

  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    if (!col?.sortValue) return rows
    return [...rows].sort((a, b) => {
      const va = col.sortValue!(a)
      const vb = col.sortValue!(b)
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * sort.dir
      return String(va).localeCompare(String(vb), 'zh-CN') * sort.dir
    })
  }, [rows, sort, columns])

  const allChecked = selectable && rows.length > 0 && rows.every((r) => selected?.includes(rowKey(r)))
  const toggleAll = () => onSelectedChange?.(allChecked ? [] : rows.map(rowKey))
  const toggleOne = (id: string) => {
    const cur = selected ?? []
    onSelectedChange?.(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id])
  }

  const clickSort = (col: Column<T>) => {
    if (!col.sortValue) return
    setSort((s) => (s?.key !== col.key ? { key: col.key, dir: 1 } : s.dir === 1 ? { key: col.key, dir: -1 } : null))
  }

  if (loading) return <TableSkeleton rows={Math.min(pageSize ?? 6, 8)} cols={columns.length} />

  if (!sorted.length) {
    return <div className="table-empty">{empty ?? '暂无数据'}</div>
  }

  return (
    <>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {selectable && (
                <th className="col-check">
                  <input type="checkbox" checked={!!allChecked} onChange={toggleAll} aria-label="全选" />
                </th>
              )}
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={{ width: c.width, textAlign: c.align ?? 'left' }}
                  className={cx(c.sortValue && 'sortable', sort?.key === c.key && 'sorted')}
                  onClick={() => clickSort(c)}
                >
                  <span className="th-inner">
                    {c.title}
                    {c.sortValue &&
                      (sort?.key === c.key ? (
                        <Icon.ChevronDown size={13} className={cx('sort-icon', sort.dir === -1 && 'asc')} />
                      ) : (
                        <span className="sort-icon-placeholder" />
                      ))}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => {
              const id = rowKey(row)
              const isSel = selected?.includes(id)
              return (
                <tr
                  key={id}
                  className={cx(isSel && 'selected', onRowClick && 'clickable')}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {selectable && (
                    <td className="col-check" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={!!isSel} onChange={() => toggleOne(id)} aria-label="选择行" />
                    </td>
                  )}
                  {columns.map((c) => (
                    <td key={c.key} style={{ textAlign: c.align ?? 'left' }}>
                      {c.render(row, i)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {typeof total === 'number' && page && pageSize && onPageChange && (
        <Pagination page={page} pageSize={pageSize} total={total} onChange={onPageChange} />
      )}
    </>
  )
}

/* ============================ 工具条 ============================ */
export function Toolbar({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="toolbar">
      <div className="toolbar-left">{children}</div>
      {right ? <div className="toolbar-right">{right}</div> : null}
    </div>
  )
}

export function SearchBox({ value, onChange, placeholder = '搜索…' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="search-box">
      <Icon.Search size={16} />
      <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {value && (
        <button type="button" className="search-clear" onClick={() => onChange('')} aria-label="清空">
          <Icon.Close size={13} />
        </button>
      )}
    </label>
  )
}

export function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder: string
}) {
  return (
    <div className={cx('filter-select', value && 'has-value')}>
      <Icon.Filter size={14} />
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={placeholder}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
