use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation, Algorithm};
use crate::error::AppError;
use crate::models::Claims;

const TOKEN_EXPIRY_HOURS: i64 = 24 * 7; // 7 days

fn get_jwt_secret() -> Vec<u8> {
    std::env::var("JWT_SECRET")
        .map(|s| s.into_bytes())
        .unwrap_or_else(|_| b"investment-tracker-secret-key-change-in-production".to_vec())
}

pub fn hash_password(password: &str) -> Result<String, AppError> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| AppError::Internal(format!("Password hash failed: {}", e)))?;
    Ok(password_hash.to_string())
}

pub fn verify_password(password: &str, hash: &str) -> Result<bool, AppError> {
    let parsed_hash = PasswordHash::new(hash)
        .map_err(|e| AppError::Internal(format!("Invalid hash: {}", e)))?;
    let argon2 = Argon2::default();
    Ok(argon2.verify_password(password.as_bytes(), &parsed_hash).is_ok())
}

pub fn generate_token(user_id: &str, username: &str) -> Result<String, AppError> {
    let exp = Utc::now()
        .checked_add_signed(Duration::hours(TOKEN_EXPIRY_HOURS))
        .expect("valid timestamp")
        .timestamp() as usize;

    let claims = Claims {
        sub: user_id.to_string(),
        username: username.to_string(),
        exp,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(&get_jwt_secret()),
    )
    .map_err(|e| AppError::Internal(format!("Token generation failed: {}", e)))
}

pub fn verify_token(token: &str) -> Result<Claims, AppError> {
    let mut validation = Validation::new(Algorithm::HS256);
    validation.validate_exp = true;
    validation.required_spec_claims.insert("exp".to_string());
    
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(&get_jwt_secret()),
        &validation,
    )
    .map(|data| data.claims)
    .map_err(|_| AppError::Unauthorized("Invalid or expired token".to_string()))
}
