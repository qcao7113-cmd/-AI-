# 药膳智养 · 慢性病食疗管理平台

基于中医「药食同源」理论的慢性病食疗管理前端系统。包含用户管理、食材库、药膳食谱、用餐记录、健康档案、慢病方案、角色权限、审计日志与系统设置等完整业务模块。

> 纯前端演示版：数据保存在浏览器 `localStorage`，无需后端即可完整运行。

---

## 快速开始

```bash
# 1. 安装依赖（需 Node.js 18+）
npm install

# 2. 启动开发服务器
npm run dev
# 打开 http://localhost:5175

# 3. 生产构建
npm run build && npm run preview
```

### 演示账号

| 账号 | 密码 | 角色 | 权限说明 |
| --- | --- | --- | --- |
| `admin` | `123456` | 超级管理员 | 全部功能可用 |
| `doctor` | `123456` | 健康管理师 | 可维护食材/食谱、管理健康档案 |
| `user` | `123456` | 普通用户 | 仅可浏览，写操作与菜单被隐藏 |

切换不同账号登录，可以直观看到**基于角色权限的菜单与按钮级控制**。

---

## 目录结构

所有源码按职责分层归类，一眼即可定位：

```
admin-console/
├─ index.html                  入口 HTML（含主题防闪白脚本）
├─ package.json                依赖与脚本
├─ vite.config.ts              Vite 配置（含 ?@ 路径别名）
├─ tsconfig*.json              TypeScript 配置
├─ public/                     静态资源（favicon）
├─ docs/                       项目文档
│  ├─ 项目说明.md              功能清单与业务说明
│  └─ 开发指南.md              架构、约定与如何接入真实后端
└─ src/
   ├─ main.tsx                 应用入口
   ├─ App.tsx                  路由表 + 权限守卫装配
   │
   ├─ types/
   │  └─ index.ts              ★ 全局类型定义（实体、枚举、接口）
   │
   ├─ lib/                     ★ 数据层（对接后端的地方）
   │  ├─ api.ts                模拟接口：分页 / 登录 / 增删改查 / 仪表盘统计
   │  └─ seed.ts               领域种子数据：食材、食谱、慢病方案
   │
   ├─ context/
   │  └─ AppContext.tsx        认证上下文、权限守卫、Toast 全局提示
   │
   ├─ hooks/
   │  └─ useGlobalTheme.ts     全站主题兜底
   │
   ├─ utils/
   │  ├─ format.ts             金额/日期格式化、CSV 导出等工具
   │  └─ permissions.ts        ★ 权限清单、角色默认权限、演示账号
   │
   ├─ components/              ★ 通用组件（与业务无关，可复用）
   │  ├─ ui/
   │  │  ├─ Icon.tsx           线性图标集
   │  │  ├─ Primitives.tsx     按钮/徽章/卡片/分页/空态/骨架屏
   │  │  ├─ DataTable.tsx      泛型数据表格（排序/分页/搜索/筛选）
   │  │  └─ Feedback.tsx       模态框/抽屉/表单控件/确认框
   │  ├─ charts/
   │  │  └─ Charts.tsx         纯 SVG 图表：折线/柱状/环形/迷你走势
   │  └─ layout/
   │     ├─ AppLayout.tsx      侧边栏 + 顶栏 + 通知 + 用户菜单
   │     └─ PageHead.tsx       页面标题区
   │
   ├─ pages/                   ★ 业务页面（按模块分目录）
   │  ├─ auth/LoginPage.tsx    登录页
   │  ├─ dashboard/            数据概览（KPI + 图表）
   │  ├─ users/                用户管理
   │  ├─ ingredients/          食材库（四气五味/归经/库存）
   │  ├─ recipes/              药膳食谱（卡片 + 详情抽屉）
   │  ├─ meals/                用餐记录
   │  ├─ health/               健康档案（BMI/血压/血糖/尿酸）
   │  ├─ chronic/              慢病食疗方案
   │  ├─ roles/                角色权限配置
   │  ├─ audit/                审计日志
   │  └─ settings/             系统设置
   │
   └─ styles/                  ★ 样式
      ├─ tokens.css            设计令牌：颜色/圆角/阴影/主题变量
      ├─ layout.css            布局骨架：侧边栏/顶栏/页面容器
      ├─ ui.css                通用组件样式
      └─ pages.css             页面级样式
```

---

## 主要特性

- **完整业务闭环**：用户 → 体质辨识 → 慢病标签 → 食疗方案 → 药膳食谱 → 用餐记录 → 健康档案
- **角色权限体系**：菜单级 + 路由级 + 按钮级三层控制，可在「角色权限」页实时调整
- **通用组件抽象**：`DataTable` 泛型表格支持排序、分页、搜索、多条件筛选
- **零依赖图表**：折线图/柱状图/环形图全部为手写 SVG，自动适配深浅主题
- **深浅色主题**：CSS 变量驱动，偏好持久化，首屏无闪白
- **数据持久化**：模拟后端带延迟与校验，刷新不丢失；支持一键重置演示数据
- **数据导出**：用户、食材、用餐记录、审计日志均支持导出 CSV
- **响应式**：窄屏自动收起侧边栏为抽屉式导航

---

## 技术栈

| 类别 | 选型 |
| --- | --- |
| 框架 | React 18 + TypeScript |
| 构建 | Vite 5 |
| 路由 | React Router v6 |
| 样式 | 原生 CSS + CSS 变量（无 UI 框架依赖） |
| 图表 | 手写 SVG |
| 数据 | localStorage 模拟后端 |

---

## 接入真实后端

数据层集中在 `src/lib/api.ts`，每个函数已按真实接口的形态设计（async + 参数 + 分页协议）。
只需把函数体替换为 `fetch`，调用方无需任何改动：

```ts
export async function listUsers(q: UserQuery): Promise<Paginated<User>> {
  const res = await fetch(`/api/users?page=${q.page}&pageSize=${q.pageSize}&keyword=${q.keyword}`)
  return res.json()
}
```

更多约定见 [`docs/开发指南.md`](docs/开发指南.md)。
