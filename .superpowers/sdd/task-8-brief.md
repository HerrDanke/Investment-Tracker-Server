# 任务 8：标签 CRUD API

**目标：** 创建 src/handlers/tags.rs，实现标签相关的所有 HTTP 端点

**文件：**
- 创建：`src/handlers/tags.rs`

**完整代码（逐字使用）：**

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

**提交：**
```bash
git add src/handlers/tags.rs
git commit -m "feat: 添加标签 CRUD API"
```
