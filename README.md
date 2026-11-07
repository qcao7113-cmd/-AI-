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
| 前端框架 | React 18 + TypeScript |
| 构建 | Vite 5 |
| 路由 | React Router v6 |
| 样式 | 原生 CSS + CSS 变量（无 UI 框架依赖） |
| 图表 | 手写 SVG |
| 后端 | Spring Boot 3.3 + MyBatis-Plus + MySQL 8 |
| 鉴权 | JWT（jjwt）+ BCrypt + 方法级权限 |

## 后端

后端代码在 [`backend/`](backend/)，接口与前端完全对齐。

```bash
cd backend

# 方式一：MySQL
mysql -u root -p < sql/schema.sql
mysql -u root -p shiliao < sql/data.sql
mvn spring-boot:run

# 方式二：H2 内存库，免安装 MySQL
mvn spring-boot:run -Dspring-boot.run.profiles=h2
```

后端启动在 <http://localhost:8080>，详见 [backend/README.md](backend/README.md)。

## 前后端联调

前端默认使用**本地模拟数据**（`src/lib/api.ts`），无需后端即可演示。
要切换到真实后端：

```bash
# 项目根目录创建 .env.local（可参考 .env.example）
VITE_USE_MOCK=false
VITE_API_BASE=http://localhost:8080

npm run dev
```

切换开关在 `src/lib/data.ts`，页面代码无需任何改动——这正是数据层抽象的目的。

## 目录结构补充

除上文 `src/` 分层外，后端结构：

```
backend/
├─ pom.xml
├─ sql/                       MySQL 建表 + 种子数据
├─ src/main/java/com/shiliao/
│  ├─ common/                 统一响应、异常处理、字段转换
│  ├─ config/                 MyBatis-Plus 分页 + 方法级权限
│  ├─ security/               JWT 过滤器、安全配置、登录态
│  ├─ controller/             7 个 REST 控制器
│  ├─ service/                业务逻辑
│  ├─ repository/             MyBatis-Plus Mapper
│  ├─ entity/                 数据库实体
│  └─ dto/                    请求/响应视图
└─ src/main/resources/
   ├─ application.yml         MySQL 配置（默认）
   ├─ application-h2.yml      H2 免安装配置
   └─ db/                     H2 建表与种子数据
```

## 接入真实后端（补充说明）

前端已内置真实 API 客户端 `src/lib/http.ts`，与 `src/lib/api.ts` 函数签名完全一致。
`src/lib/data.ts` 根据 `VITE_USE_MOCK` 自动选择实现，因此：

- 想继续用模拟数据 → 不配置 `.env.local`
- 想接 Spring Boot → 设置 `VITE_USE_MOCK=false`

更多约定见 [`docs/开发指南.md`](docs/开发指南.md)。
