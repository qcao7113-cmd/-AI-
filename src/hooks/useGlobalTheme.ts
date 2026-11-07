import { useEffect } from 'react'
import * as api from '@/lib/api'
/**
 * 全站主题兜底：保证登录页也能正确应用主题与密度，
 * 即使直接访问 /login 时尚未经过布局组件。
 */
export function useGlobalTheme() {
  useEffect(() => {
    const s = api.loadSettings()
    document.documentElement.dataset.theme = s.theme
    document.documentElement.dataset.compact = String(s.compact)
  }, [])
}
