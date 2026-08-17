# Investment Tracker Server

个人投资追踪 Web 应用，记录买入/卖出/分红交易，支持多币种、手续费、标签管理和可视化统计。

## 功能特性

- **资产管理**：添加/编辑投资标的（股票、基金、ETF 等），支持代码、类型、币种
- **交易记录**：买入/卖出/分红，含价格、数量、手续费、税收、日期
- **标签系统**：预设标签（A股/港股/美股/基金/宽基指数）+ 自定义标签，支持分类和颜色
- **数据导出/导入**：JSON 格式备份与恢复，导出可选保存路径
- **深色模式**：自动跟随系统 + 手动切换，优化可读性
- **看板仪表盘**：可拖拽的 Notion 风格看板，含统计卡片和图表（柱状/饼图/折线）
- **用户认证**：注册/登录，JWT 鉴权（Argon2 密码哈希）

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Rust + Axum 0.7 + Tokio |
| 前端 | React 18 + Vite 5 + TypeScript + TailwindCSS + Recharts + @dnd-kit |
| 存储 | JSON 文件（`data.json` + `users.json`） |
| 认证 | Argon2 密码哈希 + JWT (HS256, 7天有效期) |

## 快速开始

### 前置要求

- [Rust](https://rustup.rs/) (2021 edition)
- [Node.js](https://nodejs.org/) (v18+)

### 启动后端

```bash
cd Investment-Tracker-Server

# 可选：设置 JWT 密钥（生产环境必须）
export JWT_SECRET="your-secret-key-here"

cargo run
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

# 设置生产环境 JWT 密钥
echo "JWT_SECRET=$(openssl rand -hex 32)" > .env

# 构建并启动
docker compose up -d --build

# 查看日志
docker compose logs -f
```

访问 `http://<server-ip>:8080`

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
| `JWT_SECRET` | 硬编码默认值 | **生产环境必须修改** |
| `DATA_DIR` | `/app/data` | 数据目录 |
| `RUST_LOG` | `info` | 日志级别 |

## 使用说明

1. **注册账户**：首次使用点击注册，输入用户名（≥3字符）和密码（≥6字符）
2. **添加资产**：在「资产」页面添加投资标的，如「沪深300ETF」
3. **添加标签**：在「标签」页面管理预设和自定义标签
4. **记录交易**：在「交易」页面添加买入/卖出/分红记录
5. **查看概览**：在「概览」页面查看统计数据和图表
6. **数据管理**：侧栏「数据管理」按钮可导出/导入数据备份

## API 文档

启动后端后访问 `http://localhost:8080/` 查看完整 API 列表。

### 公开接口（无需认证）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |

### 受保护接口（需 Bearer <REDACTED>）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/assets` | 资产列表 |
| POST | `/api/assets` | 创建资产 |
| GET/DELETE | `/api/assets/:id/tags/:tagId` | 添加/移除资产标签 |
| GET | `/api/transactions` | 交易列表（支持 `assetId`/`type`/`startDate`/`endDate` 过滤） |
| POST | `/api/transactions` | 创建交易 |
| GET | `/api/tags` | 标签列表 |
| POST | `/api/tags` | 创建标签 |
| GET | `/api/summary` | 投资汇总统计 |
| GET | `/api/export` | 导出全部数据 |
| POST | `/api/import` | 导入数据（最大 10MB） |

## 配置

| 环境变量 | 默认值 | 说明 |
|----------|--------|------|
| `JWT_SECRET` | `investment-tracker-secret-key-change-in-production` | JWT 签名密钥，**生产环境必须修改** |

## 与桌面版的关系

本项目与桌面版 Tauri 应用共享数据格式。桌面版导出的 JSON 文件可直接导入 Web 版，反之亦然。

## 安全特性

- **密码安全**：Argon2id 密码哈希（抗 GPU 破解）
- **JWT 安全**：HS256 算法 + 7 天过期 + 明确算法验证
- **输入验证**：交易价格、数量、手续费等参数校验
- **错误处理**：内部错误不暴露详细信息给客户端
- **导入限制**：10MB 大小限制 + 数据量合理性检查

## 已知限制

- 单文件 JSON 存储，所有用户共享同一数据文件（无数据隔离）
- 无汇率换算功能
- 数据导入为覆盖模式，无合并选项
- 移动端适配待完善

## License

MIT
