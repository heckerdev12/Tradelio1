#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod passcode;
mod profile;
mod accounts;
mod folders;
mod sessions;

use passcode::PasscodeState;
use accounts::*;
use tauri::{Manager, menu::{Menu, MenuItem}, tray::{TrayIconBuilder, TrayIconEvent}};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Initialize folders
            match folders::init_tradelio_folders() {
                Ok(path) => {
                    println!("✓ Tradelio folders ready at: {:?}", path);
                }
                Err(e) => {
                    eprintln!("⚠ Warning: Could not create Tradelio folders: {}", e);
                }
            }

            // Create system tray menu
            let show_i = MenuItem::with_id(app, "show", "Show Tradelio", true, None::<&str>)?;
            let hide_i = MenuItem::with_id(app, "hide", "Hide Window", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            
            let menu = Menu::with_items(app, &[&show_i, &hide_i, &quit_i])?;

            // Build system tray
            let _tray = TrayIconBuilder::with_id("main-tray")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "hide" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.hide();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { button: tauri::tray::MouseButton::Left, .. } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            // Handle window close -> minimize to tray
            if let Some(window) = app.get_webview_window("main") {
                let window_clone = window.clone(); // Clone the window for the closure
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = window_clone.hide(); // Use the cloned window
                    }
                });
            }

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
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
            get_account_balance_at_date,
            
            // Folders
            folders::get_tradelio_path,
            folders::get_saved_tradelio_path,
            folders::open_tradelio_folder,
            folders::open_folder_at_path,  
            folders::create_tradelio_at_custom_location,

            // Trading sessions toast
            sessions::send_test_notification,
            sessions::send_trade_notification,
            sessions::send_session_alert,
            sessions::get_session_notifications_enabled,
            sessions::set_session_notifications_enabled,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}