import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AppContext'
import { DEMO_ACCOUNTS } from '@/utils/permissions'
import { Button } from '@/components/ui/Primitives'
import { TextInput } from '@/components/ui/Feedback'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('123456')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username.trim(), password)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from && from !== '/login' ? from : '/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const quickFill = (u: string) => {
    setUsername(u)
    setPassword('123456')
    setError('')
  }

  return (
    <div className="login-page">
      <div className="login-aside">
        <div className="login-brand">
          <div className="brand-logo large">膳</div>
          <div>
            <b>药膳智养</b>
            <span>慢性病食疗管理平台</span>
          </div>
        </div>
        <h1>
          以中医食疗为核心
          <br />
          构建慢病健康管理体系
        </h1>
        <p>汇聚 46 味药食同源食材与 24 道辨证药膳食谱，覆盖糖尿病、高血压、高血脂等五大慢病食疗方案。</p>
        <ul className="login-points">
          <li>🌿 体质辨识 · 因人施膳</li>
          <li>🩺 慢病随访 · 用餐记录追踪</li>
          <li>📊 运营数据 · 一屏掌握</li>
        </ul>
        <div className="login-pattern" aria-hidden />
      </div>

      <div className="login-main">
        <form className="login-card" onSubmit={submit}>
          <h2>欢迎回来</h2>
          <p className="login-sub">请登录管理后台</p>

          <label className="field">
            <span className="field-label">账号</span>
            <TextInput value={username} onChange={(e) => setUsername(e.target.value)} placeholder="请输入账号" autoComplete="username" />
          </label>
          <label className="field">
            <span className="field-label">密码</span>
            <TextInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              autoComplete="current-password"
            />
          </label>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" block loading={loading} className="login-submit">
            登录
          </Button>

          <div className="login-demo">
            <span>演示账号（密码均为 123456）</span>
            <div className="demo-list">
              {DEMO_ACCOUNTS.map((a) => (
                <button type="button" key={a.username} className="demo-card" onClick={() => quickFill(a.username)}>
                  <b>{a.role}</b>
                  <span>{a.username}</span>
                  <em>{a.desc}</em>
                </button>
              ))}
            </div>
          </div>
        </form>
        <footer className="login-foot">© {new Date().getFullYear()} 药膳智养 · 慢性病食疗管理平台</footer>
      </div>
    </div>
  )
}
