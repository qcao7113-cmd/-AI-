/**
 * 运行模式开关
 *
 * VITE_USE_MOCK=true  （默认）→ 使用 lib/api.ts 的本地模拟数据，无需后端即可演示
 * VITE_USE_MOCK=false          → 使用 lib/http.ts 请求真实后端
 *
 * 在项目根目录创建 .env.local 即可切换：
 *   VITE_USE_MOCK=false
 *   VITE_API_BASE=http://localhost:8080
 */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
export const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? 'http://localhost:8080'
