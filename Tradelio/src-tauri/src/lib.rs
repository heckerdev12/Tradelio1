#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod passcode;
mod profile;

use passcode::PasscodeState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())  // ADD THIS LINE
        .manage(PasscodeState::new())
        .invoke_handler(tauri::generate_handler![
            // Passcode
            passcode::check_passcode_exists,
            passcode::setup_passcode,
            passcode::unlock_app,
            passcode::lock_app,
            passcode::is_app_locked,
            passcode::get_lock_settings,
            passcode::update_lock_settings,
            passcode::disable_passcode,

            // Profile
            profile::save_profile_image,
            profile::get_profile
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}