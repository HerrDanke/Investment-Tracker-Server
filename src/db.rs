use crate::models::{Database, User};
use std::path::Path;
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Clone)]
pub struct AppState {
    pub db: Arc<RwLock<Database>>,
    pub users: Arc<RwLock<Vec<User>>>,
    pub data_path: std::path::PathBuf,
    pub users_path: std::path::PathBuf,
}

impl AppState {
    pub fn new(data_dir: &Path) -> Self {
        let data_path = data_dir.join("data.json");
        let users_path = data_dir.join("users.json");

        let db = if data_path.exists() {
            match std::fs::read_to_string(&data_path) {
                Ok(content) if !content.trim().is_empty() => {
                    serde_json::from_str(&content).unwrap_or_else(|e| {
                        tracing::error!("Failed to parse data.json: {}. Starting with empty database.", e);
                        Database::default()
                    })
                }
                _ => Database::default(),
            }
        } else {
            Database::default()
        };

        let users = if users_path.exists() {
            match std::fs::read_to_string(&users_path) {
                Ok(content) if !content.trim().is_empty() => {
                    serde_json::from_str(&content).unwrap_or_else(|e| {
                        tracing::error!("Failed to parse users.json: {}. Starting with empty users.", e);
                        Vec::new()
                    })
                }
                _ => Vec::new(),
            }
        } else {
            Vec::new()
        };

        AppState {
            db: Arc::new(RwLock::new(db)),
            users: Arc::new(RwLock::new(users)),
            data_path,
            users_path,
        }
    }

    pub async fn persist(&self) -> Result<(), String> {
        let json = {
            let db = self.db.read().await;
            serde_json::to_string_pretty(&*db).map_err(|e| e.to_string())?
        };
        tokio::fs::write(&self.data_path, json).await.map_err(|e| e.to_string())?;
        Ok(())
    }

    pub async fn persist_users(&self) -> Result<(), String> {
        let json = {
            let users = self.users.read().await;
            serde_json::to_string_pretty(&*users).map_err(|e| e.to_string())?
        };
        tokio::fs::write(&self.users_path, json).await.map_err(|e| e.to_string())?;
        Ok(())
    }
}
