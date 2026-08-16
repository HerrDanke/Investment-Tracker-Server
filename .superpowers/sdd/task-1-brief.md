# 任务 1：项目初始化

**目标：** 创建 Rust Axum 项目的初始结构

**文件：**
- 创建：`Cargo.toml`
- 创建：`src/main.rs`
- 创建：`src/lib.rs`

## Cargo.toml

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

## src/lib.rs

```rust
pub mod models;
pub mod db;
pub mod error;
pub mod handlers;
```

## src/main.rs

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

## 验证

运行 `cargo build` 应该成功编译（此时模块为空骨架，不会编译错误）。

## 提交

```bash
git add -A
git commit -m "feat: 初始化 Rust Axum 项目"
```
