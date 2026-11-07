# 药膳智养 · 后端服务

Spring Boot 3 + MyBatis-Plus + MySQL 8 + JWT 的慢性病食疗管理平台后端，与 `../` 前端完全对接。

## 技术栈

| 组件 | 版本 | 说明 |
| --- | --- | --- |
| JDK | 17+ | 已在 JDK 25 上验证 |
| Spring Boot | 3.3.5 | Web / Security / Validation |
| MyBatis-Plus | 3.5.7 | 单表 CRUD + 分页插件 |
| MySQL | 8.0 | 主数据库（H2 profile 可免安装试跑） |
| JWT (jjwt) | 0.12.6 | 无状态鉴权 |
| BCrypt | — | 密码加密存储 |

## 目录结构

```
backend/
├─ pom.xml
├─ sql/
│  ├─ schema.sql             MySQL 建库建表脚本
│  └─ data.sql               种子数据（自动生成）
├─ .work/
│  └─ gen-data.mjs           种子数据生成器（改数据后重新生成）
└─ src/main/
   ├─ java/com/shiliao/
   │  ├─ ShiliaoApplication.java   启动类
   │  ├─ common/                   统一响应 R、分页、异常处理、字段转换
   │  ├─ config/                   MyBatis-Plus 分页 + 方法级权限
   │  ├─ security/                 安全配置、JWT 工具、过滤器、登录态
   │  ├─ controller/               7 个 REST 控制器
   │  ├─ service/                  业务逻辑
   │  ├─ repository/               MyBatis-Plus Mapper
   │  ├─ entity/                   数据库实体
   │  └─ dto/                      请求/响应视图对象
   └─ resources/
      ├─ application.yml           MySQL 配置（默认）
      ├─ application-h2.yml        H2 免安装配置
      └─ db/                       H2 建表与数据脚本
```

## 快速启动

### 方式一：MySQL（推荐，默认配置）

```bash
# 1. 建库建表并导入种子数据
mysql -u root -p < sql/schema.sql
mysql -u root -p shiliao < sql/data.sql

# 2. 按需修改数据库连接（或用环境变量覆盖）
#    DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD

# 3. 启动
mvn spring-boot:run
```

### 方式二：H2 内存库（免安装 MySQL，开箱即跑）

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=h2
```

启动后访问 <http://localhost:8080/api/auth/login> 即可，数据随进程销毁自动清空（每次重建）。

### 打包部署

```bash
mvn clean package -DskipTests
java -jar target/shiliao-backend-1.0.0.jar --spring.profiles.active=h2
```

## 演示账号

| 账号 | 密码 | 角色 |
| --- | --- | --- |
| `admin` | `123456` | 超级管理员 |
| `doctor` | `123456` | 健康管理师 |
| `user` | `123456` | 普通用户 |

## API 一览

统一响应：`{ "code": 200, "message": "success", "data": ... }`
鉴权：`Authorization: Bearer <token>`（除登录外全部需要）

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | 公开 | 登录，返回 token + 用户信息 |
| GET | `/api/auth/me` | 登录 | 当前用户与权限列表 |
| GET | `/api/roles` | 登录 | 角色列表 |
| PUT | `/api/roles/{id}/permissions` | 登录 | 修改角色权限（admin 角色锁定） |
| GET | `/api/logs` | 登录 | 审计日志分页 |
| GET | `/api/users` | `user:view` | 用户分页（keyword/roleKey/status） |
| POST | `/api/users` | `user:manage` | 新增用户 |
| PUT | `/api/users/{id}` | `user:manage` | 修改用户 |
| DELETE | `/api/users/{id}` | `user:manage` | 删除用户 |
| GET | `/api/ingredients` | `ingredient:view` | 食材分页（keyword/category/status） |
| POST | `/api/ingredients` | `ingredient:manage` | 新增/修改食材 |
| DELETE | `/api/ingredients/{id}` | `ingredient:manage` | 删除食材 |
| GET | `/api/recipes` | `recipe:view` | 食谱分页（keyword/category/status） |
| POST | `/api/recipes` | `recipe:manage` | 新增/修改食谱 |
| DELETE | `/api/recipes/{id}` | `recipe:manage` | 删除食谱 |
| GET | `/api/meals` | `meal:view` | 用餐记录分页 |
| GET | `/api/profiles` | `health:view` | 健康档案（自动计算 BMI 与关注标记） |
| PUT | `/api/profiles/{userId}` | `health:manage` | 更新体检指标 |
| GET | `/api/plans` | `plan:manage` | 慢病方案列表 |
| PUT | `/api/plans/{key}` | `plan:manage` | 更新慢病方案 |

分页响应结构：

```json
{ "items": [], "total": 44, "page": 1, "pageSize": 10 }
```

### 调用示例

```bash
# 登录
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'

# 携带 token 查询用户
curl "http://localhost:8080/api/users?page=1&pageSize=10&keyword=王" \
  -H "Authorization: Bearer <token>"
```

## 安全设计

1. **密码**：BCrypt 加盐哈希存储，数据库不保存明文
2. **鉴权**：无状态 JWT，默认 8 小时过期；过滤器每次请求校验用户状态
3. **授权**：`@PreAuthorize("hasAuthority('user:manage')")` 方法级权限，与前端权限码完全一致
4. **审计**：登录、增删改、导出等关键操作写入 `audit_log`
5. **CORS**：开发期放开所有来源，生产请改为具体域名

## 修改种子数据

种子数据由 `backend/.work/gen-data.mjs` 生成，保证与前端演示数据一致：

```bash
node backend/.work/gen-data.mjs
```

会同时更新 `sql/data.sql`（MySQL）与 `src/main/resources/db/data-h2.sql`（H2）。
