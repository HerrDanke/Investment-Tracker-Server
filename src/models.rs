use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Asset {
    pub id: u32,
    pub name: String,
    pub symbol: Option<String>,
    #[serde(alias = "type", alias = "asset_type")]
    pub asset_type: String,
    pub currency: String,
    #[serde(alias = "createdAt", alias = "created_at")]
    pub created_at: String,
    #[serde(alias = "updatedAt", alias = "updated_at")]
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub id: u32,
    #[serde(alias = "assetId", alias = "asset_id")]
    pub asset_id: u32,
    #[serde(alias = "type", alias = "txn_type")]
    pub txn_type: String,
    pub date: String,
    pub price: f64,
    pub quantity: f64,
    pub fee: f64,
    pub tax: f64,
    pub currency: String,
    pub notes: Option<String>,
    #[serde(alias = "createdAt", alias = "created_at")]
    pub created_at: String,
    #[serde(alias = "updatedAt", alias = "updated_at")]
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tag {
    pub id: u32,
    pub name: String,
    pub category: String,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetTag {
    #[serde(alias = "assetId", alias = "asset_id")]
    pub asset_id: u32,
    #[serde(alias = "tagId", alias = "tag_id")]
    pub tag_id: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Sequence {
    pub assets: u32,
    pub transactions: u32,
    pub tags: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Database {
    pub assets: Vec<Asset>,
    pub transactions: Vec<Transaction>,
    pub tags: Vec<Tag>,
    #[serde(alias = "assetTags", alias = "asset_tags")]
    pub asset_tags: Vec<AssetTag>,
    #[serde(rename = "_seq")]
    pub seq: Sequence,
}

impl Default for Database {
    fn default() -> Self {
        Self {
            assets: Vec::new(),
            transactions: Vec::new(),
            tags: Vec::new(),
            asset_tags: Vec::new(),
            seq: Sequence {
                assets: 0,
                transactions: 0,
                tags: 0,
            },
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct CreateAsset {
    pub name: String,
    pub symbol: Option<String>,
    #[serde(alias = "type", alias = "asset_type")]
    pub asset_type: Option<String>,
    pub currency: Option<String>,
    #[serde(alias = "tagIds", alias = "tag_ids")]
    pub tag_ids: Option<Vec<u32>>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct UpdateAsset {
    pub name: Option<String>,
    pub symbol: Option<String>,
    #[serde(alias = "type", alias = "asset_type")]
    pub asset_type: Option<String>,
    pub currency: Option<String>,
    #[serde(alias = "tagIds", alias = "tag_ids")]
    pub tag_ids: Option<Vec<u32>>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CreateTransaction {
    #[serde(alias = "assetId", alias = "asset_id")]
    pub asset_id: u32,
    #[serde(alias = "type", alias = "txnType", alias = "txn_type")]
    pub txn_type: String,
    pub date: String,
    pub price: f64,
    pub quantity: f64,
    pub fee: Option<f64>,
    pub tax: Option<f64>,
    pub currency: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct UpdateTransaction {
    #[serde(alias = "assetId", alias = "asset_id")]
    pub asset_id: Option<u32>,
    #[serde(alias = "type", alias = "txnType", alias = "txn_type")]
    pub txn_type: Option<String>,
    pub date: Option<String>,
    pub price: Option<f64>,
    pub quantity: Option<f64>,
    pub fee: Option<f64>,
    pub tax: Option<f64>,
    pub currency: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CreateTag {
    pub name: String,
    pub category: Option<String>,
    pub color: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct UpdateTag {
    pub name: Option<String>,
    pub category: Option<String>,
    pub color: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct TransactionQuery {
    #[serde(alias = "assetId", alias = "asset_id")]
    pub asset_id: Option<u32>,
    #[serde(alias = "type", alias = "txnType", alias = "txn_type")]
    pub txn_type: Option<String>,
    #[serde(alias = "startDate", alias = "start_date")]
    pub start_date: Option<String>,
    #[serde(alias = "endDate", alias = "end_date")]
    pub end_date: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct AssetWithTags {
    #[serde(flatten)]
    pub asset: Asset,
    pub tags: Vec<Tag>,
}

#[derive(Debug, Clone, Serialize)]
pub struct TransactionWithAsset {
    #[serde(flatten)]
    pub transaction: Transaction,
    pub asset: Option<Asset>,
}

#[derive(Debug, Clone, Serialize)]
pub struct AssetSummary {
    pub id: u32,
    pub name: String,
    pub symbol: Option<String>,
    #[serde(alias = "assetType", alias = "asset_type")]
    pub asset_type: String,
    pub currency: String,
    pub holding: f64,
    #[serde(alias = "buyCost", alias = "buy_cost")]
    pub buy_cost: f64,
    #[serde(alias = "sellRevenue", alias = "sell_revenue")]
    pub sell_revenue: f64,
    #[serde(alias = "avgBuyCost", alias = "avg_buy_cost")]
    pub avg_buy_cost: f64,
    #[serde(alias = "holdingCostBasis", alias = "holding_cost_basis")]
    pub holding_cost_basis: f64,
    #[serde(alias = "realizedPnl", alias = "realized_pnl")]
    pub realized_pnl: Option<f64>,
    pub tags: Vec<Tag>,
}

#[derive(Debug, Clone, Serialize)]
pub struct Overview {
    pub total_assets: usize,
    pub total_investment: f64,
    pub total_realized_pnl: f64,
    pub total_dividends: f64,
    pub total_fees: f64,
    pub total_tax: f64,
    pub cost_basis_of_holdings: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct Summary {
    pub overview: Overview,
    pub type_distribution: HashMap<String, f64>,
    pub currency_distribution: HashMap<String, f64>,
    pub assets: Vec<AssetSummary>,
}

// ==================== AUTH MODELS ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub username: String,
    pub password_hash: String,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub username: String,
    pub password: String,
    pub password_confirm: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: UserInfo,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserInfo {
    pub id: String,
    pub username: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub username: String,
    pub exp: usize,
}