use bcrypt::{hash, verify, DEFAULT_COST};
use keyring::Entry;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

const SERVICE_NAME: &str = "tradelio";
const PASSCODE_KEY: &str = "user_passcode";
const SETTINGS_KEY: &str = "lock_settings";

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LockSettings {
    pub passcode_enabled: bool,
    pub auto_lock_minutes: u32, // 0 means disabled
}

impl Default for LockSettings {
    fn default() -> Self {
        Self {
            passcode_enabled: false,
            auto_lock_minutes: 5,
        }
    }
}

pub struct PasscodeState {
    pub is_locked: Mutex<bool>,
    pub settings: Mutex<LockSettings>,
}

impl PasscodeState {
    pub fn new() -> Self {
        // Load settings from keyring or use defaults
        let settings = load_settings().unwrap_or_default();
        let is_locked = settings.passcode_enabled; // Lock on startup if passcode is set
        
        Self {
            is_locked: Mutex::new(is_locked),
            settings: Mutex::new(settings),
        }
    }
}

// Save passcode securely using keyring
pub fn save_passcode(passcode: &str) -> Result<(), String> {
    let hashed = hash(passcode, DEFAULT_COST).map_err(|e| e.to_string())?;
    
    let entry = Entry::new(SERVICE_NAME, PASSCODE_KEY)
        .map_err(|e| format!("Failed to create keyring entry: {}", e))?;
    
    entry
        .set_password(&hashed)
        .map_err(|e| format!("Failed to save passcode: {}", e))?;
    
    Ok(())
}

// Verify passcode
pub fn verify_passcode(passcode: &str) -> Result<bool, String> {
    let entry = Entry::new(SERVICE_NAME, PASSCODE_KEY)
        .map_err(|e| format!("Failed to create keyring entry: {}", e))?;
    
    let stored_hash = entry
        .get_password()
        .map_err(|e| format!("Failed to get passcode: {}", e))?;
    
    verify(passcode, &stored_hash).map_err(|e| e.to_string())
}

// Check if passcode exists
pub fn passcode_exists() -> bool {
    Entry::new(SERVICE_NAME, PASSCODE_KEY)
        .and_then(|entry| entry.get_password())
        .is_ok()
}

// Delete passcode
pub fn delete_passcode() -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, PASSCODE_KEY)
        .map_err(|e| format!("Failed to create keyring entry: {}", e))?;
    
    entry
        .delete_password()  // ✅ CORRECT METHOD
        .map_err(|e| format!("Failed to delete passcode: {}", e))?;
    
    Ok(())
}

// Save settings
fn save_settings(settings: &LockSettings) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, SETTINGS_KEY)
        .map_err(|e| format!("Failed to create keyring entry: {}", e))?;
    
    let json = serde_json::to_string(settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;
    
    entry
        .set_password(&json)
        .map_err(|e| format!("Failed to save settings: {}", e))?;
    
    Ok(())
}

// Load settings
fn load_settings() -> Result<LockSettings, String> {
    let entry = Entry::new(SERVICE_NAME, SETTINGS_KEY)
        .map_err(|e| format!("Failed to create keyring entry: {}", e))?;
    
    let json = entry
        .get_password()
        .map_err(|e| format!("Failed to load settings: {}", e))?;
    
    serde_json::from_str(&json)
        .map_err(|e| format!("Failed to deserialize settings: {}", e))
}

// Tauri Commands
#[tauri::command]
pub fn check_passcode_exists() -> bool {
    passcode_exists()
}

#[tauri::command]
pub fn setup_passcode(passcode: String, state: State<PasscodeState>) -> Result<(), String> {
    if passcode.len() != 6 || !passcode.chars().all(|c| c.is_numeric()) {
        return Err("Passcode must be exactly 6 digits".to_string());
    }
    
    save_passcode(&passcode)?;
    
    // Enable passcode in settings
    let mut settings = state.settings.lock().unwrap();
    settings.passcode_enabled = true;
    save_settings(&settings)?;
    
    // Lock the app
    let mut is_locked = state.is_locked.lock().unwrap();
    *is_locked = true;
    
    Ok(())
}

#[tauri::command]
pub fn unlock_app(passcode: String, state: State<PasscodeState>) -> Result<bool, String> {
    let is_valid = verify_passcode(&passcode)?;
    
    if is_valid {
        let mut is_locked = state.is_locked.lock().unwrap();
        *is_locked = false;
    }
    
    Ok(is_valid)
}

#[tauri::command]
pub fn lock_app(state: State<PasscodeState>) -> Result<(), String> {
    let settings = state.settings.lock().unwrap();
    
    if settings.passcode_enabled {
        let mut is_locked = state.is_locked.lock().unwrap();
        *is_locked = true;
        Ok(())
    } else {
        Err("Passcode not enabled".to_string())
    }
}

#[tauri::command]
pub fn is_app_locked(state: State<PasscodeState>) -> bool {
    *state.is_locked.lock().unwrap()
}

#[tauri::command]
pub fn get_lock_settings(state: State<PasscodeState>) -> LockSettings {
    state.settings.lock().unwrap().clone()
}

#[tauri::command]
pub fn update_lock_settings(
    auto_lock_minutes: u32,
    state: State<PasscodeState>,
) -> Result<(), String> {
    let mut settings = state.settings.lock().unwrap();
    settings.auto_lock_minutes = auto_lock_minutes;
    save_settings(&settings)?;
    Ok(())
}

#[tauri::command]
pub fn disable_passcode(passcode: String, state: State<PasscodeState>) -> Result<(), String> {
    // Verify passcode before disabling
    let is_valid = verify_passcode(&passcode)?;
    
    if !is_valid {
        return Err("Invalid passcode".to_string());
    }
    
    delete_passcode()?;
    
    let mut settings = state.settings.lock().unwrap();
    settings.passcode_enabled = false;
    save_settings(&settings)?;
    
    let mut is_locked = state.is_locked.lock().unwrap();
    *is_locked = false;
    
    Ok(())
}