use axum::Router;
use crate::db::AppState;

pub mod assets;
pub mod transactions;
pub mod tags;
pub mod summary;
pub mod export_import;
pub mod auth;

pub fn routes() -> Router<AppState> {
    Router::new()
        .merge(assets::routes())
        .merge(transactions::routes())
        .merge(tags::routes())
        .merge(summary::routes())
        .merge(export_import::routes())
}

pub fn auth_routes() -> Router<AppState> {
    auth::routes()
}
