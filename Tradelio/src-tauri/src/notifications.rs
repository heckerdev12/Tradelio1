use tauri::Manager;
use tauri_plugin_notification::NotificationExt;

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

// For trading session alerts
#[tauri::command]
pub fn send_session_alert(
    app: tauri::AppHandle,
    session_name: String,
    status: String, // "started", "winding_down", "closed"
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