# Investment Tracker Server

个人投资追踪 Web 应用，记录买入/卖出/分红交易，支持多币种、手续费、标签管理和可视化统计。

## 功能特性

- **资产管理**：添加/编辑投资标的（股票、基金、ETF 等），支持代码、类型、币种
- **交易记录**：买入/卖出/分红，含价格、数量、手续费、税收、日期
- **标签系统**：预设标签（A股/港股/美股/基金/宽基指数）+ 自定义标签，支持分类和颜色
- **数据导出/导入**：JSON 格式备份与恢复，导出可选保存路径
- **深色模式**：自动跟随系统 + 手动切换，优化可读性
- **看板仪表盘**：可拖拽的 Notion 风格看板，含统计卡片和图表（柱状/饼图/折线）
- **用户认证**：注册/登录，JWT 鉴权

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Rust + Axum 0.7 + Tokio |
| 前端 | React 18 + Vite 5 + TypeScript + TailwindCSS + Recharts + @dnd-kit |
| 存储 | JSON 文件（`data.json`） |
| 认证 | Argon2 密码哈希 + JWT (HS256, 7天有效期) |

## 快速开始

### 前置要求

- [Rust](https://rustup.rs/) (2021 edition)
- [Node.js](https://nodejs.org/) (v18+)

### 启动后端

```powershell
cd "E:\FN_Syn\Projects\Investment Tracker Server"
cargo run
# 服务监听 http://0.0.0.0:8080
```

### 启动前端

```powershell
cd "E:\FN_Syn\Projects\Investment Tracker Server\web-frontend"
npm install
npm run dev
# 访问 http://localhost:5173
```

### 生产构建

```powershell
cd "E:\FN_Syn\Projects\Investment Tracker Server\web-frontend"
npm run build
# 产物在 dist/ 目录
```

## 使用说明

1. **注册账户**：首次使用点击注册，输入用户名（≥3字符）和密码（≥6字符）
2. **添加资产**：在「资产」页面添加投资标的，如「沪深300ETF」
3. **添加标签**：在「标签」页面管理预设和自定义标签
4. **添加标签**：在「标签」页面管理预设和自定义标签
5. **记录交易**：在「交易」页面添加买入/卖出/分红记录
6. **查看概览**：在「概览」页面查看统计数据和图表
7. **数据管理**：侧栏「数据管理」按钮可导出/导入数据备份

## API 文档

启动后端后访问 `http://localhost:8080/` 查看完整 API 列表。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| POST | `/api/auth/register | 用户注册 |
| POST | `/api/auth/login | 用户登录 |
| GET | `/api/assets` | 资产列表 |
| POST | `/api/assets` | 创建资产 |
| GET | `/api/transactions` | 交易列表（支持过滤） |
| POST | `/api/transactions` | 创建交易 |
| GET | `/api/tags` | 标签列表 |
| POST | `/api/tags` | 创建标签 |
| GET | `/api/summary` | 投资汇总统计 |
| GET | `/api/export` | 导出数据 |
| POST | `/api/import` | 导入数据 |

所有 `/api/assets`、`/api/transactions`、`/api/tags` 接口需在请求头携带 `Authorization: Bearer <token>`。

## 与桌面版的关系

本项目与桌面版 Tauri 应用共享数据格式。桌面版导出的 JSON 文件可直接导入 Web 版，反之亦然。

## 已知限制

- 单文件 JSON 存储，所有用户共享同一数据文件（无数据隔离）
- JWT 密钥硬编码，生产环境需改为环境变量
- 无汇率换算功能
- 数据导入为覆盖模式，无合并选项

## License

MIT
