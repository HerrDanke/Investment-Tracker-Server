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
    let imported: crate::models::Database = serde_json::from_str(&body)
        .map_err(|e| AppError::BadRequest(format!("Invalid JSON: {}", e)))?;
    let mut db = state.db.write().await;
    *db = imported;
    state.persist().await?;
    Ok(Json(serde_json::json!({ "success": true })))
}
