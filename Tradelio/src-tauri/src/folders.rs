use std::fs;
use std::path::PathBuf;
use tauri::Manager;
use tauri_plugin_store::StoreExt;

pub fn init_tradelio_folders() -> Result<PathBuf, String> {
    let mut documents_path = PathBuf::new();
    
    #[cfg(target_os = "windows")]
    {
        if let Some(user_profile) = std::env::var_os("USERPROFILE") {
            documents_path.push(user_profile);
            documents_path.push("Documents");
        } else {
            return Err("Could not find Documents folder".to_string());
        }
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        if let Some(home) = std::env::var_os("HOME") {
            documents_path.push(home);
            documents_path.push("Documents");
        } else {
            return Err("Could not find Documents folder".to_string());
        }
    }
    
    documents_path.push("Tradelio");
    
    // Create main folder and subfolders
    fs::create_dir_all(documents_path.join("EA_Manual"))
        .map_err(|e| format!("Failed to create EA_Manual folder: {}", e))?;
    fs::create_dir_all(documents_path.join("MT5_Auto"))
        .map_err(|e| format!("Failed to create MT5_Auto folder: {}", e))?;
    
    Ok(documents_path)
}

// Create Tradelio structure at a custom location
pub fn create_tradelio_at_path(base_path: PathBuf) -> Result<PathBuf, String> {
    let tradelio_path = base_path.join("Tradelio");
    
    // Create main folder and subfolders
    fs::create_dir_all(tradelio_path.join("EA_Manual"))
        .map_err(|e| format!("Failed to create EA_Manual folder: {}", e))?;
    fs::create_dir_all(tradelio_path.join("MT5_Auto"))
        .map_err(|e| format!("Failed to create MT5_Auto folder: {}", e))?;
    
    Ok(tradelio_path)
}

#[tauri::command]
pub fn get_saved_tradelio_path(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let store = app.store("settings.json")
        .map_err(|e| format!("Failed to access store: {}", e))?;
    
    Ok(store.get("tradelio_path")
        .and_then(|v| v.as_str().map(|s| s.to_string())))
}

#[tauri::command]
pub fn get_tradelio_path(app: tauri::AppHandle) -> Result<String, String> {
    // Try to get saved path first
    if let Ok(Some(saved_path)) = get_saved_tradelio_path(app) {
        let path = PathBuf::from(&saved_path);
        if path.exists() {
            return Ok(saved_path);
        }
    }
    
    // Fall back to default Documents location
    init_tradelio_folders()
        .map(|path| path.to_string_lossy().to_string())
}

// Open folder at a specific path (user provides the path)
#[tauri::command]
pub fn open_folder_at_path(folder_path: String) -> Result<(), String> {
    let path = PathBuf::from(folder_path);
    
    if !path.exists() {
        return Err("Folder does not exist".to_string());
    }
    
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(path)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }
    
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(path)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }
    
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(path)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }
    
    Ok(())
}

// Keep the old command for backwards compatibility
#[tauri::command]
pub fn open_tradelio_folder(app: tauri::AppHandle) -> Result<(), String> {
    let path = get_tradelio_path(app)?;
    open_folder_at_path(path)
}

// Create Tradelio folder at user-selected location and save it
#[tauri::command]
pub fn create_tradelio_at_custom_location(
    app: tauri::AppHandle,
    selected_path: String
) -> Result<String, String> {
    let base_path = PathBuf::from(selected_path);
    
    if !base_path.exists() {
        return Err("Selected path does not exist".to_string());
    }
    
    let tradelio_path = create_tradelio_at_path(base_path)?;
    let path_string = tradelio_path.to_string_lossy().to_string();
    
    // Save to store
    let store = app.store("settings.json")
        .map_err(|e| format!("Failed to access store: {}", e))?;
    
    store.set("tradelio_path", serde_json::json!(path_string.clone()));
    store.save()
        .map_err(|e| format!("Failed to save path: {}", e))?;
    
    Ok(path_string)
}