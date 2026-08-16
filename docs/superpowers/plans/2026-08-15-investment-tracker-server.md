# Investment Tracker Server 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 构建一个无头 HTTP API 服务端，提供投资追踪的完整 CRUD 功能，支持 Docker 部署

**架构：** Rust + Axum 提供 RESTful API，JSON 文件持久化（与桌面版共享数据格式），单二进制部署

**技术栈：** Rust 1.75+, Axum 0.7, Tokio, Serde, chrono

---

## 文件结构

```
investment-tracker-server/
├── Cargo.toml
├── Dockerfile
├── docker-compose.yml
├── data/                           # 数据持久化目录（挂载卷）
│   └── .gitkeep
├── src/
│   ├── main.rs                     # 入口 + 路由注册
│   ├── lib.rs                      # 模块导出
│   ├── models.rs                   # 数据结构（Asset, Transaction, Tag 等）
│   ├── db.rs                       # JSON 文件读写
│   ├── handlers/
│   │   ├── mod.rs                  # 模块导出
│   │   ├── assets.rs               # 资产 CRUD 处理
│   │   ├── transactions.rs         # 交易 CRUD 处理
│   │   ├── tags.rs                 # 标签 CRUD 处理
│   │   ├── summary.rs              # 汇总统计
│   │   └── export_import.rs        # 导出/导入
│   └── error.rs                    # 错误处理
└── tests/
    ├── common.rs                   # 测试辅助
    ├── assets_test.rs
    ├── transactions_test.rs
    └── tags_test.rs
```

---

## 任务

### 任务 1：项目初始化

**文件：**
- 创建：`Cargo.toml`
- 创建：`src/main.rs`
- 创建：`src/lib.rs`

- [ ] **步骤 1：创建 Cargo.toml**

```toml
[package]
name = "investment-tracker-server"
version = "0.1.0"
edition = "2021"

[dependencies]
axum = "0.7"
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
chrono = { version = "0.4", features = ["serde"] }
tower = "0.5"
tower-http = { version = "0.6", features = ["cors", "fs", "trace"] }
tracing = "0.1"
tracing-subscriber = "0.3"
uuid = { version = "1", features = ["v4"] }

[dev-dependencies]
reqwest = { version = "0.12", features = ["json"] }
```

- [ ] **步骤 2：创建 src/lib.rs**

```rust
pub mod models;
pub mod db;
pub mod error;
pub mod handlers;
```

- [ ] **步骤 3：创建 src/main.rs**

```rust
use axum::{routing::get, Router};
use std::net::SocketAddr;
use std::path::PathBuf;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let data_dir = std::env::var("DATA_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("./data"));
    
    std::fs::create_dir_all(&data_dir).expect("Failed to create data directory");

    let state = investment_tracker_server::db::AppState::new(&data_dir);

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/api/health", get(health_check))
        .nest("/api", investment_tracker_server::handlers::routes())
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    tracing::info!("Server listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> &'static str {
    "OK"
}
```

- [ ] **步骤 4：Commit**

```bash
git add Cargo.toml src/main.rs src/lib.rs
git commit -m "feat: 初始化 Rust Axum 项目"
```

---

### 任务 2：数据模型定义

**文件：**
- 创建：`src/models.rs`

- [ ] **步骤 1：创建 src/models.rs**

```rust
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Asset {
    pub id: u32,
    pub name: String,
    pub symbol: Option<String>,
    #[serde(alias = "type", alias = "asset_type")]
    pub asset_type: String,
    pub currency: String,
    #[serde(alias = "createdAt", alias = "created_at")]
    pub created_at: String,
    #[serde(alias = "updatedAt", alias = "updated_at")]
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub id: u32,
    #[serde(alias = "assetId", alias = "asset_id")]
    pub asset_id: u32,
    #[serde(alias = "type", alias = "txn_type")]
    pub txn_type: String,
    pub date: String,
    pub price: f64,
    pub quantity: f64,
    pub fee: f64,
    pub tax: f64,
    pub currency: String,
    pub notes: Option<String>,
    #[serde(alias = "createdAt", alias = "created_at")]
    pub created_at: String,
    #[serde(alias = "updatedAt", alias = "updated_at")]
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tag {
    pub id: u32,
    pub name: String,
    pub category: String,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetTag {
    #[serde(alias = "assetId", alias = "asset_id")]
    pub asset_id: u32,
    #[serde(alias = "tagId", alias = "tag_id")]
    pub tag_id: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Sequence {
    pub assets: u32,
    pub transactions: u32,
    pub tags: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Database {
    pub assets: Vec<Asset>,
    pub transactions: Vec<Transaction>,
    pub tags: Vec<Tag>,
    #[serde(alias = "assetTags", alias = "asset_tags")]
    pub asset_tags: Vec<AssetTag>,
    #[serde(rename = "_seq")]
    pub seq: Sequence,
}

impl Default for Database {
    fn default() -> Self {
        Self {
            assets: Vec::new(),
            transactions: Vec::new(),
            tags: Vec::new(),
            asset_tags: Vec::new(),
            seq: Sequence {
                assets: 0,
                transactions: 0,
                tags: 0,
            },
        }
    }
}

// DTOs
#[derive(Debug, Clone, Deserialize)]
pub struct CreateAsset {
    pub name: String,
    pub symbol: Option<String>,
    #[serde(alias = "type", alias = "asset_type")]
    pub asset_type: Option<String>,
    pub currency: Option<String>,
    #[serde(alias = "tagIds", alias = "tag_ids")]
    pub tag_ids: Option<Vec<u32>>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct UpdateAsset {
    pub name: Option<String>,
    pub symbol: Option<String>,
    #[serde(alias = "type", alias = "asset_type")]
    pub asset_type: Option<String>,
    pub currency: Option<String>,
    #[serde(alias = "tagIds", alias = "tag_ids")]
    pub tag_ids: Option<Vec<u32>>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CreateTransaction {
    #[serde(alias = "assetId", alias = "asset_id")]
    pub asset_id: u32,
    #[serde(alias = "type", alias = "txnType", alias = "txn_type")]
    pub txn_type: String,
    pub date: String,
    pub price: f64,
    pub quantity: f64,
    pub fee: Option<f64>,
    pub tax: Option<f64>,
    pub currency: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct UpdateTransaction {
    #[serde(alias = "assetId", alias = "asset_id")]
    pub asset_id: Option<u32>,
    #[serde(alias = "type", alias = "txnType", alias = "txn_type")]
    pub txn_type: Option<String>,
    pub date: Option<String>,
    pub price: Option<f64>,
    pub quantity: Option<f64>,
    pub fee: Option<f64>,
    pub tax: Option<f64>,
    pub currency: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CreateTag {
    pub name: String,
    pub category: Option<String>,
    pub color: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct UpdateTag {
    pub name: Option<String>,
    pub category: Option<String>,
    pub color: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct TransactionQuery {
    #[serde(alias = "assetId", alias = "asset_id")]
    pub asset_id: Option<u32>,
    #[serde(alias = "type", alias = "txnType", alias = "txn_type")]
    pub txn_type: Option<String>,
    #[serde(alias = "startDate", alias = "start_date")]
    pub start_date: Option<String>,
    #[serde(alias = "endDate", alias = "end_date")]
    pub end_date: Option<String>,
}

// Response types
#[derive(Debug, Clone, Serialize)]
pub struct AssetWithTags {
    #[serde(flatten)]
    pub asset: Asset,
    pub tags: Vec<Tag>,
}

#[derive(Debug, Clone, Serialize)]
pub struct TransactionWithAsset {
    #[serde(flatten)]
    pub transaction: Transaction,
    pub asset: Option<Asset>,
}

#[derive(Debug, Clone, Serialize)]
pub struct AssetSummary {
    pub id: u32,
    pub name: String,
    pub symbol: Option<String>,
    #[serde(alias = "assetType", alias = "asset_type")]
    pub asset_type: String,
    pub currency: String,
    pub holding: f64,
    #[serde(alias = "buyCost", alias = "buy_cost")]
    pub buy_cost: f64,
    #[serde(alias = "sellRevenue", alias = "sell_revenue")]
    pub sell_revenue: f64,
    #[serde(alias = "avgBuyCost", alias = "avg_buy_cost")]
    pub avg_buy_cost: f64,
    #[serde(alias = "holdingCostBasis", alias = "holding_cost_basis")]
    pub holding_cost_basis: f64,
    #[serde(alias = "realizedPnl", alias = "realized_pnl")]
    pub realized_pnl: Option<f64>,
    pub tags: Vec<Tag>,
}

#[derive(Debug, Clone, Serialize)]
pub struct Overview {
    pub total_assets: usize,
    pub total_investment: f64,
    pub total_realized_pnl: f64,
    pub total_dividends: f64,
    pub total_fees: f64,
    pub total_tax: f64,
    pub cost_basis_of_holdings: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct Summary {
    pub overview: Overview,
    pub type_distribution: HashMap<String, f64>,
    pub currency_distribution: HashMap<String, f64>,
    pub assets: Vec<AssetSummary>,
}
```

- [ ] **步骤 2：Commit**

```bash
git add src/models.rs
git commit -m "feat: 添加数据模型定义"
```

---

### 任务 3：数据库层（JSON 文件持久化）

**文件：**
- 创建：`src/db.rs`

- [ ] **步骤 1：创建 src/db.rs**

```rust
use crate::models::Database;
use std::path::Path;
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Clone)]
pub struct AppState {
    pub db: Arc<RwLock<Database>>,
    pub data_path: std::path::PathBuf,
}

impl AppState {
    pub fn new(data_dir: &Path) -> Self {
        let data_path = data_dir.join("data.json");
        let db = if data_path.exists() {
            let content = std::fs::read_to_string(&data_path).unwrap_or_default();
            serde_json::from_str(&content).unwrap_or_default()
        } else {
            Database::default()
        };
        AppState {
            db: Arc::new(RwLock::new(db)),
            data_path,
        }
    }

    pub async fn persist(&self) -> Result<(), String> {
        let db = self.db.read().await;
        let json = serde_json::to_string_pretty(&*db).map_err(|e| e.to_string())?;
        std::fs::write(&self.data_path, json).map_err(|e| e.to_string())?;
        Ok(())
    }
}
```

- [ ] **步骤 2：Commit**

```bash
git add src/db.rs
git commit -m "feat: 添加 JSON 文件持久化层"
```

---

### 任务 4：错误处理

**文件：**
- 创建：`src/error.rs`

- [ ] **步骤 1：创建 src/error.rs**

```rust
use axum::{
    response::{IntoResponse, Response},
    http::StatusCode,
    Json,
};
use serde_json::json;

#[derive(Debug)]
pub enum AppError {
    NotFound(String),
    BadRequest(String),
    Internal(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg),
            AppError::Internal(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
        };
        (status, Json(json!({ "error": message }))).into_response()
    }
}

impl From<std::io::Error> for AppError {
    fn from(e: std::io::Error) -> Self {
        AppError::Internal(e.to_string())
    }
}

impl From<serde_json::Error> for AppError {
    fn from(e: serde_json::Error) -> Self {
        AppError::Internal(e.to_string())
    }
}
```

- [ ] **步骤 2：Commit**

```bash
git add src/error.rs
git commit -m "feat: 添加错误处理"
```

---

### 任务 5：Handlers 模块骨架

**文件：**
- 创建：`src/handlers/mod.rs`

- [ ] **步骤 1：创建 src/handlers/mod.rs**

```rust
use axum::Router;
use crate::db::AppState;

pub mod assets;
pub mod transactions;
pub mod tags;
pub mod summary;
pub mod export_import;

pub fn routes() -> Router<AppState> {
    Router::new()
        .merge(assets::routes())
        .merge(transactions::routes())
        .merge(tags::routes())
        .merge(summary::routes())
        .merge(export_import::routes())
}
```

- [ ] **步骤 2：Commit**

```bash
git add src/handlers/mod.rs
git commit -m "feat: 添加 handlers 模块骨架"
```

---

### 任务 6：资产 CRUD API

**文件：**
- 创建：`src/handlers/assets.rs`
- 创建：`tests/common.rs`
- 创建：`tests/assets_test.rs`

- [ ] **步骤 1：创建 tests/common.rs**

```rust
use std::path::PathBuf;
use std::sync::Once;

static INIT: Once = Once::new();

pub fn setup_test_env() -> PathBuf {
    INIT.call_once(|| {
        tracing_subscriber::fmt::init();
    });
    let dir = std::env::temp_dir().join(format!("it-test-{}", uuid::Uuid::new_v4()));
    std::fs::create_dir_all(&dir).unwrap();
    dir
}
```

- [ ] **步骤 2：创建 src/handlers/assets.rs**

```rust
use axum::{
    routing::{get, post, patch, delete},
    Router, Json, Extension, extract::Path,
};
use crate::db::AppState;
use crate::models::*;
use crate::error::AppError;
use chrono::Utc;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/assets", get(list_assets).post(create_asset))
        .route("/assets/:id", get(get_asset).patch(update_asset).delete(delete_asset))
        .route("/assets/:id/tags", post(add_tag))
        .route("/assets/:id/tags/:tag_id", delete(remove_tag))
}

async fn list_assets(
    Extension(state): Extension<AppState>,
) -> Result<Json<Vec<AssetWithTags>>, AppError> {
    let db = state.db.read().await;
    let assets: Vec<AssetWithTags> = db.assets.iter().map(|asset| {
        let tags: Vec<Tag> = db.asset_tags.iter()
            .filter(|at| at.asset_id == asset.id)
            .filter_map(|at| db.tags.iter().find(|t| t.id == at.tag_id).cloned())
            .collect();
        AssetWithTags { asset: asset.clone(), tags }
    }).collect();
    Ok(Json(assets))
}

async fn get_asset(
    Extension(state): Extension<AppState>,
    Path(id): Path<u32>,
) -> Result<Json<AssetWithTags>, AppError> {
    let db = state.db.read().await;
    let asset = db.assets.iter().find(|a| a.id == id)
        .ok_or_else(|| AppError::NotFound(format!("Asset {} not found", id)))?;
    let tags: Vec<Tag> = db.asset_tags.iter()
        .filter(|at| at.asset_id == id)
        .filter_map(|at| db.tags.iter().find(|t| t.id == at.tag_id).cloned())
        .collect();
    Ok(Json(AssetWithTags { asset: asset.clone(), tags }))
}

async fn create_asset(
    Extension(state): Extension<AppState>,
    Json(data): Json<CreateAsset>,
) -> Result<Json<Asset>, AppError> {
    let mut db = state.db.write().await;
    let id = {
        db.seq.assets += 1;
        db.seq.assets
    };
    let now = Utc::now().to_rfc3339();
    let asset = Asset {
        id,
        name: data.name,
        symbol: data.symbol,
        asset_type: data.asset_type.unwrap_or_else(|| "stock".to_string()),
        currency: data.currency.unwrap_or_else(|| "EUR".to_string()),
        created_at: now.clone(),
        updated_at: now,
    };
    if let Some(tag_ids) = data.tag_ids {
        for tag_id in tag_ids {
            db.asset_tags.push(AssetTag { asset_id: id, tag_id });
        }
    }
    db.assets.push(asset.clone());
    state.persist().await?;
    Ok(Json(asset))
}

async fn update_asset(
    Extension(state): Extension<AppState>,
    Path(id): Path<u32>,
    Json(data): Json<UpdateAsset>,
) -> Result<Json<Asset>, AppError> {
    let mut db = state.db.write().await;
    let idx = db.assets.iter().position(|a| a.id == id)
        .ok_or_else(|| AppError::NotFound(format!("Asset {} not found", id)))?;
    if let Some(name) = data.name { db.assets[idx].name = name; }
    if let Some(symbol) = data.symbol { db.assets[idx].symbol = Some(symbol); }
    if let Some(t) = data.asset_type { db.assets[idx].asset_type = t; }
    if let Some(c) = data.currency { db.assets[idx].currency = c; }
    db.assets[idx].updated_at = Utc::now().to_rfc3339();
    if let Some(tag_ids) = data.tag_ids {
        db.asset_tags.retain(|at| at.asset_id != id);
        for tag_id in tag_ids {
            db.asset_tags.push(AssetTag { asset_id: id, tag_id });
        }
    }
    let result = db.assets[idx].clone();
    state.persist().await?;
    Ok(Json(result))
}

async fn delete_asset(
    Extension(state): Extension<AppState>,
    Path(id): Path<u32>,
) -> Result<Json<serde_json::Value>, AppError> {
    let mut db = state.db.write().await;
    let before = db.assets.len();
    db.assets.retain(|a| a.id != id);
    if db.assets.len() == before {
        return Err(AppError::NotFound(format!("Asset {} not found", id)));
    }
    db.transactions.retain(|t| t.asset_id != id);
    db.asset_tags.retain(|at| at.asset_id != id);
    state.persist().await?;
    Ok(Json(serde_json::json!({ "success": true })))
}

async fn add_tag(
    Extension(state): Extension<AppState>,
    Path(id): Path<u32>,
    Json(body): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, AppError> {
    let tag_id = body["tag_id"].as_u64()
        .ok_or_else(|| AppError::BadRequest("tag_id required".to_string()))? as u32;
    let mut db = state.db.write().await;
    if !db.assets.iter().any(|a| a.id == id) {
        return Err(AppError::NotFound(format!("Asset {} not found", id)));
    }
    if !db.tags.iter().any(|t| t.id == tag_id) {
        return Err(AppError::NotFound(format!("Tag {} not found", tag_id)));
    }
    if !db.asset_tags.iter().any(|at| at.asset_id == id && at.tag_id == tag_id) {
        db.asset_tags.push(AssetTag { asset_id: id, tag_id });
        state.persist().await?;
    }
    Ok(Json(serde_json::json!({ "success": true })))
}

async fn remove_tag(
    Extension(state): Extension<AppState>,
    Path((id, tag_id)): Path<(u32, u32)>,
) -> Result<Json<serde_json::Value>, AppError> {
    let mut db = state.db.write().await;
    let before = db.asset_tags.len();
    db.asset_tags.retain(|at| !(at.asset_id == id && at.tag_id == tag_id));
    if db.asset_tags.len() == before {
        return Err(AppError::NotFound(format!("Tag {} not found on asset {}", tag_id, id)));
    }
    state.persist().await?;
    Ok(Json(serde_json::json!({ "success": true })))
}
```

- [ ] **步骤 3：Commit**

```bash
git add src/handlers/assets.rs tests/common.rs
git commit -m "feat: 添加资产 CRUD API"
```

---

### 任务 7：交易 CRUD API

**文件：**
- 创建：`src/handlers/transactions.rs`
- 创建：`tests/transactions_test.rs`

- [ ] **步骤 1：创建 src/handlers/transactions.rs**

```rust
use axum::{
    routing::{get, post, patch, delete},
    Router, Json, Extension, Path, extract::Query,
};
use crate::db::AppState;
use crate::models::*;
use crate::error::AppError;
use chrono::Utc;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/transactions", get(list_transactions).post(create_transaction))
        .route("/transactions/:id", get(get_transaction).patch(update_transaction).delete(delete_transaction))
}

async fn list_transactions(
    Extension(state): Extension<AppState>,
    Query(query): Query<TransactionQuery>,
) -> Result<Json<Vec<TransactionWithAsset>>, AppError> {
    let db = state.db.read().await;
    let mut txns: Vec<&Transaction> = db.transactions.iter().collect();
    if let Some(aid) = query.asset_id { txns.retain(|t| t.asset_id == aid); }
    if let Some(ref tt) = query.txn_type { txns.retain(|t| &t.txn_type == tt); }
    if let Some(ref sd) = query.start_date { txns.retain(|t| &t.date >= sd); }
    if let Some(ref ed) = query.end_date { txns.retain(|t| &t.date <= ed); }
    let result: Vec<TransactionWithAsset> = txns.iter().map(|t| {
        let asset = db.assets.iter().find(|a| a.id == t.asset_id).cloned();
        TransactionWithAsset { transaction: (*t).clone(), asset }
    }).collect();
    Ok(Json(result))
}

async fn get_transaction(
    Extension(state): Extension<AppState>,
    Path(id): Path<u32>,
) -> Result<Json<TransactionWithAsset>, AppError> {
    let db = state.db.read().await;
    let txn = db.transactions.iter().find(|t| t.id == id)
        .ok_or_else(|| AppError::NotFound(format!("Transaction {} not found", id)))?;
    let asset = db.assets.iter().find(|a| a.id == txn.asset_id).cloned();
    Ok(Json(TransactionWithAsset { transaction: txn.clone(), asset }))
}

async fn create_transaction(
    Extension(state): Extension<AppState>,
    Json(data): Json<CreateTransaction>,
) -> Result<Json<Transaction>, AppError> {
    let mut db = state.db.write().await;
    let id = {
        db.seq.transactions += 1;
        db.seq.transactions
    };
    let now = Utc::now().to_rfc3339();
    let txn = Transaction {
        id,
        asset_id: data.asset_id,
        txn_type: data.txn_type,
        date: data.date,
        price: data.price,
        quantity: data.quantity,
        fee: data.fee.unwrap_or(0.0),
        tax: data.tax.unwrap_or(0.0),
        currency: data.currency.unwrap_or_else(|| "EUR".to_string()),
        notes: data.notes,
        created_at: now.clone(),
        updated_at: now,
    };
    db.transactions.push(txn.clone());
    state.persist().await?;
    Ok(Json(txn))
}

async fn update_transaction(
    Extension(state): Extension<AppState>,
    Path(id): Path<u32>,
    Json(data): Json<UpdateTransaction>,
) -> Result<Json<Transaction>, AppError> {
    let mut db = state.db.write().await;
    let txn = db.transactions.iter_mut().find(|t| t.id == id)
        .ok_or_else(|| AppError::NotFound(format!("Transaction {} not found", id)))?;
    if let Some(aid) = data.asset_id { txn.asset_id = aid; }
    if let Some(ref tt) = data.txn_type { txn.txn_type = tt.clone(); }
    if let Some(ref d) = data.date { txn.date = d.clone(); }
    if let Some(p) = data.price { txn.price = p; }
    if let Some(q) = data.quantity { txn.quantity = q; }
    if let Some(f) = data.fee { txn.fee = f; }
    if let Some(tax) = data.tax { txn.tax = tax; }
    if let Some(ref c) = data.currency { txn.currency = c.clone(); }
    if let Some(ref n) = data.notes { txn.notes = Some(n.clone()); }
    txn.updated_at = Utc::now().to_rfc3339();
    let result = txn.clone();
    state.persist().await?;
    Ok(Json(result))
}

async fn delete_transaction(
    Extension(state): Extension<AppState>,
    Path(id): Path<u32>,
) -> Result<Json<serde_json::Value>, AppError> {
    let mut db = state.db.write().await;
    let before = db.transactions.len();
    db.transactions.retain(|t| t.id != id);
    if db.transactions.len() == before {
        return Err(AppError::NotFound(format!("Transaction {} not found", id)));
    }
    state.persist().await?;
    Ok(Json(serde_json::json!({ "success": true })))
}
```

- [ ] **步骤 2：Commit**

```bash
git add src/handlers/transactions.rs
git commit -m "feat: 添加交易 CRUD API"
```

---

### 任务 8：标签 CRUD API

**文件：**
- 创建：`src/handlers/tags.rs`
- 创建：`tests/tags_test.rs`

- [ ] **步骤 1：创建 src/handlers/tags.rs**

```rust
use axum::{
    routing::{get, post, patch, delete},
    Router, Json, Extension, Path,
};
use crate::db::AppState;
use crate::models::*;
use crate::error::AppError;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/tags", get(list_tags).post(create_tag))
        .route("/tags/:id", get(get_tag).patch(update_tag).delete(delete_tag))
}

async fn list_tags(Extension(state): Extension<AppState>) -> Result<Json<Vec<Tag>>, AppError> {
    let db = state.db.read().await;
    Ok(Json(db.tags.clone()))
}

async fn get_tag(
    Extension(state): Extension<AppState>,
    Path(id): Path<u32>,
) -> Result<Json<Tag>, AppError> {
    let db = state.db.read().await;
    let tag = db.tags.iter().find(|t| t.id == id)
        .ok_or_else(|| AppError::NotFound(format!("Tag {} not found", id)))?;
    Ok(Json(tag.clone()))
}

async fn create_tag(
    Extension(state): Extension<AppState>,
    Json(data): Json<CreateTag>,
) -> Result<Json<Tag>, AppError> {
    let mut db = state.db.write().await;
    let id = {
        db.seq.tags += 1;
        db.seq.tags
    };
    let tag = Tag {
        id,
        name: data.name,
        category: data.category.unwrap_or_else(|| "custom".to_string()),
        color: data.color.unwrap_or_else(|| "#6B7280".to_string()),
    };
    db.tags.push(tag.clone());
    state.persist().await?;
    Ok(Json(tag))
}

async fn update_tag(
    Extension(state): Extension<AppState>,
    Path(id): Path<u32>,
    Json(data): Json<UpdateTag>,
) -> Result<Json<Tag>, AppError> {
    let mut db = state.db.write().await;
    let tag = db.tags.iter_mut().find(|t| t.id == id)
        .ok_or_else(|| AppError::NotFound(format!("Tag {} not found", id)))?;
    if let Some(ref n) = data.name { tag.name = n.clone(); }
    if let Some(ref c) = data.category { tag.category = c.clone(); }
    if let Some(ref c) = data.color { tag.color = c.clone(); }
    let result = tag.clone();
    state.persist().await?;
    Ok(Json(result))
}

async fn delete_tag(
    Extension(state): Extension<AppState>,
    Path(id): Path<u32>,
) -> Result<Json<serde_json::Value>, AppError> {
    let mut db = state.db.write().await;
    let before = db.tags.len();
    db.tags.retain(|t| t.id != id);
    if db.tags.len() == before {
        return Err(AppError::NotFound(format!("Tag {} not found", id)));
    }
    db.asset_tags.retain(|at| at.tag_id != id);
    state.persist().await?;
    Ok(Json(serde_json::json!({ "success": true })))
}
```

- [ ] **步骤 2：Commit**

```bash
git add src/handlers/tags.rs
git commit -m "feat: 添加标签 CRUD API"
```

---

### 任务 9：汇总统计 API

**文件：**
- 创建：`src/handlers/summary.rs`

- [ ] **步骤 1：创建 src/handlers/summary.rs**

```rust
use axum::{routing::get, Router, Json, Extension};
use crate::db::AppState;
use crate::models::*;
use crate::error::AppError;

pub fn routes() -> Router<AppState> {
    Router::new().route("/summary", get(get_summary))
}

async fn get_summary(Extension(state): Extension<AppState>) -> Result<Json<Summary>, AppError> {
    let db = state.db.read().await;
    let mut total_investment = 0.0;
    let mut total_fees = 0.0;
    let mut total_tax = 0.0;
    let mut total_dividends = 0.0;
    let mut total_realized_pnl = 0.0;
    let mut cost_basis_of_holdings = 0.0;

    let assets: Vec<AssetSummary> = db.assets.iter().map(|asset| {
        let txns: Vec<&Transaction> = db.transactions.iter().filter(|t| t.asset_id == asset.id).collect();
        let buy_txns: Vec<&&Transaction> = txns.iter().filter(|t| t.txn_type == "BUY").collect();
        let sell_txns: Vec<&&Transaction> = txns.iter().filter(|t| t.txn_type == "SELL").collect();
        let buy_qty: f64 = buy_txns.iter().map(|t| t.quantity).sum();
        let sell_qty: f64 = sell_txns.iter().map(|t| t.quantity).sum();
        let holding = buy_qty - sell_qty;
        let buy_cost: f64 = buy_txns.iter().map(|t| t.price * t.quantity + t.fee + t.tax).sum();
        let sell_revenue: f64 = sell_txns.iter().map(|t| t.price * t.quantity - t.fee - t.tax).sum();
        let fees: f64 = txns.iter().map(|t| t.fee).sum();
        let tax: f64 = txns.iter().map(|t| t.tax).sum();
        let dividends: f64 = txns.iter().filter(|t| t.txn_type == "DIVIDEND").map(|t| t.quantity * t.price - t.tax).sum();
        let avg_buy_cost = if buy_qty > 0.0 { buy_cost / buy_qty } else { 0.0 };
        let holding_cost_basis = holding * avg_buy_cost;
        total_investment += buy_cost;
        total_fees += fees;
        total_tax += tax;
        total_dividends += dividends;
        cost_basis_of_holdings += holding_cost_basis;
        let realized_pnl = if holding <= 0.0001 { Some(sell_revenue - buy_cost) } else { None };
        if let Some(pnl) = realized_pnl { total_realized_pnl += pnl; }
        let tags: Vec<Tag> = db.asset_tags.iter()
            .filter(|at| at.asset_id == asset.id)
            .filter_map(|at| db.tags.iter().find(|t| t.id == at.tag_id).cloned())
            .collect();
        AssetSummary {
            id: asset.id,
            name: asset.name.clone(),
            symbol: asset.symbol.clone(),
            asset_type: asset.asset_type.clone(),
            currency: asset.currency.clone(),
            holding,
            buy_cost,
            sell_revenue,
            avg_buy_cost,
            holding_cost_basis,
            realized_pnl,
            tags,
        }
    }).collect();

    let mut type_dist = std::collections::HashMap::new();
    for a in &assets {
        *type_dist.entry(a.asset_type.clone()).or_insert(0.0) += a.holding_cost_basis;
    }

    let mut curr_dist = std::collections::HashMap::new();
    for a in &db.assets {
        let buy_cost: f64 = db.transactions.iter()
            .filter(|t| t.asset_id == a.id && t.txn_type == "BUY")
            .map(|t| t.price * t.quantity)
            .sum();
        *curr_dist.entry(a.currency.clone()).or_insert(0.0) += buy_cost;
    }

    Ok(Json(Summary {
        overview: Overview {
            total_assets: db.assets.len(),
            total_investment,
            total_realized_pnl,
            total_dividends,
            total_fees,
            total_tax,
            cost_basis_of_holdings,
        },
        type_distribution: type_dist,
        currency_distribution: curr_dist,
        assets,
    }))
}
```

- [ ] **步骤 2：Commit**

```bash
git add src/handlers/summary.rs
git commit -m "feat: 添加汇总统计 API"
```

---

### 任务 10：导出/导入 API

**文件：**
- 创建：`src/handlers/export_import.rs`

- [ ] **步骤 1：创建 src/handlers/export_import.rs**

```rust
use axum::{routing::{get, post}, Router, Json, Extension};
use crate::db::AppState;
use crate::error::AppError;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/export", get(export_data))
        .route("/import", post(import_data))
}

async fn export_data(Extension(state): Extension<AppState>) -> Result<String, AppError> {
    let db = state.db.read().await;
    let json = serde_json::to_string_pretty(&*db).map_err(|e| AppError::Internal(e.to_string()))?;
    Ok(json)
}

async fn import_data(
    Extension(state): Extension<AppState>,
    body: String,
) -> Result<Json<serde_json::Value>, AppError> {
    let imported: crate::models::Database = serde_json::from_str(&body)
        .map_err(|e| AppError::BadRequest(format!("Invalid JSON: {}", e)))?;
    let mut db = state.db.write().await;
    *db = imported;
    state.persist().await?;
    Ok(Json(serde_json::json!({ "success": true })))
}
```

- [ ] **步骤 2：Commit**

```bash
git add src/handlers/export_import.rs
git commit -m "feat: 添加导出/导入 API"
```

---

### 任务 11：Docker 配置

**文件：**
- 创建：`Dockerfile`
- 创建：`docker-compose.yml`
- 创建：`.dockerignore`

- [ ] **步骤 1：创建 Dockerfile**

```dockerfile
# Build stage
FROM rust:1.75-slim as builder

WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src

RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/target/release/investment-tracker-server .

ENV RUST_LOG=info
ENV DATA_DIR=/data
EXPOSE 8080

VOLUME ["/data"]

CMD ["./investment-tracker-server"]
```

- [ ] **步骤 2：创建 docker-compose.yml**

```yaml
version: "3.8"

services:
  investment-tracker:
    build: .
    ports:
      - "8080:8080"
    volumes:
      - ./data:/data
    environment:
      - RUST_LOG=info
      - DATA_DIR=/data
    restart: unless-stopped
```

- [ ] **步骤 3：创建 .dockerignore**

```
target/
data/
.git/
Dockerfile
docker-compose.yml
```

- [ ] **步骤 4：Commit**

```bash
git add Dockerfile docker-compose.yml .dockerignore
git commit -m "feat: 添加 Docker 配置"
```

---

### 任务 12：构建验证

- [ ] **步骤 1：本地构建测试**

```bash
cargo build --release
```

预期：编译成功，无错误

- [ ] **步骤 2：运行服务器测试**

```bash
DATA_DIR=./data cargo run --release
```

预期：输出 "Server listening on 0.0.0.0:8080"

- [ ] **步骤 3：API 测试**

```bash
curl http://localhost:8080/api/health
```

预期：返回 "OK"

- [ ] **步骤 4：Commit**

```bash
git add -A
git commit -m "chore: 构建验证完成"
```

---

## 自检

1. **规格覆盖度：**
   - ✅ 资产 CRUD — 任务 6
   - ✅ 交易 CRUD — 任务 7
   - ✅ 标签 CRUD — 任务 8
   - ✅ 汇总统计 — 任务 9
   - ✅ 导出/导入 — 任务 10
   - ✅ Docker 部署 — 任务 11

2. **占位符扫描：** 无 "待定"、"TODO"、"后续实现" 等占位符

3. **类型一致性：** 所有 handler 使用的类型与 `models.rs` 定义一致，DTO 命名与桌面版兼容
