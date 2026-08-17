use axum::{routing::get, Router};
use std::net::SocketAddr;
use std::path::PathBuf;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let data_dir = std::env::var("DATA_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("./data"));
    
    std::fs::create_dir_all(&data_dir).expect("Failed to create data directory");

    let state = investment_tracker_server::db::AppState::new(&data_dir);

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Public routes (no auth required)
    let public_routes = investment_tracker_server::handlers::auth_routes();

    // Protected routes (auth required)
    let protected_routes = investment_tracker_server::handlers::routes()
        .layer(axum::middleware::from_fn(investment_tracker_server::middleware::auth_middleware));

    let api_router = Router::new()
        .merge(public_routes)
        .merge(protected_routes)
        .with_state(state);

    let app = Router::new()
        .route("/", get(root_handler))
        .route("/api/health", get(health_check))
        .nest("/api", api_router)
        .layer(cors)
        .layer(TraceLayer::new_for_http());

    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    tracing::info!("Server listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> &'static str {
    "OK"
}

async fn root_handler() -> axum::response::Html<&'static str> {
    axum::response::Html(r#"<!DOCTYPE html>
<html><head><title>Investment Tracker Server</title></head>
<body>
<h1>Investment Tracker Server</h1>
<p>API is running. Available endpoints:</p>
<ul>
<li><a href="/api/health">/api/health</a> - Health check</li>
<li><a href="/api/auth/register">/api/auth/register</a> - Register</li>
<li><a href="/api/auth/login">/api/auth/login</a> - Login</li>
<li><a href="/api/assets">/api/assets</a> - Assets (requires auth)</li>
<li><a href="/api/transactions">/api/transactions</a> - Transactions (requires auth)</li>
<li><a href="/api/tags">/api/tags</a> - Tags (requires auth)</li>
<li><a href="/api/summary">/api/summary</a> - Summary (requires auth)</li>
<li><a href="/api/export">/api/export</a> - Export data (requires auth)</li>
</ul>
</body></html>"#)
}
