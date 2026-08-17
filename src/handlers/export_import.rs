use axum::{routing::{get, post}, Router, Json, extract::State};
use crate::db::AppState;
use crate::error::AppError;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/export", get(export_data))
        .route("/import", post(import_data))
}

async fn export_data(State(state): State<AppState>) -> Result<String, AppError> {
    let db = state.db.read().await;
    let json = serde_json::to_string_pretty(&*db).map_err(|e| AppError::Internal(e.to_string()))?;
    Ok(json)
}

async fn import_data(
    State(state): State<AppState>,
    body: String,
) -> Result<Json<serde_json::Value>, AppError> {
    // 限制导入数据大小 (10MB)
    const MAX_IMPORT_SIZE: usize = 10 * 1024 * 1024;
    if body.len() > MAX_IMPORT_SIZE {
        return Err(AppError::BadRequest("导入文件过大，最大支持 10MB".to_string()));
    }
    
    let imported: crate::models::Database = serde_json::from_str(&body)
        .map_err(|e| AppError::BadRequest(format!("JSON 格式无效: {}", e)))?;
    
    // 验证数据结构完整性
    if imported.assets.len() > 10000 || imported.transactions.len() > 100000 || imported.tags.len() > 1000 {
        return Err(AppError::BadRequest("数据量超出合理范围".to_string()));
    }
    
    {
        let mut db = state.db.write().await;
        *db = imported;
    }
    state.persist().await?;
    Ok(Json(serde_json::json!({ "success": true })))
}
