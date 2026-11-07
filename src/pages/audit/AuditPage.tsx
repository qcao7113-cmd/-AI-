import { useCallback, useEffect, useState } from 'react'
import * as api from '@/lib/api'
import type { AuditEntry } from '@/lib/api'
import { formatDateTime, toCsv, downloadFile, formatDate } from '@/utils/format'
import { useToast } from '@/context/AppContext'
import { DataTable, FilterSelect, SearchBox, Toolbar, type Column } from '@/components/ui/DataTable'
import { Badge, Button, Card } from '@/components/ui/Primitives'
import { Icon } from '@/components/ui/Icon'
import { PageHead } from '@/components/layout/PageHead'

const ACTIONS: Record<AuditEntry['action'], { label: string; tone: 'success' | 'info' | 'danger' | 'brand' | 'muted' }> = {
  create: { label: '新增', tone: 'success' },
  update: { label: '修改', tone: 'info' },
  delete: { label: '删除', tone: 'danger' },
  login: { label: '登录', tone: 'muted' },
  export: { label: '导出', tone: 'brand' },
}

export default function AuditPage() {
  const toast = useToast()
  const [rows, setRows] = useState<AuditEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(12)
  const [keyword, setKeyword] = useState('')
  const [action, setAction] = useState('')
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    const res = await api.listLogs({ page, pageSize, keyword, action })
    setRows(res.items)
    setTotal(res.total)
    setLoading(false)
  }, [page, pageSize, keyword, action])

  useEffect(() => {
    const t = setTimeout(() => void fetch(), 200)
    return () => clearTimeout(t)
  }, [fetch])
  useEffect(() => setPage(1), [keyword, action])

  const exportCsv = async () => {
    const all = await api.listLogs({ page: 1, pageSize: 1000, keyword, action })
    const csv = toCsv(
      ['操作人', '操作类型', '操作对象', '详情', 'IP', '结果', '时间'],
      all.items.map((l) => [l.operator, ACTIONS[l.action].label, l.target, l.detail, l.ip, l.result === 'success' ? '成功' : '失败', formatDateTime(l.createdAt)]),
    )
    downloadFile(`审计日志_${formatDate(new Date().toISOString())}.csv`, csv)
    await api.recordExport('审计日志', all.items.length)
    toast.success(`已导出 ${all.items.length} 条日志`)
  }

  const columns: Column<AuditEntry>[] = [
    { key: 'operator', title: '操作人', width: 110, sortValue: (l) => l.operator, render: (l) => <span className="cell-primary">{l.operator}</span> },
    { key: 'action', title: '类型', width: 80, render: (l) => <Badge tone={ACTIONS[l.action].tone}>{ACTIONS[l.action].label}</Badge> },
    { key: 'target', title: '操作对象', render: (l) => l.target },
    { key: 'detail', title: '详情', render: (l) => <span className="cell-wrap muted-xs">{l.detail}</span> },
    { key: 'ip', title: 'IP 地址', width: 130, render: (l) => <span className="mono muted-xs">{l.ip}</span> },
    { key: 'result', title: '结果', width: 80, render: (l) => <Badge tone={l.result === 'success' ? 'success' : 'danger'} dot>{l.result === 'success' ? '成功' : '失败'}</Badge> },
    { key: 'time', title: '时间', width: 150, sortValue: (l) => l.createdAt, render: (l) => <span className="muted-xs">{formatDateTime(l.createdAt)}</span> },
  ]

  return (
    <>
      <PageHead
        title="审计日志"
        description="记录平台内的关键操作，便于追溯与安全审计"
        actions={<Button icon={<Icon.Download size={16} />} onClick={exportCsv}>导出</Button>}
      />
      <Card padded={false}>
        <Toolbar right={<Button variant="ghost" icon={<Icon.Refresh size={16} />} onClick={() => fetch()} loading={loading}>刷新</Button>}>
          <SearchBox value={keyword} onChange={setKeyword} placeholder="搜索操作人 / 对象 / 详情" />
          <FilterSelect value={action} onChange={setAction} placeholder="全部类型" options={Object.entries(ACTIONS).map(([v, a]) => ({ value: v, label: a.label }))} />
        </Toolbar>
        <DataTable columns={columns} rows={rows} loading={loading} total={total} page={page} pageSize={pageSize} onPageChange={setPage} empty="暂无日志" />
      </Card>
    </>
  )
}
