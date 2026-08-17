# Investment Tracker Server - Handoff

> 最后更新：2026-08-17（第五次更新 — 代码审查修复 + Docker 优化）

## 项目概述

投资追踪 Web 应用，帮助用户记录和管理投资买入卖出记录。包含用户认证系统（注册/登录/JWT），支持多币种、手续费、税收、标签管理。前端为 React SPA，后端为 Node.js Fastify API 服务。

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Node.js + Fastify + TypeScript |
| 认证 | Argon2 密码哈希 + JWT (HS256, 7天有效期) |
| 存储 | 文件 JSON（`data.json` + `users.json`） |
| 前端 | React 18 + Vite 5 + TypeScript + TailwindCSS + Recharts + @dnd-kit |

## 项目结构

```
Investment Tracker Server/
├── .gitignore
├── .dockerignore
├── README.md
├── HANDOFF.md
├── DEPLOY.md
├── Dockerfile
├── docker-compose.yml
├── package.json
├── package-lock.json
├── tsconfig.json
├── src/
│   ├── index.ts              # 入口：Fastify 服务启动
│   ├── types.ts              # TypeScript 类型定义
│   ├── db.ts                 # 数据库层：JSON 文件读写
│   ├── plugins/
│   │   └── auth.ts           # JWT 认证插件
│   └── routes/
│       ├── auth.ts           # 注册/登录
│       ├── assets.ts         # 资产 CRUD + 标签
│       ├── transactions.ts   # 交易 CRUD + 过滤
│       ├── tags.ts           # 标签 CRUD
│       ├── summary.ts        # 投资汇总统计
│       └── export-import.ts  # 数据导出导入
├── data/                     # 数据文件目录
│   ├── data.json             # 投资数据
│   └── users.json            # 用户数据
├── web-frontend/             # React 前端
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
└── scripts/
    ├── build.ps1
    └── deploy.sh
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
| POST | `/api/assets/:id/tags` | 资产添加标签 |
| DELETE | `/api/assets/:id/tags/:tagId` | 移除资产标签 |
| GET | `/api/transactions` | 交易列表（支持过滤） |
| POST | `/api/transactions` | 创建交易 |
| GET | `/api/transactions/:id` | 交易详情 |
| PATCH | `/api/transactions/:id` | 更新交易 |
| DELETE | `/api/transactions/:id` | 删除交易 |
| GET | `/api/tags` | 标签列表 |
| POST | `/api/tags` | 创建标签 |
| PATCH | `/api/tags/:id` | 更新标签 |
| DELETE | `/api/tags/:id` | 删除标签 |
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
- 读写机制：内存存储 + 写队列（Promise 链式序列化），原子写入（temp file + rename）
- 序列号管理：`_seq` 字段记录 assets/transactions/tags 的自增 ID
- 导入备份：导入前自动创建 `data-backup-<timestamp>.json`，保留最近 5 份

## 启动方式

### 后端

```bash
cd Investment-Tracker-Server
npm install
npm run dev      # 开发模式（tsx watch）
# 或
npm run build && npm start  # 生产模式
# 服务监听 http://0.0.0.0:8080
```

### 前端

```bash
cd Investment-Tracker-Server/web-frontend
npm run dev
# 访问 http://localhost:5173
```

### 生产构建前端

```bash
cd Investment-Tracker-Server/web-frontend
npm run build
# 产物在 dist/，可用 vite preview 或任意静态服务器托管
```

## 已完成功能

### 后端
- [x] 用户注册/登录（Argon2 哈希 + JWT）
- [x] 密码验证（至少6字符，两次输入一致性检查）
- [x] 用户名唯一性检查（至少3字符）
- [x] JWT 认证插件（保护 /api/assets 等业务接口）
- [x] 资产 CRUD + 标签关联
- [x] 交易 CRUD（买入/卖出/分红）
- [x] 标签 CRUD（分类+颜色）
- [x] 投资汇总统计（总投入/盈亏/持仓分布）
- [x] 数据导出/导入（JSON 格式）

### 前端
- [x] 登录/注册页面（表单验证+错误提示）
- [x] 路由保护（未登录跳转 /login）
- [x] JWT 自动附加（axios 拦截器，自定义实例）
- [x] 401 自动跳转登录页（客户端路由导航）
- [x] Notion 风格看板 Dashboard（@dnd-kit 拖拽）
- [x] 7 种卡片类型（stats/chart-holdings/chart-type/chart-currency/chart-tags/recent-trades/holdings）
- [x] 图表类型切换（柱状/饼图/折线）
- [x] 交易表格列宽调整（双竖线手柄 + localStorage 持久化 + cleanup）
- [x] 数据导出（File System Access API 路径选择弹窗）
- [x] 数据导入（文件选择 + 全局刷新，单次 JSON 解析）
- [x] 深色模式（zinc 色系，localStorage 持久化，文本可读性优化）
- [x] 侧栏固定高度 + 用户信息显示 + 退出登录
- [x] 概览统计卡片 + 柱状图/饼图
- [x] 网页图标（使用桌面端 icon.svg）
- [x] DataModal 路由冲突修复（移出 Routes）
- [x] ErrorBoundary 错误边界（全局渲染异常捕获）
- [x] AuthContext useMemo 优化（避免无意义重渲染）

## 最近修复（2026-08-17）

### 代码审查修复
- JWT_SECRET 移除硬编码默认值，必须通过环境变量设置
- CORS 改为白名单模式（`CORS_ORIGINS` 环境变量）
- 导入数据前自动创建备份（保留最近 5 份）
- 持久化函数增加错误处理
- 移除未使用的 `TransactionQuery` 导入
- txn_type 统一小写（移除大写兼容）
- 添加 `pino-pretty` 依赖到 package.json
- 更新 `deploy.sh` 适配 Node.js（移除 Rust/Cargo 命令）
- 更新 `.gitignore` 排除 Rust 旧文件和数据文件
- 添加 `.env.example` 环境变量模板

### Docker 修复
- Node 18 → Node 20（`toad-cache` 等依赖要求 >=20）
- `package-lock.json` 同步更新（添加 pino-pretty）
- `JWT_SECRET` 类型错误修复（TypeScript 类型收窄）

### 前端修复
- 交易列表排序时 date 字段为空导致崩溃 → 添加空值保护
- 交易表格列宽调整手柄改为绝对定位在列右侧边缘
- 操作列固定右侧（sticky right-0）
- 去掉操作列左侧边框线

## Docker 部署（2026-08-17 更新）

- **多阶段 Dockerfile**：Node 20 构建前端 → Node 20 编译后端 → Node 20 运行
- **docker-compose.yml**：环境变量 + 命名数据卷 + 健康检查 + 自动重启
- **端口**：8080（可通过 `PORT` 环境变量映射）
- **数据持久化**：命名卷 `investment-data` 挂载到 `/app/data`
- **.dockerignore**：排除 dist/node_modules/data 等
- **镜像大小**：约 150-200MB（含 Node.js 20 运行时）

### 快速启动命令

```bash
git clone https://github.com/HerrDanke/Investment-Tracker-Server.git
cd Investment-Tracker-Server
echo "JWT_SECRET=$(openssl rand -hex 32)" > .env
docker compose up -d --build
```

### 数据备份

```bash
docker run --rm -v investment-tracker-server_investment-data:/data -v $(pwd):/backup alpine tar czf /backup/backup-$(date +%Y%m%d).tar.gz -C /data .

## 已知限制

1. **数据存储**：单文件 JSON，不支持多用户数据隔离（所有用户共享同一 data.json）
2. **无分页**：交易列表全量加载，数据量大时可能影响性能
3. **无汇率**：多货币场景未做汇率转换
4. **导入覆盖**：导入会覆盖当前数据（自动创建备份，保留最近 5 份）
5. **移动端适配**：侧边栏不可折叠，小屏体验待优化

## 待办事项

- [ ] 用户数据隔离（每个用户独立的 data 文件）
- [ ] JWT 密钥从环境变量读取（已支持，文档需更新）
- [ ] 交易列表分页
- [ ] 多货币汇率转换
- [ ] 数据导入合并策略
- [ ] 移动端响应式适配
- [ ] 单元测试
- [ ] 可访问性（ARIA、键盘导航）

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
