# Investment Tracker Server - Handoff

> 最后更新：2026-08-18（第十二次更新 — 中英切换完整落地）

## 项目概述

投资追踪 Web 应用，帮助用户记录和管理投资买入卖出记录。包含用户认证系统（注册/登录/JWT），支持多币种、手续费、税收、标签管理。前端为 React SPA，后端为 Node.js Fastify API 服务。

**核心特性**：多用户数据隔离（每用户独立数据）、管理员系统、系统标签全局共享。

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Node.js + Fastify + TypeScript |
| 认证 | Argon2 密码哈希 + JWT (HS256, 7天有效期) |
| 存储 | 文件 JSON（每用户 `data-{userId}.json` + 系统标签 `system-tags.json`） |
| 前端 | React 18 + Vite 5 + TypeScript + TailwindCSS + Recharts + @dnd-kit |

## 项目结构

```
Investment Tracker Server/
├── .gitignore
├── .dockerignore
├── .env.example
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
│   ├── db.ts                 # 数据库层：多用户隔离、系统标签、管理员
│   ├── plugins/
│   │   └── auth.ts           # JWT 认证插件
│   └── routes/
│       ├── auth.ts           # 注册/登录/修改密码
│       ├── assets.ts         # 资产 CRUD + 标签
│       ├── transactions.ts   # 交易 CRUD + 过滤
│       ├── tags.ts           # 标签 CRUD（混合模型）
│       ├── summary.ts        # 投资汇总统计
│       ├── export-import.ts  # 数据导出导入
│       └── admin.ts          # 管理员接口
├── data/                     # 数据文件目录（运行时生成）
│   ├── users.json            # 用户列表
│   ├── system-tags.json      # 全局系统标签
│   └── data-{userId}.json    # 每用户独立数据
├── web-frontend/             # React 前端
│   ├── src/
│   │   ├── pages/            # 页面（含 Password.tsx、Users.tsx）
│   │   ├── components/       # 组件（含 Sidebar.tsx）
│   │   ├── context/          # AuthContext（含 isAdmin 状态）
│   │   └── lib/              # API 客户端（含 adminApi、passwordApi）
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
| Tag | 标签（名称、分类、颜色）。`category: "system"` 全局共享，`"custom"` 按用户 |
| AssetTag | 资产-标签多对多关联 |
| User | 用户（id、用户名、密码哈希） |

### 多用户隔离

- 每用户独立数据文件 `data-{userId}.json`
- 资产、交易、自定义标签按用户隔离
- 系统标签（`system-tags.json`）全局共享，只读
- 路由通过 `request.user.sub`（JWT 用户 ID）获取用户专属数据库

### 交易类型

- `buy` - 买入
- `sell` - 卖出
- `dividend` - 分红

## API 端点

### 公开接口（无需认证）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| POST | `/api/auth/register` | 注册（username/password/password_confirm） |
| POST | `/api/auth/login` | 登录（username/password） |

### 用户接口（需 Bearer <REDACTED>）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/change-password` | 修改自己的密码 |
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
| GET | `/api/tags` | 标签列表（系统 + 自定义） |
| POST | `/api/tags` | 创建自定义标签 |
| PATCH | `/api/tags/:id` | 更新自定义标签 |
| DELETE | `/api/tags/:id` | 删除自定义标签 |
| GET | `/api/summary` | 投资汇总统计 |
| GET | `/api/export` | 导出当前用户数据（JSON） |
| POST | `/api/import` | 导入当前用户数据（JSON） |

### 管理员接口（需管理员 Bearer <REDACTED>）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/me` | 检查是否管理员 |
| GET | `/api/admin/users` | 用户列表 |
| DELETE | `/api/admin/users/:id` | 删除用户及数据 |
| GET | `/api/admin/users/:id/data` | 导出指定用户数据 |
| GET | `/api/admin/system-tags` | 系统标签列表 |
| POST | `/api/admin/system-tags` | 创建系统标签 |
| PATCH | `/api/admin/system-tags/:id` | 更新系统标签 |
| DELETE | `/api/admin/system-tags/:id` | 删除系统标签 |

## 数据持久化

- **存储方式**：JSON 文件
- **文件路径**：
  - `./data/users.json` — 用户列表
  - `./data/system-tags.json` — 全局系统标签
  - `./data/data-{userId}.json` — 每用户独立数据
- **读写机制**：内存缓存 + 写队列（Promise 链式序列化），原子写入（temp file + rename）
- **序列号管理**：每用户独立 `_seq` 字段记录自增 ID
- **导入备份**：导入前自动创建 `data-{userId}-backup-{timestamp}.json`，每用户保留最近 5 份

## 管理员系统

- 管理员通过 `ADMIN_USERNAME` 环境变量确定（默认 `admin`）
- 未配置时首个注册用户为管理员
- 管理员账户不可删除（UI 隐藏删除按钮 + 后端保护）
- 管理员可管理用户、系统标签
- 所有用户可修改自己的密码
- 默认管理员仅在 `ADMIN_PASSWORD` 设置时创建，已存在的管理员密码不会被覆盖
- 系统标签全局共享、只读，UI 隐藏编辑/删除按钮

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
- [x] 密码修改（验证旧密码）
- [x] 用户名唯一性检查（至少3字符）
- [x] JWT 认证插件（保护 /api/assets 等业务接口）
- [x] 资产 CRUD + 标签关联
- [x] 交易 CRUD（买入/卖出/分红）
- [x] 标签 CRUD（系统标签共享 + 自定义标签隔离）
- [x] 投资汇总统计（总投入/盈亏/持仓分布）
- [x] 数据导出/导入（JSON 格式，按用户）
- [x] 多用户数据隔离（每用户独立文件）
- [x] 管理员系统（用户管理、系统标签管理）
- [x] 管理员账户保护（不可删除）

### 前端
- [x] 登录/注册页面（表单验证+错误提示）
- [x] 路由保护（未登录跳转 /login）
- [x] JWT 自动附加（axios 拦截器，自定义实例）
- [x] 401 自动跳转登录页
- [x] Notion 风格看板 Dashboard（@dnd-kit 拖拽）
- [x] 7 种卡片类型（stats/chart-holdings/chart-type/chart-currency/chart-tags/recent-trades/holdings）
- [x] 图表类型切换（柱状/饼图/折线）
- [x] 交易表格列宽调整
- [x] 资产标签筛选
- [x] 数据导出/导入
- [x] 深色模式（zinc 色系，localStorage 持久化）
- [x] 侧栏固定高度 + 用户信息显示 + 退出登录
- [x] 概览统计卡片 + 柱状图/饼图
- [x] ErrorBoundary 错误边界
- [x] 密码修改页面（所有用户）
- [x] 管理员用户管理页面（用户列表、导出、删除）
- [x] 侧栏「修改密码」和「用户管理」入口
- [x] AuthContext isAdmin 状态管理
- [x] 系统标签 UI 保护（隐藏编辑/删除按钮，显示「系统」标识）
- [x] 移动端适配（响应式侧边栏、汉堡菜单、表格滚动、看板单列）
- [x] 交易页移动端卡片布局（避免列宽问题）
- [x] 看板卡片标题居中、拖拽手柄增大
- [x] 移动端导航栏遮挡修复
- [x] 中英切换功能（完整落地：所有页面 + 卡片组件 + 工具函数）

## Docker 部署（2026-08-18 更新）

- **多阶段 Dockerfile**：Node 20 构建前端 → Node 20 编译后端 → Node 20 运行
- **docker-compose.yml**：环境变量 + 命名数据卷 + 健康检查 + 自动重启
- **端口**：8080（可通过 `PORT` 环境变量映射）
- **数据持久化**：命名卷 `investment-data` 挂载到 `/app/data`
- **管理员配置**：`ADMIN_USERNAME`（默认 admin）+ `ADMIN_PASSWORD`（默认 admin123）

### 快速启动命令

```bash
git clone https://github.com/HerrDanke/Investment-Tracker-Server.git
cd Investment-Tracker-Server
echo "JWT_SECRET=$(openssl rand -hex 32)" > .env
echo "ADMIN_PASSWORD=$(openssl rand -hex 16)" >> .env
docker compose up -d --build
```

### 数据备份

```bash
docker run --rm -v investment-tracker-server_investment-data:/data -v $(pwd):/backup alpine tar czf /backup/backup-$(date +%Y%m%d).tar.gz -C /data .
```

## 已知限制

1. **无分页**：交易列表全量加载，数据量大时可能影响性能
2. **无汇率**：多货币场景未做汇率转换
3. **导入覆盖**：导入会覆盖当前用户数据（自动创建备份，保留最近 5 份）

## 待办事项

- [ ] 交易列表分页
- [ ] 多货币汇率转换
- [ ] 数据导入合并策略
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

### 看不到「用户管理」入口
**原因**：你不是管理员。管理员由 `ADMIN_USERNAME` 环境变量决定，未设置时首个注册用户是管理员。

### 管理员密码被重置
**原因**：每次启动会确保默认管理员存在。已存在的管理员密码**不会**被覆盖（已修复）。生产环境请设置 `ADMIN_PASSWORD`。

### 系统标签可以编辑/删除吗？
**答**：不可以。系统标签全局共享、只读。UI 隐藏了编辑/删除按钮，后端也会返回 403。只有管理员可以通过 `/api/admin/system-tags` 管理系统标签。

## Git 历史

```
54f53c8 feat: 中英切换功能完整落地（所有页面翻译）
028d3a0 docs: 更新 README 和 HANDOFF 文档
99ae665 feat: 中英切换功能（i18n 基础设施 + 登录页）
73710ca docs: 更新 README 和 HANDOFF 文档
6835265 fix: 修复移动端导航栏遮挡内容问题
b29fa9f fix: 看板卡片标题居中，增大拖拽手柄
ba523c8 fix: 交易页面移动端改为卡片布局
50a2ba5 docs: 更新 README 和 HANDOFF 文档
b679f62 feat: 前端移动端适配
6e30499 docs: 更新 README 和 HANDOFF 文档
2883d06 fix: 隐藏系统标签的编辑/删除按钮，显示「系统」标识
4151ff3 docs: 更新 README 和 HANDOFF 文档
576fb8c fix: 修复 listUsers API 类型定义
623bcac fix: 隐藏管理员账户的删除按钮
3d6b17a feat: 添加密码修改功能
dee4359 fix: 设置默认管理员密码为 admin123
d1c0fab fix: 修复管理员功能多个 bug
a49cdc8 fix: docker-compose 显式配置 ADMIN_USERNAME/PASSWORD
66f2636 feat: 添加前端管理员用户管理界面
da76fd7 feat: 添加默认管理员账户 admin/admin123
0d4ce98 feat: 添加管理员系统，支持用户管理和系统标签管理
3367b51 feat: 按用户隔离数据，每用户独立数据文件
04eefb4 feat: 添加用户认证系统、深色模式优化、Web图标
b7fd8e4 feat: Web 前端与桌面端功能对齐
29c75eb feat: Web 前端完成 - 端到端验证通过
```

## 访问地址

- 前端：`http://localhost:5173`
- 后端 API：`http://127.0.0.1:8080`
- 健康检查：`http://127.0.0.1:8080/api/health`
