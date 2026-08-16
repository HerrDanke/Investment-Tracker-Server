# 任务 3：数据库层（JSON 文件持久化）

**目标：** 实现 src/db.rs，提供 JSON 文件读写功能

**文件：**
- 修改：`src/db.rs`（替换任务 2 的占位实现）

**完整代码（逐字使用）：**

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

**上下文：**
- 任务 2 已添加占位 db.rs，本任务替换为完整实现
- 使用 `tokio::sync::RwLock` 支持并发读写
- `persist()` 将内存中的 Database 序列化为 JSON 写入文件
- `AppState` 通过 `Clone` 共享给 Axum handlers

**验证：**
```bash
cargo check
```
预期：通过

**提交：**
```bash
git add src/db.rs
git commit -m "feat: 添加 JSON 文件持久化层"
```
