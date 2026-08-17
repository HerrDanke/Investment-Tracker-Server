use axum::{
    routing::post,
    Router, Json, extract::State,
};
use crate::auth::{hash_password, verify_password, generate_token};
use crate::db::AppState;
use crate::error::AppError;
use crate::models::*;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/auth/register", post(register))
        .route("/auth/login", post(login))
}

async fn register(
    State(state): State<AppState>,
    Json(req): Json<RegisterRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    // Validate
    if req.username.len() < 3 {
        return Err(AppError::BadRequest("用户名至少3个字符".to_string()));
    }
    if req.password.len() < 6 {
        return Err(AppError::BadRequest("密码至少6个字符".to_string()));
    }
    if req.password != req.password_confirm {
        return Err(AppError::BadRequest("两次密码输入不一致".to_string()));
    }

    // Check if username exists
    let users = state.users.read().await;
    if users.iter().any(|u| u.username == req.username) {
        return Err(AppError::BadRequest("用户名已存在".to_string()));
    }
    drop(users);

    // Create user
    let user_id = uuid::Uuid::new_v4().to_string();
    let password_hash = hash_password(&req.password)?;
    let created_at = chrono::Utc::now().to_rfc3339();

    let user = User {
        id: user_id.clone(),
        username: req.username.clone(),
        password_hash,
        created_at,
    };

    {
        let mut users = state.users.write().await;
        users.push(user);
    }
    state.persist_users().await?;

    // Generate token
    let token = generate_token(&user_id, &req.username)?;

    Ok(Json(AuthResponse {
        token,
        user: UserInfo {
            id: user_id,
            username: req.username,
        },
    }))
}

async fn login(
    State(state): State<AppState>,
    Json(req): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    let users = state.users.read().await;
    let user = users
        .iter()
        .find(|u| u.username == req.username)
        .ok_or_else(|| AppError::Unauthorized("用户名或密码错误".to_string()))?;

    if !verify_password(&req.password, &user.password_hash)? {
        return Err(AppError::Unauthorized("用户名或密码错误".to_string()));
    }

    let token = generate_token(&user.id, &user.username)?;

    Ok(Json(AuthResponse {
        token,
        user: UserInfo {
            id: user.id.clone(),
            username: user.username.clone(),
        },
    }))
}
