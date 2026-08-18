# Investment Tracker Server

个人投资追踪 Web 应用，记录买入/卖出/分红交易，支持多币种、手续费、标签管理和可视化统计。

## 功能特性

- **资产管理**：添加/编辑投资标的（股票、基金、ETF 等），支持代码、类型、币种，可按标签筛选
- **交易记录**：买入/卖出/分红，含价格、数量、手续费、税收、日期
- **标签系统**：预设系统标签（A股/港股/美股/基金/宽基指数）全局共享（只读）+ 自定义标签按用户独立
- **数据导出/导入**：JSON 格式备份与恢复，导出可选保存路径，导入自动创建备份
- **深色模式**：自动跟随系统 + 手动切换，优化可读性
- **看板仪表盘**：可拖拽的 Notion 风格看板，含统计卡片和图表（柱状/饼图/折线），饼图标签智能避让
- **用户认证**：注册/登录，JWT 鉴权（Argon2 密码哈希）
- **多用户隔离**：每用户独立数据（资产/交易/自定义标签），数据互不干扰
- **管理员系统**：用户管理、系统标签管理、密码修改
- **移动端适配**：响应式布局、汉堡菜单、表格横向滚动
- **中英切换**：界面语言实时切换（侧栏按钮），自动保存偏好

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Node.js + Fastify + TypeScript |
| 前端 | React 18 + Vite 5 + TypeScript + TailwindCSS + Recharts + @dnd-kit |
| 存储 | JSON 文件（每用户独立 `data-{userId}.json` + 系统标签 `system-tags.json`） |
| 认证 | Argon2 密码哈希 + JWT (HS256, 7天有效期) |

## 快速开始

### 前置要求

- [Node.js](https://nodejs.org/) (v20+)

### 启动后端

```bash
cd Investment-Tracker-Server

# 安装依赖
npm install

# 可选：设置 JWT 密钥（生产环境必须）
export JWT_SECRET="your-secret-key-here"

# 开发模式（自动重载）
npm run dev

# 或生产模式
npm run build && npm start
# 服务监听 http://0.0.0.0:8080
```

### 启动前端

```bash
cd Investment-Tracker-Server/web-frontend
npm install
npm run dev
# 访问 http://localhost:5173
```

### 生产构建

```bash
cd Investment-Tracker-Server/web-frontend
npm run build
# 产物在 dist/ 目录
```

## Docker 部署

### 前置要求

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2+)

### 快速启动

```bash
# 克隆项目
git clone https://github.com/HerrDanke/Investment-Tracker-Server.git
cd Investment-Tracker-Server

# 设置环境变量
echo "JWT_SECRET=$(openssl rand -hex 32)" > .env
echo "ADMIN_PASSWORD=$(openssl rand -hex 16)" >> .env

# 构建并启动
docker compose up -d --build

# 查看日志
docker compose logs -f
```

访问 `http://server-ip>:8080`

### 数据备份

```bash
# 备份数据卷
docker run --rm -v investment-tracker-server_investment-data:/data -v $(pwd):/backup alpine tar czf /backup/backup-$(date +%Y%m%d).tar.gz -C /data .

# 恢复数据
docker run --rm -v investment-tracker-server_investment-data:/data -v $(pwd):/backup alpine tar xzf /backup/backup-20260817.tar.gz -C /data
```

### 配置

| 环境变量 | 默认值 | 说明 |
|----------|--------|------|
| `PORT` | `8080` | 服务端口 |
| `JWT_SECRET` | 无默认值（必须设置） | JWT 签名密钥，**生产环境必须修改** |
| `ADMIN_USERNAME` | `admin` | 管理员用户名 |
| `ADMIN_PASSWORD` | `admin123` | 管理员密码，**生产环境必须修改** |
| `DATA_DIR` | `/app/data` | 数据目录 |
| `CORS_ORIGINS` | 空（允许所有） | 逗号分隔的允许来源，生产环境建议设置 |
| `LOG_LEVEL` | `info` | 日志级别 |

## 使用说明

1. **注册账户**：首次使用点击注册，输入用户名（≥3字符）和密码（≥6字符）
2. **添加资产**：在「资产」页面添加投资标的，如「沪深300ETF」
3. **添加标签**：在「标签」页面管理系统预设标签和自定义标签
4. **记录交易**：在「交易」页面添加买入/卖出/分红记录
5. **查看概览**：在「概览」页面查看统计数据和图表
6. **数据管理**：侧栏「数据管理」按钮可导出/导入数据备份
7. **修改密码**：侧栏「修改密码」可修改自己的密码
8. **用户管理**（管理员）：侧栏「用户管理」可管理用户和系统标签

## API 文档

启动后端后访问 `http://localhost:8080/` 查看完整 API 列表。

### 公开接口（无需认证）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |

### 用户接口（需 Bearer <REDACTED>）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/change-password` | 修改自己的密码（旧密码 + 两次新密码） |
| GET | `/api/assets` | 资产列表（含标签） |
| POST | `/api/assets` | 创建资产 |
| GET | `/api/assets/:id` | 资产详情 |
| PATCH | `/api/assets/:id` | 更新资产 |
| DELETE | `/api/assets/:id` | 删除资产 |
| POST | `/api/assets/:id/tags` | 为资产添加标签 |
| DELETE | `/api/assets/:id/tags/:tagId` | 移除资产标签 |
| GET | `/api/transactions` | 交易列表（支持 `asset_id`/`txn_type`/`start_date`/`end_date` 过滤） |
| POST | `/api/transactions` | 创建交易 |
| GET | `/api/transactions/:id` | 交易详情 |
| PATCH | `/api/transactions/:id` | 更新交易 |
| DELETE | `/api/transactions/:id` | 删除交易 |
| GET | `/api/tags` | 标签列表（系统标签 + 自定义标签） |
| POST | `/api/tags` | 创建自定义标签 |
| PATCH | `/api/tags/:id` | 更新自定义标签（系统标签不可修改） |
| DELETE | `/api/tags/:id` | 删除自定义标签（系统标签不可删除） |
| GET | `/api/summary` | 投资汇总统计 |
| GET | `/api/export` | 导出全部数据（当前用户） |
| POST | `/api/import` | 导入数据（当前用户，最大 10MB） |

### 管理员接口（需管理员 Bearer <REDACTED>）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/me` | 检查当前用户是否管理员 |
| GET | `/api/admin/users` | 用户列表 |
| DELETE | `/api/admin/users/:id` | 删除用户及其数据 |
| GET | `/api/admin/users/:id/data` | 导出指定用户数据 |
| GET | `/api/admin/system-tags` | 系统标签列表 |
| POST | `/api/admin/system-tags` | 创建系统标签 |
| PATCH | `/api/admin/system-tags/:id` | 更新系统标签 |
| DELETE | `/api/admin/system-tags/:id` | 删除系统标签 |

## 与桌面版的关系

本项目与桌面版 Tauri 应用共享数据格式。桌面版导出的 JSON 文件可直接导入 Web 版（当前用户），反之亦然。

## 安全特性

- **密码安全**：Argon2id 密码哈希（抗 GPU 破解）
- **JWT 安全**：HS256 算法 + 7 天过期 + 环境变量密钥（无默认值）
- **输入验证**：交易价格、数量、手续费等参数校验
- **多用户隔离**：每用户独立数据文件，物理隔离
- **管理员保护**：管理员账户不可删除
- **导入限制**：10MB 大小限制 + 数据量合理性检查 + 自动备份
- **CORS 控制**：支持白名单限制跨域来源

## 已知限制

- 单文件 JSON 存储，每用户独立数据文件
- 无汇率换算功能
- 数据导入为覆盖模式，无合并选项

## License

MIT
