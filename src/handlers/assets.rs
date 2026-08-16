use axum::{
    routing::{get, post, patch, delete},
    Router, Json, extract::{Path, State},
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
    State(state): State<AppState>,
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
    State(state): State<AppState>,
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
    State(state): State<AppState>,
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
    State(state): State<AppState>,
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
    State(state): State<AppState>,
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
    State(state): State<AppState>,
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
    State(state): State<AppState>,
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