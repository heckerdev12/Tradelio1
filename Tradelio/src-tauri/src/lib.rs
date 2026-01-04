#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod passcode;
mod profile;
mod accounts;
mod folders;
mod notifications; // Add this line

use passcode::PasscodeState;
use accounts::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|_app| {
            match folders::init_tradelio_folders() {
                Ok(path) => {
                    println!("✓ Tradelio folders ready at: {:?}", path);
                }
                Err(e) => {
                    eprintln!("⚠ Warning: Could not create Tradelio folders: {}", e);
                }
            }
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init()) // Add this line
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
            profile::get_profile,

            // Accounts and Transactions
            add_account,
            get_all_accounts,
            update_account_balance,
            delete_account,
            add_transaction,
            get_all_transactions,
            get_transactions_by_account,
            update_account,
            update_transaction,
            
            // Folders
            folders::get_tradelio_path,
            folders::get_saved_tradelio_path,
            folders::open_tradelio_folder,
            folders::open_folder_at_path,  
            folders::create_tradelio_at_custom_location,

            // Notifications
            notifications::send_test_notification,
            notifications::send_trade_notification,
            notifications::send_session_alert,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}