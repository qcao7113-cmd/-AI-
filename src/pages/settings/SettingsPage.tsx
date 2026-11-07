import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '@/lib/api'
import type { AppSettings } from '@/types'
import { useAuth, useThemeEffect, useToast } from '@/context/AppContext'
import { ROLE_LABEL } from '@/utils/permissions'
import { Badge, Button, Card } from '@/components/ui/Primitives'
import { ConfirmDialog, Select, Switch } from '@/components/ui/Feedback'
import { Icon } from '@/components/ui/Icon'
import { PageHead } from '@/components/layout/PageHead'

export default function SettingsPage() {
  const { session, logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [settings, setSettings] = useState<AppSettings>(() => api.loadSettings())
  const [confirmReset, setConfirmReset] = useState(false)

  useThemeEffect(settings.theme, settings.compact)

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const next = { ...settings, [key]: value }
    setSettings(next)
    api.saveSettings(next)
  }

  const reset = () => {
    api.resetDatabase()
    setConfirmReset(false)
    toast.success('演示数据已重置，即将刷新页面')
    setTimeout(() => window.location.reload(), 800)
  }

  return (
    <>
      <PageHead title="系统设置" description="个性化界面偏好与演示数据管理" />

      <div className="settings-grid">
        <Card title="界面偏好" subtitle="设置立即生效并保存在本地">
          <div className="setting-row">
            <div>
              <b>主题模式</b>
              <p>深色主题适合夜间值守与低光环境</p>
            </div>
            <div className="seg">
              <button className={settings.theme === 'light' ? 'active' : ''} onClick={() => update('theme', 'light')}>
                <Icon.Sun size={15} /> 浅色
              </button>
              <button className={settings.theme === 'dark' ? 'active' : ''} onClick={() => update('theme', 'dark')}>
                <Icon.Moon size={15} /> 深色
              </button>
            </div>
          </div>

          <div className="setting-row">
            <div>
              <b>紧凑密度</b>
              <p>压缩表格与卡片间距，一屏显示更多数据</p>
            </div>
            <Switch checked={settings.compact} onChange={(v) => update('compact', v)} label="紧凑密度" />
          </div>

          <div className="setting-row">
            <div>
              <b>列表每页条数</b>
              <p>控制用户、食材、日志等列表的分页大小</p>
            </div>
            <div style={{ width: 140 }}>
              <Select value={String(settings.pageSize)} onChange={(e) => update('pageSize', Number(e.target.value))}>
                {[10, 12, 20, 30].map((n) => <option key={n} value={n}>{n} 条 / 页</option>)}
              </Select>
            </div>
          </div>

          <div className="setting-row">
            <div>
              <b>自动刷新</b>
              <p>数据概览页每隔 60 秒自动拉取最新数据</p>
            </div>
            <Switch checked={settings.autoRefresh} onChange={(v) => update('autoRefresh', v)} label="自动刷新" />
          </div>

          <div className="setting-row">
            <div>
              <b>默认落地页</b>
              <p>登录后自动进入的页面</p>
            </div>
            <div style={{ width: 180 }}>
              <Select value={settings.defaultLanding} onChange={(e) => update('defaultLanding', e.target.value)}>
                <option value="/dashboard">数据概览</option>
                <option value="/users">用户管理</option>
                <option value="/recipes">药膳食谱</option>
                <option value="/meals">用餐记录</option>
              </Select>
            </div>
          </div>
        </Card>

        <div className="settings-col">
          <Card title="当前账号">
            <div className="profile-block">
              <span className="avatar large" style={{ background: session?.user.avatarColor }}>{session?.user.name.slice(0, 1)}</span>
              <div>
                <b>{session?.user.name}</b>
                <p className="muted-xs">@{session?.user.username}</p>
                <Badge tone="brand">{session ? ROLE_LABEL[session.user.roleKey] : ''}</Badge>
              </div>
            </div>
            <div className="profile-actions">
              <Button icon={<Icon.LogOut size={16} />} onClick={async () => { await logout(); navigate('/login', { replace: true }) }}>
                退出登录
              </Button>
            </div>
          </Card>

          <Card title="演示数据" subtitle="所有数据存储于浏览器 localStorage">
            <p className="muted-xs" style={{ lineHeight: 1.8, marginBottom: 12 }}>
              本系统为前端演示版，数据保存在本机浏览器中。重置后用户、食材、食谱、用餐记录等将恢复为初始种子数据。
            </p>
            <Button variant="danger" icon={<Icon.Refresh size={16} />} onClick={() => setConfirmReset(true)}>
              重置演示数据
            </Button>
          </Card>

          <Card title="关于系统">
            <dl className="about-list">
              <div><dt>系统名称</dt><dd>药膳智养 · 慢性病食疗管理平台</dd></div>
              <div><dt>版本</dt><dd>v1.2.0</dd></div>
              <div><dt>技术栈</dt><dd>React 18 · TypeScript · Vite</dd></div>
              <div><dt>前端路由</dt><dd>React Router v6</dd></div>
            </dl>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        danger
        title="重置演示数据"
        message="确定要清空所有本地演示数据并恢复初始状态吗？此操作不可撤销。"
        confirmText="确认重置"
        onCancel={() => setConfirmReset(false)}
        onConfirm={reset}
      />
    </>
  )
}
