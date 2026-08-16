use axum::{
    routing::{get, post, patch, delete},
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
    State(state): State<AppState>,
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
    State(state): State<AppState>,
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