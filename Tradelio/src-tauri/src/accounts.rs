use rusqlite::{params, Connection, OptionalExtension};
use tauri::{AppHandle, Manager};
use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::fs;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TradingAccount {
    pub id: Option<i64>,
    pub name: String,
    pub broker: String,
    pub account_number: String,
    pub account_nickname: String,
    pub account_type: String,
    pub account_plan: String,
    pub balance: f64, // Current balance (affected by trades and deposits/withdrawals)
    pub total_deposits: f64, // Total deposits only (never affected by trades)
    pub leverage: String,
    pub trading_terminal: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Transaction {
    pub id: Option<i64>,
    pub account_name: String,
    pub transaction_type: String, // "deposit" or "withdrawal"
    pub amount: f64,
    pub date: String,
    pub created_at: String,
}

fn get_db(app: &AppHandle) -> Result<Connection> {
    let mut path = app.path().app_data_dir()?;
    fs::create_dir_all(&path)?;
    path.push("tradelio.db");
    let conn = Connection::open(&path)?;

    // Create accounts table with total_deposits field
    conn.execute(
        "CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            broker TEXT NOT NULL,
            account_number TEXT NOT NULL,
            account_nickname TEXT,
            account_type TEXT NOT NULL,
            account_plan TEXT NOT NULL,
            balance REAL NOT NULL,
            total_deposits REAL NOT NULL DEFAULT 0,
            leverage TEXT NOT NULL,
            trading_terminal TEXT NOT NULL,
            created_at TEXT NOT NULL
        )",
        [],
    )?;

    // Migrate existing accounts to add total_deposits if needed
    let has_total_deposits: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM pragma_table_info('accounts') WHERE name='total_deposits'",
            [],
            |row| row.get::<_, i32>(0),
        )
        .map(|count| count > 0)
        .unwrap_or(false);

    if !has_total_deposits {
        println!("Migrating database: adding total_deposits column");
        conn.execute(
            "ALTER TABLE accounts ADD COLUMN total_deposits REAL NOT NULL DEFAULT 0",
            [],
        )?;
        // Initialize total_deposits with current balance for existing accounts
        conn.execute(
            "UPDATE accounts SET total_deposits = balance WHERE total_deposits = 0",
            [],
        )?;
    }

    // Create transactions table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_name TEXT NOT NULL,
            transaction_type TEXT NOT NULL,
            amount REAL NOT NULL,
            date TEXT NOT NULL,
            created_at TEXT NOT NULL
        )",
        [],
    )?;

    Ok(conn)
}

#[tauri::command]
pub fn add_account(
    app: AppHandle,
    account: TradingAccount,
) -> Result<TradingAccount, String> {
    println!("Adding account: {:?}", account);
    let conn = get_db(&app).map_err(|e| {
        eprintln!("Database error: {}", e);
        e.to_string()
    })?;

    conn.execute(
        "INSERT INTO accounts (name, broker, account_number, account_nickname, account_type, account_plan, balance, total_deposits, leverage, trading_terminal, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        params![
            account.name,
            account.broker,
            account.account_number,
            account.account_nickname,
            account.account_type,
            account.account_plan,
            account.balance,
            account.total_deposits,
            account.leverage,
            account.trading_terminal,
            account.created_at,
        ],
    )
    .map_err(|e| {
        eprintln!("Database insert error: {}", e);
        e.to_string()
    })?;

    let id = conn.last_insert_rowid();
    let mut new_account = account.clone();
    new_account.id = Some(id);

    println!("Account added successfully with ID: {}", id);
    Ok(new_account)
}

#[tauri::command]
pub fn get_all_accounts(app: AppHandle) -> Result<Vec<TradingAccount>, String> {
    let conn = get_db(&app).map_err(|e| {
        eprintln!("Database error: {}", e);
        e.to_string()
    })?;

    let mut stmt = conn
        .prepare(
            "SELECT id, name, broker, account_number, account_nickname, account_type, account_plan, balance, total_deposits, leverage, trading_terminal, created_at 
             FROM accounts 
             ORDER BY created_at DESC"
        )
        .map_err(|e| e.to_string())?;

    let accounts = stmt
        .query_map([], |row| {
            Ok(TradingAccount {
                id: row.get(0)?,
                name: row.get(1)?,
                broker: row.get(2)?,
                account_number: row.get(3)?,
                account_nickname: row.get(4)?,
                account_type: row.get(5)?,
                account_plan: row.get(6)?,
                balance: row.get(7)?,
                total_deposits: row.get(8)?,
                leverage: row.get(9)?,
                trading_terminal: row.get(10)?,
                created_at: row.get(11)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    println!("Loaded {} accounts", accounts.len());
    Ok(accounts)
}

#[tauri::command]
pub fn update_account_balance(
    app: AppHandle,
    account_id: i64,
    new_balance: f64,
) -> Result<(), String> {
    println!("Updating account {} balance to {} (trade P&L)", account_id, new_balance);
    let conn = get_db(&app).map_err(|e| {
        eprintln!("Database error: {}", e);
        e.to_string()
    })?;

    // Only update balance, not total_deposits (this is for trade P&L)
    conn.execute(
        "UPDATE accounts SET balance = ?1 WHERE id = ?2",
        params![new_balance, account_id],
    )
    .map_err(|e| {
        eprintln!("Database update error: {}", e);
        e.to_string()
    })?;

    println!("Account balance updated successfully");
    Ok(())
}

#[tauri::command]
pub fn delete_account(
    app: AppHandle,
    account_id: i64,
) -> Result<(), String> {
    println!("Deleting account with ID: {}", account_id);
    let conn = get_db(&app).map_err(|e| {
        eprintln!("Database error: {}", e);
        e.to_string()
    })?;

    conn.execute(
        "DELETE FROM accounts WHERE id = ?1",
        params![account_id],
    )
    .map_err(|e| {
        eprintln!("Database delete error: {}", e);
        e.to_string()
    })?;

    println!("Account deleted successfully");
    Ok(())
}

#[tauri::command]
pub fn add_transaction(
    app: AppHandle,
    transaction: Transaction,
) -> Result<Transaction, String> {
    println!("Adding transaction: {:?}", transaction);
    let conn = get_db(&app).map_err(|e| {
        eprintln!("Database error: {}", e);
        e.to_string()
    })?;

    // Add the transaction record
    conn.execute(
        "INSERT INTO transactions (account_name, transaction_type, amount, date, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            transaction.account_name,
            transaction.transaction_type,
            transaction.amount,
            transaction.date,
            transaction.created_at,
        ],
    )
    .map_err(|e| {
        eprintln!("Database insert error: {}", e);
        e.to_string()
    })?;

    let id = conn.last_insert_rowid();

    // Update both balance and total_deposits for deposits/withdrawals
    let amount_change = match transaction.transaction_type.as_str() {
        "deposit" => transaction.amount,
        "withdrawal" => -transaction.amount,
        _ => 0.0,
    };

    conn.execute(
        "UPDATE accounts 
         SET balance = balance + ?1, 
             total_deposits = total_deposits + ?1 
         WHERE name = ?2",
        params![amount_change, transaction.account_name],
    )
    .map_err(|e| {
        eprintln!("Database update error: {}", e);
        e.to_string()
    })?;

    let mut new_transaction = transaction.clone();
    new_transaction.id = Some(id);

    println!("Transaction added successfully with ID: {}", id);
    Ok(new_transaction)
}

#[tauri::command]
pub fn get_all_transactions(app: AppHandle) -> Result<Vec<Transaction>, String> {
    let conn = get_db(&app).map_err(|e| {
        eprintln!("Database error: {}", e);
        e.to_string()
    })?;

    let mut stmt = conn
        .prepare(
            "SELECT id, account_name, transaction_type, amount, date, created_at 
             FROM transactions 
             ORDER BY date DESC"
        )
        .map_err(|e| e.to_string())?;

    let transactions = stmt
        .query_map([], |row| {
            Ok(Transaction {
                id: row.get(0)?,
                account_name: row.get(1)?,
                transaction_type: row.get(2)?,
                amount: row.get(3)?,
                date: row.get(4)?,
                created_at: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    println!("Loaded {} transactions", transactions.len());
    Ok(transactions)
}

#[tauri::command]
pub fn get_transactions_by_account(
    app: AppHandle,
    account_name: String,
) -> Result<Vec<Transaction>, String> {
    let conn = get_db(&app).map_err(|e| {
        eprintln!("Database error: {}", e);
        e.to_string()
    })?;

    let mut stmt = conn
        .prepare(
            "SELECT id, account_name, transaction_type, amount, date, created_at 
             FROM transactions 
             WHERE account_name = ?1 
             ORDER BY date DESC"
        )
        .map_err(|e| e.to_string())?;

    let transactions = stmt
        .query_map([account_name], |row| {
            Ok(Transaction {
                id: row.get(0)?,
                account_name: row.get(1)?,
                transaction_type: row.get(2)?,
                amount: row.get(3)?,
                date: row.get(4)?,
                created_at: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(transactions)
}

#[tauri::command]
pub fn update_account(
    app: AppHandle,
    account: TradingAccount,
) -> Result<TradingAccount, String> {
    println!("Updating account: {:?}", account);
    let conn = get_db(&app).map_err(|e| {
        eprintln!("Database error: {}", e);
        e.to_string()
    })?;

    conn.execute(
        "UPDATE accounts 
         SET name = ?1, broker = ?2, account_number = ?3, account_nickname = ?4, 
             account_type = ?5, account_plan = ?6, balance = ?7, total_deposits = ?8, 
             leverage = ?9, trading_terminal = ?10, created_at = ?11 
         WHERE id = ?12",
        params![
            account.name,
            account.broker,
            account.account_number,
            account.account_nickname,
            account.account_type,
            account.account_plan,
            account.balance,
            account.total_deposits,
            account.leverage,
            account.trading_terminal,
            account.created_at,
            account.id.unwrap(),
        ],
    )
    .map_err(|e| {
        eprintln!("Database update error: {}", e);
        e.to_string()
    })?;

    println!("Account updated successfully");
    Ok(account)
}

#[tauri::command]
pub fn update_transaction(
    app: AppHandle,
    transaction: Transaction,
) -> Result<Transaction, String> {
    println!("Updating transaction: {:?}", transaction);
    let conn = get_db(&app).map_err(|e| {
        eprintln!("Database error: {}", e);
        e.to_string()
    })?;

    // Get the old transaction to reverse its effect
    let old_transaction: Transaction = conn
        .query_row(
            "SELECT id, account_name, transaction_type, amount, date, created_at 
             FROM transactions 
             WHERE id = ?1",
            params![transaction.id.unwrap()],
            |row| {
                Ok(Transaction {
                    id: row.get(0)?,
                    account_name: row.get(1)?,
                    transaction_type: row.get(2)?,
                    amount: row.get(3)?,
                    date: row.get(4)?,
                    created_at: row.get(5)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    // Reverse the old transaction's effect
    let old_amount_change = match old_transaction.transaction_type.as_str() {
        "deposit" => -old_transaction.amount,
        "withdrawal" => old_transaction.amount,
        _ => 0.0,
    };

    conn.execute(
        "UPDATE accounts 
         SET balance = balance + ?1, 
             total_deposits = total_deposits + ?1 
         WHERE name = ?2",
        params![old_amount_change, old_transaction.account_name],
    )
    .map_err(|e| e.to_string())?;

    // Update the transaction
    conn.execute(
        "UPDATE transactions 
         SET account_name = ?1, transaction_type = ?2, amount = ?3, date = ?4, created_at = ?5 
         WHERE id = ?6",
        params![
            transaction.account_name,
            transaction.transaction_type,
            transaction.amount,
            transaction.date,
            transaction.created_at,
            transaction.id.unwrap(),
        ],
    )
    .map_err(|e| {
        eprintln!("Database update error: {}", e);
        e.to_string()
    })?;

    // Apply the new transaction's effect
    let new_amount_change = match transaction.transaction_type.as_str() {
        "deposit" => transaction.amount,
        "withdrawal" => -transaction.amount,
        _ => 0.0,
    };

    conn.execute(
        "UPDATE accounts 
         SET balance = balance + ?1, 
             total_deposits = total_deposits + ?1 
         WHERE name = ?2",
        params![new_amount_change, transaction.account_name],
    )
    .map_err(|e| e.to_string())?;

    println!("Transaction updated successfully");
    Ok(transaction)
}