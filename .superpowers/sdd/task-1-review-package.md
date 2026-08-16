# Review Package: Task 1

## Commit: ae1f6c2b00ce7b52d726f48c0e15c5a681a8c497

## Changed Files
- Cargo.toml (ADD)
- src/main.rs (ADD)
- src/lib.rs (ADD)

## Diff

```diff
diff --git a/Cargo.toml b/Cargo.toml
new file mode 100644
--- /dev/null
+++ b/Cargo.toml
@@ -0,0 +1,22 @@
+[package]
+name = "investment-tracker-server"
+version = "0.1.0"
+edition = "2021"
+
+[dependencies]
+axum = "0.7"
+tokio = { version = "1", features = ["full"] }
+serde = { version = "1", features = ["derive"] }
+serde_json = "1"
+chrono = { version = "0.4", features = ["serde"] }
+tower = "0.5"
+tower-http = { version = "0.6", features = ["cors", "fs", "trace"] }
+tracing = "0.1"
+tracing-subscriber = "0.3"
+uuid = { version = "1", features = ["v4"] }
+
+[dev-dependencies]
+reqwest = { version = "0.12", features = ["json"] }
+
diff --git a/src/lib.rs b/src/lib.rs
new file mode 100644
--- /dev/null
+++ b/src/lib.rs
@@ -0,0 +1,4 @@
+pub mod models;
+pub mod db;
+pub mod error;
+pub mod handlers;
+
diff --git a/src/main.rs b/src/main.rs
new file mode 100644
--- /dev/null
+++ b/src/main.rs
@@ -0,0 +1,47 @@
+use axum::{routing::get, Router};
+use std::net::SocketAddr;
+use std::path::PathBuf;
+use tower_http::cors::{Any, CorsLayer};
+use tower_http::trace::TraceLayer;
+use tracing_subscriber;
+
+#[tokio::main]
+async fn main() {
+    tracing_subscriber::fmt::init();
+
+    let data_dir = std::env::var("DATA_DIR")
+        .map(PathBuf::from)
+        .unwrap_or_else(|_| PathBuf::from("./data"));
+    
+    std::fs::create_dir_all(&data_dir).expect("Failed to create data directory");
+
+    // TODO: db 模块尚未实现（任务 3）
+    let state = investment_tracker_server::db::AppState::new(&data_dir);
+
+    let cors = CorsLayer::new()
+        .allow_origin(Any)
+        .allow_methods(Any)
+        .allow_headers(Any);
+
+    let app = Router::new()
+        .route("/api/health", get(health_check))
+        // TODO: handlers 模块尚未实现（任务 5）
+        .nest("/api", investment_tracker_server::handlers::routes())
+        .layer(cors)
+        .layer(TraceLayer::new_for_http())
+        .with_state(state);
+
+    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
+    tracing::info!("Server listening on {}", addr);
+    
+    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
+    axum::serve(listener, app).await.unwrap();
+}
+
+async fn health_check() -> &'static str {
+    "OK"
+}
```
