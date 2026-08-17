use axum::{
    response::{IntoResponse, Response},
    http::StatusCode,
    Json,
};
use serde_json::json;

#[derive(Debug)]
pub enum AppError {
    NotFound(String),
    BadRequest(String),
    Internal(String),
    Unauthorized(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg),
            AppError::Internal(_) => {
                // 内部错误不暴露详细信息给客户端
                tracing::error!("Internal server error: {:?}", self);
                (StatusCode::INTERNAL_SERVER_ERROR, "服务器内部错误".to_string())
            }
            AppError::Unauthorized(msg) => (StatusCode::UNAUTHORIZED, msg),
        };
        (status, Json(json!({ "error": message }))).into_response()
    }
}

impl From<std::io::Error> for AppError {
    fn from(e: std::io::Error) -> Self {
        AppError::Internal(e.to_string())
    }
}

impl From<serde_json::Error> for AppError {
    fn from(e: serde_json::Error) -> Self {
        AppError::Internal(e.to_string())
    }
}

impl From<String> for AppError {
    fn from(e: String) -> Self {
        AppError::Internal(e)
    }
}
