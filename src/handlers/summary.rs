use axum::{routing::get, Router, Json, extract::State};
use crate::db::AppState;
use crate::models::*;
use crate::error::AppError;

pub fn routes() -> Router<AppState> {
    Router::new().route("/summary", get(get_summary))
}

async fn get_summary(State(state): State<AppState>) -> Result<Json<Summary>, AppError> {
    let db = state.db.read().await;
    let mut total_investment = 0.0;
    let mut total_fees = 0.0;
    let mut total_tax = 0.0;
    let mut total_dividends = 0.0;
    let mut total_realized_pnl = 0.0;
    let mut cost_basis_of_holdings = 0.0;

    let assets: Vec<AssetSummary> = db.assets.iter().map(|asset| {
        let txns: Vec<&Transaction> = db.transactions.iter().filter(|t| t.asset_id == asset.id).collect();
        let buy_txns: Vec<&&Transaction> = txns.iter().filter(|t| t.txn_type == "BUY").collect();
        let sell_txns: Vec<&&Transaction> = txns.iter().filter(|t| t.txn_type == "SELL").collect();
        let buy_qty: f64 = buy_txns.iter().map(|t| t.quantity).sum();
        let sell_qty: f64 = sell_txns.iter().map(|t| t.quantity).sum();
        let holding = buy_qty - sell_qty;
        let buy_cost: f64 = buy_txns.iter().map(|t| t.price * t.quantity + t.fee + t.tax).sum();
        let sell_revenue: f64 = sell_txns.iter().map(|t| t.price * t.quantity - t.fee - t.tax).sum();
        let fees: f64 = txns.iter().map(|t| t.fee).sum();
        let tax: f64 = txns.iter().map(|t| t.tax).sum();
        let dividends: f64 = txns.iter().filter(|t| t.txn_type == "DIVIDEND").map(|t| t.quantity * t.price - t.tax).sum();
        let avg_buy_cost = if buy_qty > 0.0 { buy_cost / buy_qty } else { 0.0 };
        let holding_cost_basis = holding * avg_buy_cost;
        total_investment += buy_cost;
        total_fees += fees;
        total_tax += tax;
        total_dividends += dividends;
        cost_basis_of_holdings += holding_cost_basis;
        let realized_pnl = if holding <= 0.0001 { Some(sell_revenue - buy_cost) } else { None };
        if let Some(pnl) = realized_pnl { total_realized_pnl += pnl; }
        let tags: Vec<Tag> = db.asset_tags.iter()
            .filter(|at| at.asset_id == asset.id)
            .filter_map(|at| db.tags.iter().find(|t| t.id == at.tag_id).cloned())
            .collect();
        AssetSummary {
            id: asset.id,
            name: asset.name.clone(),
            symbol: asset.symbol.clone(),
            asset_type: asset.asset_type.clone(),
            currency: asset.currency.clone(),
            holding,
            buy_cost,
            sell_revenue,
            avg_buy_cost,
            holding_cost_basis,
            realized_pnl,
            tags,
        }
    }).collect();

    let mut type_dist = std::collections::HashMap::new();
    for a in &assets {
        *type_dist.entry(a.asset_type.clone()).or_insert(0.0) += a.holding_cost_basis;
    }

    let mut curr_dist = std::collections::HashMap::new();
    for a in &db.assets {
        let buy_cost: f64 = db.transactions.iter()
            .filter(|t| t.asset_id == a.id && t.txn_type == "BUY")
            .map(|t| t.price * t.quantity)
            .sum();
        *curr_dist.entry(a.currency.clone()).or_insert(0.0) += buy_cost;
    }

    Ok(Json(Summary {
        overview: Overview {
            total_assets: db.assets.len(),
            total_investment,
            total_realized_pnl,
            total_dividends,
            total_fees,
            total_tax,
            cost_basis_of_holdings,
        },
        type_distribution: type_dist,
        currency_distribution: curr_dist,
        assets,
    }))
}
