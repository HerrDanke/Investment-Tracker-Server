use axum::{
    routing::get,
    Router, Json, extract::{Path, Query, State},
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
    State(state): State<AppState>,
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
    State(state): State<AppState>,
    Path(id): Path<u32>,
) -> Result<Json<TransactionWithAsset>, AppError> {
    let db = state.db.read().await;
    let txn = db.transactions.iter().find(|t| t.id == id)
        .ok_or_else(|| AppError::NotFound(format!("Transaction {} not found", id)))?;
    let asset = db.assets.iter().find(|a| a.id == txn.asset_id).cloned();
    Ok(Json(TransactionWithAsset { transaction: txn.clone(), asset }))
}

async fn create_transaction(
    State(state): State<AppState>,
    Json(data): Json<CreateTransaction>,
) -> Result<Json<Transaction>, AppError> {
    // 验证交易类型
    if !matches!(data.txn_type.as_str(), "buy" | "sell" | "dividend") {
        return Err(AppError::BadRequest(format!("无效的交易类型: {}", data.txn_type)));
    }
    // 验证价格和数量
    if !data.price.is_finite() || data.price < 0.0 {
        return Err(AppError::BadRequest("价格必须为非负数".to_string()));
    }
    if !data.quantity.is_finite() || data.quantity <= 0.0 {
        return Err(AppError::BadRequest("数量必须为正数".to_string()));
    }
    if data.fee.map_or(false, |f| !f.is_finite() || f < 0.0) {
        return Err(AppError::BadRequest("手续费必须为非负数".to_string()));
    }
    if data.tax.map_or(false, |t| !t.is_finite() || t < 0.0) {
        return Err(AppError::BadRequest("税费必须为非负数".to_string()));
    }
    
    let txn = {
        let mut db = state.db.write().await;
        // 验证资产存在
        if !db.assets.iter().any(|a| a.id == data.asset_id) {
            return Err(AppError::NotFound(format!("资产 {} 不存在", data.asset_id)));
        }
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
        txn
    };
    state.persist().await?;
    Ok(Json(txn))
}

async fn update_transaction(
    State(state): State<AppState>,
    Path(id): Path<u32>,
    Json(data): Json<UpdateTransaction>,
) -> Result<Json<Transaction>, AppError> {
    let result = {
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
        txn.clone()
    };
    state.persist().await?;
    Ok(Json(result))
}

async fn delete_transaction(
    State(state): State<AppState>,
    Path(id): Path<u32>,
) -> Result<Json<serde_json::Value>, AppError> {
    let result = {
        let mut db = state.db.write().await;
        let before = db.transactions.len();
        db.transactions.retain(|t| t.id != id);
        if db.transactions.len() == before {
            return Err(AppError::NotFound(format!("Transaction {} not found", id)));
        }
        serde_json::json!({ "success": true })
    };
    state.persist().await?;
    Ok(Json(result))
}
