# 任务 5：Handlers 骨架（接线）

**目标：** 将所有 handler 模块接线到 Axum 路由

**文件：**
- 修改：`src/handlers/mod.rs`（替换占位文件）
- 删除：`src/handlers.rs`（任务 2 的占位文件，现在不需要了）

**src/handlers/mod.rs 完整代码：**

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

**上下文：**
- 任务 2 添加了 `src/handlers.rs`（占位）
- 任务 6-10 创建了 `src/handlers/assets.rs`、`transactions.rs`、`tags.rs`、`summary.rs`、`export_import.rs`
- 现在需要：
  1. 用上面的代码替换 `src/handlers/mod.rs`
  2. 删除旧的 `src/handlers.rs`（避免与 `src/handlers/` 目录冲突）

**验证：**
```bash
cargo check
```
预期：通过（所有模块接线完成）

**提交：**
```bash
git rm src/handlers.rs; git add src/handlers/mod.rs; git commit -m "feat: 接线所有 handler 模块"
```
