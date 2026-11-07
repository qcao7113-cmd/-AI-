export function formatMoney(n: number, withSymbol = true): string {
  const s = n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return withSymbol ? `¥${s}` : s
}

export function formatNumber(n: number): string {
  return n.toLocaleString('zh-CN')
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const p = (v: number) => String(v).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const p = (v: number) => String(v).padStart(2, '0')
  return `${formatDate(iso)} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour} 小时前`
  const day = Math.floor(hour / 24)
  if (day < 30) return `${day} 天前`
  return formatDate(iso)
}

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}

export function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`
}

/** 在列表客户端做多字段模糊匹配 */
export function matchKeyword<T>(row: T, keyword: string, fields: (keyof T)[]): boolean {
  const k = keyword.trim().toLowerCase()
  if (!k) return true
  return fields.some((f) => String(row[f] ?? '').toLowerCase().includes(k))
}

export function downloadFile(filename: string, content: string, mime = 'text/csv;charset=utf-8'): void {
  const blob = new Blob(['\uFEFF' + content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function toCsv(headers: string[], rows: (string | number)[][]): string {
  const escape = (v: string | number) => {
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n')
}
