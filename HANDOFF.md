# Investment Tracker Server - Handoff

> 最后更新：2026-08-17（第二次更新）

## 项目概述

投资追踪 Web 应用，帮助用户记录和管理投资买入卖出记录。包含用户认证系统（注册/登录/JWT），支持多币种、手续费、税收、标签管理。前端为 React SPA，后端为 Rust Axum API 服务。

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Rust + Axum 0.7 + Tokio |
| 认证 | Argon2 密码哈希 + JWT (HS256, 7天有效期) |
| 存储 | 文件 JSON（`data.json` + `users.json`） |
| 前端 | React 18 + Vite 5 + TypeScript + TailwindCSS + Recharts + @dnd-kit |

## 项目结构

```
Investment Tracker Server/
├── src/                        # Rust 后端源码
│   ├── main.rs                 # 入口、路由组装、中间件
│   ├── lib.rs                  # 模块声明
│   ├── models.rs               # 数据模型（Asset/Transaction/Tag/User/Claims等）
│   ├── db.rs                   # AppState + 文件持久化
│   ├── auth.rs                 # 密码哈希 + JWT 生成/验证
│   ├── middleware.rs           # JWT 鉴权中间件
│   ├── error.rs                # AppError（NotFound/BadRequest/Internal/Unauthorized）
│   └── handlers/
│       ├── mod.rs              # 路由聚合
│       ├── auth.rs             # POST /api/auth/register, /api/auth/login
│       ├── assets.rs           # CRUD /api/assets
│       ├── transactions.rs     # CRUD /api/transactions
│       ├── tags.rs             # CRUD /api/tags
│       ├── summary.rs          # GET /api/summary
│       └── export_import.rs    # GET /api/export, POST /api/import
├── data/                       # 数据文件目录
│   ├── data.json               # 投资数据（资产/交易/标签）
│   └── users.json              # 用户数据（id/用户名/密码哈希）
├── web-frontend/               # React 前端
│   ├── src/
│   │   ├── App.tsx             # 路由 + AuthProvider
│   │   ├── context/AuthContext.tsx  # 认证上下文（login/register/logout）
│   │   ├── pages/              # Dashboard/Assets/Tags/Transactions/Login
│   │   ├── components/         # Sidebar/Layout/DataModal/KanbanCard
│   │   ├── lib/                # api.ts/utils.ts/dashboard-layout.ts
│   │   └── types/index.ts      # 类型定义
│   ├── package.json
│   └── vite.config.ts          # 代理 /api → localhost:8080
├── Cargo.toml
└── HANDOFF.md                  # 本文件
```

## 数据模型

### 核心实体

| 实体 | 说明 |
|------|------|
| Asset | 投资标的（名称、代码、类型、货币） |
| Transaction | 交易记录（买入/卖出/分红、价格、数量、手续费、税） |
| Tag | 标签（名称、分类、颜色） |
| AssetTag | 资产-标签多对多关联 |
| User | 用户（id、用户名、密码哈希） |

### 交易类型

- `buy` - 买入
- `sell` - 卖出
- `dividend` - 分红

### JSON 序列化兼容

所有模型使用 `#[serde(alias = "...")]` 兼容 camelCase 和 snake_case，支持与桌面 Tauri 应用的数据格式互转。

## API 端点

### 公开接口（无需认证）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| POST | `/api/auth/register | 注册（username/password/password_confirm） |
| POST | `/api/auth/login | 登录（username/password） |

### 受保护接口（需 Bearer <REDACTED>）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/assets` | 资产列表（含标签） |
| POST | `/api/assets` | 创建资产 |
| GET | `/api/assets/:id` | 资产详情 |
| PATCH | `/api/assets/:id` | 更新资产 |
| DELETE | `/api/assets/:id` | 删除资产 |
| GET | `/api/transactions` | 交易列表（支持过滤） |
| POST | `/api/transactions` | 创建交易 |
| PATCH | `/api/transactions/:id` | 更新交易 |
| DELETE | `/api/transactions/:id` | 删除交易 |
| GET | `/api/tags` | 标签列表 |
| POST | `/api/tags` | 创建标签 |
| PATCH | `/api/tags/:id` | 更新标签 |
| DELETE | `/api/tags/:id` | 删除标签 |
| POST | `/api/assets/:id/tags` | 资产添加标签 |
| DELETE | `/api/assets/:id/tags/:tagId` | 移除资产标签 |
| GET | `/api/summary` | 投资汇总统计 |
| GET | `/api/export` | 导出全部数据（JSON） |
| POST | `/api/import` | 导入数据（JSON） |

### 交易过滤查询参数

```
GET /api/transactions?assetId=1&type=buy&startDate=2024-01-01&endDate=2024-12-31
```

## 数据持久化

- 存储方式：JSON 文件
- 文件路径：`./data/data.json`（投资数据）+ `./data/users.json`（用户数据）
- 读写机制：`Arc<RwLock<Database>>` 内存存储，每次写操作后序列化到磁盘
- 序列号管理：`_seq` 字段记录 assets/transactions/tags 的自增 ID

## 启动方式

### 后端

```powershell
cd "E:\FN_Syn\Projects\Investment Tracker Server"
cargo run
# 服务监听 http://0.0.0.0:8080
```

### 前端

```powershell
cd "E:\FN_Syn\Projects\Investment Tracker Server\web-frontend"
npm run dev
# 访问 http://localhost:5173
```

### 生产构建前端

```powershell
cd "E:\FN_Syn\Projects\Investment Tracker Server\web-frontend"
npm run build
# 产物在 dist/，可用 vite preview 或任意静态服务器托管
```

## 已完成功能

### 后端
- [x] 用户注册/登录（Argon2 哈希 + JWT）
- [x] 密码验证（至少6字符，两次输入一致性检查）
- [x] 用户名唯一性检查（至少3字符）
- [x] JWT 鉴权中间件（保护 /api/assets 等业务接口）
- [x] 资产 CRUD + 标签关联
- [x] 交易 CRUD（买入/卖出/分红）
- [x] 标签 CRUD（分类+颜色）
- [x] 投资汇总统计（总投入/盈亏/持仓分布）
- [x] 数据导出/导入（JSON 格式）
- [x] 死锁修复（写锁作用域隔离，persist 前释放）

### 前端
- [x] 登录/注册页面（表单验证+错误提示）
- [x] 路由保护（未登录跳转 /login）
- [x] JWT 自动附加（axios 拦截器，已移至自定义实例）
- [x] 401 自动跳转登录页
- [x] Notion 风格看板 Dashboard（@dnd-kit 拖拽）
- [x] 7 种卡片类型（stats/chart-holdings/chart-type/chart-currency/chart-tags/recent-trades/holdings）
- [x] 图表类型切换（柱状/饼图/折线）
- [x] 交易表格列宽调整（双竖线手柄 + localStorage 持久化）
- [x] 数据导出（File System Access API 路径选择弹窗）
- [x] 数据导入（文件选择 + 全局刷新）
- [x] 深色模式（zinc 色系，localStorage 持久化，文本可读性优化）
- [x] 侧栏固定高度 + 用户信息显示 + 退出登录
- [x] 概览统计卡片 + 柱状图/饼图
- [x] 网页图标（使用桌面端 icon.svg）
- [x] DataModal 路由冲突修复（移出 Routes）

## 最近修复（2026-08-17）

| 问题 | 修复 |
|------|------|
| 登录后 401 | axios 拦截器从全局移至自定义实例 |
| 数据管理弹窗不响应 | DataModal 从 Route 中移出 |
| 深色模式文字难读 | 全局 CSS 覆盖 text-zinc-400/500/600 |
| 网页无图标 | 添加 icon.svg/favicon.ico |

## 已知限制

1. **数据存储**：单文件 JSON，不支持多用户数据隔离（所有用户共享同一 data.json）
2. **JWT 密钥**：硬编码 `investment-tracker-secret-key-change-in-production`，生产环境需改为环境变量
3. **无分页**：交易列表全量加载，数据量大时可能影响性能
4. **无汇率**：多货币场景未做汇率转换
5. **导入覆盖**：导入会覆盖当前用户所有数据，无合并选项

## 待办事项

- [ ] 用户数据隔离（每个用户独立的 data 文件）
- [ ] JWT 密钥从环境变量读取
- [ ] 交易列表分页
- [ ] 多货币汇率转换
- [ ] 数据导入合并策略
- [ ] 单元测试

## 常见问题

### 注册/登录返回 500
**原因**：后端未运行或崩溃。检查后端终端输出。

### 页面显示加载失败
**原因**：后端未启动。确认后端终端有 `Server listening on 0.0.0.0:8080`。

### 导入数据卡死
**原因**：后端死锁（已修复）。如果仍遇到，重启后端。

### 深色模式不生效
**原因**：检查 localStorage theme 值。Tailwind 配置 `darkMode: 'class'`。

## Git 历史

```
04eefb4 feat: 添加用户认证系统、深色模式优化、Web图标
b7fd8e4 feat: Web 前端与桌面端功能对齐
29c75eb feat: Web 前端完成 - 端到端验证通过
... (历史提交)
```

## 访问地址

- 前端：`http://localhost:5173`
- 后端 API：`http://127.0.0.1:8080`
- 健康检查：`http://127.0.0.1:8080/api/health`
