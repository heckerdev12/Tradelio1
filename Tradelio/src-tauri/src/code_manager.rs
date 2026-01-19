// src/code_manager.rs
use rusqlite::{params, Connection, Result as SqlResult};
use serde::{Deserialize, Serialize};
use chrono::Utc;
use tauri::{AppHandle, Manager};
use std::fs;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CodeSnippet {
    pub id: Option<i64>,
    pub title: String,
    pub language: String,
    pub code: String,
    pub description: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

// Helper function to get database connection
fn get_db(app: &AppHandle) -> Result<Connection, String> {
    let mut path = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    path.push("tradelio.db");
    
    let conn = Connection::open(&path).map_err(|e| e.to_string())?;
    
    // Create table if it doesn't exist (auto-init on first use)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS code_snippets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            language TEXT NOT NULL,
            code TEXT NOT NULL,
            description TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    ).map_err(|e| e.to_string())?;
    
    Ok(conn)
}

// Database operations
fn create_code_snippet(
    conn: &Connection,
    title: String,
    language: String,
    code: String,
    description: Option<String>,
) -> SqlResult<i64> {
    let now = Utc::now().to_rfc3339();
    
    conn.execute(
        "INSERT INTO code_snippets (title, language, code, description, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![title, language, code, description, now, now],
    )?;
    
    Ok(conn.last_insert_rowid())
}

fn get_all_code_snippets(conn: &Connection) -> SqlResult<Vec<CodeSnippet>> {
    let mut stmt = conn.prepare(
        "SELECT id, title, language, code, description, created_at, updated_at
         FROM code_snippets
         ORDER BY updated_at DESC"
    )?;
    
    let snippets = stmt.query_map([], |row| {
        Ok(CodeSnippet {
            id: Some(row.get(0)?),
            title: row.get(1)?,
            language: row.get(2)?,
            code: row.get(3)?,
            description: row.get(4)?,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
        })
    })?;
    
    snippets.collect()
}

fn get_code_snippet_by_id(conn: &Connection, id: i64) -> SqlResult<CodeSnippet> {
    conn.query_row(
        "SELECT id, title, language, code, description, created_at, updated_at
         FROM code_snippets
         WHERE id = ?1",
        params![id],
        |row| {
            Ok(CodeSnippet {
                id: Some(row.get(0)?),
                title: row.get(1)?,
                language: row.get(2)?,
                code: row.get(3)?,
                description: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        },
    )
}

fn update_code_snippet(
    conn: &Connection,
    id: i64,
    title: String,
    language: String,
    code: String,
    description: Option<String>,
) -> SqlResult<()> {
    let now = Utc::now().to_rfc3339();
    
    conn.execute(
        "UPDATE code_snippets 
         SET title = ?1, language = ?2, code = ?3, description = ?4, updated_at = ?5
         WHERE id = ?6",
        params![title, language, code, description, now, id],
    )?;
    
    Ok(())
}

fn delete_code_snippet(conn: &Connection, id: i64) -> SqlResult<()> {
    conn.execute("DELETE FROM code_snippets WHERE id = ?1", params![id])?;
    Ok(())
}

// ==================== TAURI COMMANDS ====================

#[tauri::command]
pub fn add_code_snippet(
    app: AppHandle,
    title: String,
    language: String,
    code: String,
    description: Option<String>,
) -> Result<i64, String> {
    let conn = get_db(&app)?;
    create_code_snippet(&conn, title, language, code, description)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_code_snippets(app: AppHandle) -> Result<Vec<CodeSnippet>, String> {
    let conn = get_db(&app)?;
    get_all_code_snippets(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_code_snippet(app: AppHandle, id: i64) -> Result<CodeSnippet, String> {
    let conn = get_db(&app)?;
    get_code_snippet_by_id(&conn, id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn edit_code_snippet(
    app: AppHandle,
    id: i64,
    title: String,
    language: String,
    code: String,
    description: Option<String>,
) -> Result<(), String> {
    let conn = get_db(&app)?;
    update_code_snippet(&conn, id, title, language, code, description)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn remove_code_snippet(app: AppHandle, id: i64) -> Result<(), String> {
    let conn = get_db(&app)?;
    delete_code_snippet(&conn, id).map_err(|e| e.to_string())
}