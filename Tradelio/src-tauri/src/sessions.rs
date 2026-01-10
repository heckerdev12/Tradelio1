use tauri::Manager;
use tauri_plugin_notification::NotificationExt;
use rusqlite::{params, Connection};
use anyhow::Result;
use std::fs;

// Get database connection
fn get_db(app: &tauri::AppHandle) -> Result<Connection> {
    let mut path = app.path().app_data_dir()?;
    fs::create_dir_all(&path)?;
    path.push("tradelio.db");

    let conn = Connection::open(&path)?;
    
    // Create settings table if it doesn't exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )",
        [],
    )?;

    Ok(conn)
}

#[tauri::command]
pub fn send_test_notification(app: tauri::AppHandle, title: String, body: String) -> Result<(), String> {
    app.notification()
        .builder()
        .title(title)
        .body(body)
        .show()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn send_trade_notification(
    app: tauri::AppHandle,
    symbol: String,
    trade_type: String,
    quantity: i32,
    price: f64,
) -> Result<(), String> {
    let title = format!("{} Trade Executed", trade_type);
    let body = format!(
        "{} {} shares of {} at ${:.2}",
        trade_type, quantity, symbol, price
    );
    
    app.notification()
        .builder()
        .title(title)
        .body(body)
        .show()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn send_session_alert(
    app: tauri::AppHandle,
    session_name: String,
    status: String,
) -> Result<(), String> {
    let (title, body) = match status.as_str() {
        "started" => (
            format!("🔔 {} Session Started", session_name),
            "Markets are now active. Good luck trading!".to_string()
        ),
        "winding_down" => (
            format!("⏰ {} Session Winding Down", session_name),
            "Markets closing soon. Consider wrapping up positions.".to_string()
        ),
        "closed" => (
            format!("🔕 {} Session Closed", session_name),
            "Markets are now closed. Review your trades.".to_string()
        ),
        _ => (
            format!("📊 {} Session Update", session_name),
            "Market status changed.".to_string()
        )
    };
    
    app.notification()
        .builder()
        .title(title)
        .body(body)
        .show()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_session_notifications_enabled(app: tauri::AppHandle) -> Result<bool, String> {
    let conn = get_db(&app).map_err(|e| e.to_string())?;
    
    let result: Result<String, _> = conn.query_row(
        "SELECT value FROM app_settings WHERE key = 'session_notifications_enabled'",
        [],
        |row| row.get(0)
    );
    
    match result {
        Ok(value) => Ok(value == "true"),
        Err(_) => Ok(false), // Default to false if not set
    }
}

#[tauri::command]
pub fn set_session_notifications_enabled(app: tauri::AppHandle, enabled: bool) -> Result<(), String> {
    let conn = get_db(&app).map_err(|e| e.to_string())?;
    
    conn.execute(
        "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('session_notifications_enabled', ?1)",
        params![if enabled { "true" } else { "false" }],
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}