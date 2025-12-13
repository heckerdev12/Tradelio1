use rusqlite::{params, Connection, OptionalExtension};
use tauri::{AppHandle, Manager};
use anyhow::Result;
use std::fs;
use std::path::PathBuf;

fn get_db(app: &AppHandle) -> Result<Connection> {
    let mut path = app.path().app_data_dir()?;
    fs::create_dir_all(&path)?;
    path.push("tradelio.db");

    let conn = Connection::open(&path)?;
    
    // Create table if it doesn't exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS profile (
            id INTEGER PRIMARY KEY,
            full_name TEXT,
            bio TEXT,
            profile_pic TEXT
        )",
        [],
    )?;

    Ok(conn)
}

#[tauri::command]
pub fn save_profile_image(
    app: AppHandle,
    source_path: String,
) -> Result<String, String> {
    println!("Saving profile image from: {}", source_path);
    
    let conn = get_db(&app).map_err(|e| {
        eprintln!("Database error: {}", e);
        e.to_string()
    })?;

    // Create profile directory
    let mut dest_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    dest_dir.push("profile");
    
    fs::create_dir_all(&dest_dir).map_err(|e| {
        eprintln!("Failed to create profile directory: {}", e);
        e.to_string()
    })?;

    // Determine file extension
    let source_path_buf = PathBuf::from(&source_path);
    let extension = source_path_buf
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("png");

    let mut dest_file = dest_dir.clone();
    dest_file.push(format!("avatar.{}", extension));

    // Copy the file
    fs::copy(&source_path, &dest_file).map_err(|e| {
        eprintln!("Failed to copy file: {}", e);
        format!("Failed to copy file: {}", e)
    })?;

    let final_path = dest_file.to_string_lossy().to_string();
    println!("Image saved to: {}", final_path);

    // Save to database
    conn.execute(
        "INSERT OR REPLACE INTO profile (id, profile_pic)
         VALUES (1, ?1)",
        params![final_path],
    )
    .map_err(|e| {
        eprintln!("Database insert error: {}", e);
        e.to_string()
    })?;

    Ok(final_path)
}

#[tauri::command]
pub fn get_profile(app: AppHandle) -> Result<Option<String>, String> {
    let conn = get_db(&app).map_err(|e| {
        eprintln!("Database error: {}", e);
        e.to_string()
    })?;

    let profile_pic: Option<String> = conn
        .query_row(
            "SELECT profile_pic FROM profile WHERE id = 1",
            [],
            |row| row.get(0),
        )
        .optional()
        .unwrap_or(None); // Return None if no row exists instead of error

    println!("Loaded profile pic: {:?}", profile_pic);
    Ok(profile_pic)
}