# Investment Tracker Server - Handoff

## 项目概述

无头 HTTP API 服务，用于追踪个人投资（股票、基金、ETF 等）的买卖记录，支持多币种、手续费、税收、标签管理。

## 技术栈

| 层级 | 技术 |
|------|------|
| 语言 | Rust 2021 |
| 框架 | Axum 0.7 |
| 运行时 | Tokio (features: full) |
| 序列化 | Serde + Serde JSON |
| 时间 | Chrono (with serde) |
| 唯一 ID | UUID v4 |
| 中间件 | tower-http (CORS, Trace) |
| 日志 | tracing + tracing-subscriber |

## 项目结构

```
Investment Tracker Server/
├── Cargo.toml
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── data/
│   └── data.json              # 持久化数据存储
└── src/
    ├── main.rs                 # 入口，路由挂载
    ├── lib.rs                  # 库入口
    ├── models.rs               # 所有数据结构（~219 行）
    ├── db.rs                   # AppState + JSON 文件持久化
    ├── error.rs                # AppError 错误处理
    └── handlers/
        ├── mod.rs              # 路由聚合
        ├── assets.rs           # 资产 CRUD + 标签关联
        ├── transactions.rs     # 交易 CRUD + 过滤查询
        ├── tags.rs             # 标签 CRUD
        ├── summary.rs          # 汇总统计
        └── export_import.rs    # 导出/导入 JSON
```

## 数据模型

### 核心实体

| 实体 | 说明 |
|------|------|
| Asset | 投资标的（名称、代码、类型、货币） |
| Transaction | 交易记录（买入/卖出/分红、价格、数量、手续费、税） |
| Tag | 标签（名称、分类、颜色） |
| AssetTag | 资产-标签多对多关联 |

### 交易类型

- `buy` - 买入
- `sell` - 卖出
- `dividend` - 分红

### JSON 序列化兼容

所有模型使用 `#[serde(alias = "...")]` 兼容 camelCase 和 snake_case，支持与桌面 Tauri 应用的数据格式互转。

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 服务首页（HTML 端点列表） |
| GET | `/api/health` | 健康检查 |
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
- 文件路径：`./data/data.json`（可通过环境变量 `DATA_DIR` 修改）
- 读写机制：`Arc<RwLock<Database>>` 内存存储，每次写操作后序列化到磁盘
- 序列号管理：`_seq` 字段记录 assets/transactions/tags 的自增 ID

## 启动方式

### 本地直接运行

```powershell
# 编译
cargo build --release

# 运行
.\target\release\investment-tracker-server.exe
# 服务监听 http://0.0.0.0:8080
```

### Docker 部署

```powershell
docker-compose build
docker-compose up -d
```

数据挂载到主机 `./data` 目录，容器重启不丢失。

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| DATA_DIR | ./data | 数据存储目录 |

## Git 历史

```
2f29b5f chore: 更新进度 - 所有 12 个任务完成
9ab1c60 fix: 修复 Axum 嵌套路由 State 提取问题
80122e4 feat: 添加 Docker 配置
416671f feat: 添加导出/导入 API
36b307b feat: 添加汇总统计 API
5280691 feat: 添加标签 CRUD API
2f5ae1e feat: 添加交易 CRUD API
6980585 feat: 添加资产 CRUD API
4b700c8 feat: 接线所有 handler 模块
f7b1c45 feat: 添加错误处理
f6ad274 feat: 添加数据库层和 JSON 持久化
3e66332 feat: 添加数据模型
ae1f6c2b feat: 初始化 Rust 项目
```

## 桌面 Tauri 应用关联

此服务与桌面版 Tauri 应用共享数据格式。桌面版通过 `tauri-plugin-dialog` 和 `tauri-plugin-fs` 读写 `data/data.json`，服务端通过 Rust `std::fs` 读写同一格式文件。

数据可互导：桌面版导出 → 服务端导入，反之亦然。

## 后续可优化方向

- [ ] 数据校验（交易数量、价格不能为负）
- [ ] API Key 认证
- [ ] WebSocket 实时通知
- [ ] 汇率换算
- [ ] 定时备份
- [ ] 更丰富的统计图表数据

## 访问地址

- 本地：`http://127.0.0.1:8080`
- 健康检查：`http://127.0.0.1:8080/api/health`
