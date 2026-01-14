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
    pub total_deposits: f64, // Total deposits only (never decreases)
    pub total_withdrawals: f64, // NEW: Total withdrawals only (never decreases)
    pub leverage: String,
    pub trading_terminal: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Transaction {
    pub id: Option<i64>,
    pub account_name: String,
    pub transaction_type: String, // "deposit", "withdrawal", "transfer_in", "transfer_out"
    pub amount: f64, // Always positive
    pub description: Option<String>, // NEW: Optional note/memo
    pub related_transaction_id: Option<i64>, // NEW: For linking transfers
    pub date: String,
    pub created_at: String,
}

fn get_db(app: &AppHandle) -> Result<Connection> {
    let mut path = app.path().app_data_dir()?;
    fs::create_dir_all(&path)?;
    path.push("tradelio.db");
    let conn = Connection::open(&path)?;

    // Create accounts table with total_deposits and total_withdrawals fields
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
            total_withdrawals REAL NOT NULL DEFAULT 0,
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

    // NEW: Migrate to add total_withdrawals if needed
    let has_total_withdrawals: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM pragma_table_info('accounts') WHERE name='total_withdrawals'",
            [],
            |row| row.get::<_, i32>(0),
        )
        .map(|count| count > 0)
        .unwrap_or(false);

    if !has_total_withdrawals {
        println!("Migrating database: adding total_withdrawals column");
        conn.execute(
            "ALTER TABLE accounts ADD COLUMN total_withdrawals REAL NOT NULL DEFAULT 0",
            [],
        )?;
        // Calculate total_withdrawals from existing transactions
        conn.execute(
            "UPDATE accounts 
             SET total_withdrawals = (
                 SELECT COALESCE(SUM(amount), 0) 
                 FROM transactions 
                 WHERE transactions.account_name = accounts.name 
                 AND transactions.transaction_type IN ('withdrawal', 'transfer_out')
             )",
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
            description TEXT,
            related_transaction_id INTEGER,
            date TEXT NOT NULL,
            created_at TEXT NOT NULL
        )",
        [],
    )?;

    // NEW: Migrate transactions to add description column if needed
    let has_description: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM pragma_table_info('transactions') WHERE name='description'",
            [],
            |row| row.get::<_, i32>(0),
        )
        .map(|count| count > 0)
        .unwrap_or(false);

    if !has_description {
        println!("Migrating database: adding description column to transactions");
        conn.execute(
            "ALTER TABLE transactions ADD COLUMN description TEXT",
            [],
        )?;
    }

    // NEW: Migrate transactions to add related_transaction_id column if needed
    let has_related_id: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM pragma_table_info('transactions') WHERE name='related_transaction_id'",
            [],
            |row| row.get::<_, i32>(0),
        )
        .map(|count| count > 0)
        .unwrap_or(false);

    if !has_related_id {
        println!("Migrating database: adding related_transaction_id column to transactions");
        conn.execute(
            "ALTER TABLE transactions ADD COLUMN related_transaction_id INTEGER",
            [],
        )?;
    }

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
        "INSERT INTO accounts (name, broker, account_number, account_nickname, account_type, account_plan, balance, total_deposits, total_withdrawals, leverage, trading_terminal, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        params![
            account.name,
            account.broker,
            account.account_number,
            account.account_nickname,
            account.account_type,
            account.account_plan,
            account.balance,
            account.total_deposits,
            account.total_withdrawals,
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
            "SELECT id, name, broker, account_number, account_nickname, account_type, account_plan, balance, total_deposits, total_withdrawals, leverage, trading_terminal, created_at 
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
                total_withdrawals: row.get(9)?,
                leverage: row.get(10)?,
                trading_terminal: row.get(11)?,
                created_at: row.get(12)?,
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

    // Only update balance, not total_deposits or total_withdrawals (this is for trade P&L)
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

    // Validate amount is positive
    if transaction.amount <= 0.0 {
        return Err("Transaction amount must be positive".to_string());
    }

    // Add the transaction record
    conn.execute(
        "INSERT INTO transactions (account_name, transaction_type, amount, description, related_transaction_id, date, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            transaction.account_name,
            transaction.transaction_type,
            transaction.amount,
            transaction.description,
            transaction.related_transaction_id,
            transaction.date,
            transaction.created_at,
        ],
    )
    .map_err(|e| {
        eprintln!("Database insert error: {}", e);
        e.to_string()
    })?;

    let id = conn.last_insert_rowid();

    // FIXED: Update balance and appropriate total field based on transaction type
    match transaction.transaction_type.as_str() {
        "deposit" | "transfer_in" => {
            // Increase balance and total_deposits
            conn.execute(
                "UPDATE accounts 
                 SET balance = balance + ?1, 
                     total_deposits = total_deposits + ?1 
                 WHERE name = ?2",
                params![transaction.amount, transaction.account_name],
            )
            .map_err(|e| {
                eprintln!("Database update error: {}", e);
                e.to_string()
            })?;
        }
        "withdrawal" | "transfer_out" => {
            // Decrease balance and increase total_withdrawals
            conn.execute(
                "UPDATE accounts 
                 SET balance = balance - ?1, 
                     total_withdrawals = total_withdrawals + ?1 
                 WHERE name = ?2",
                params![transaction.amount, transaction.account_name],
            )
            .map_err(|e| {
                eprintln!("Database update error: {}", e);
                e.to_string()
            })?;
        }
        _ => {
            return Err(format!("Invalid transaction type: {}", transaction.transaction_type));
        }
    }

    let mut new_transaction = transaction.clone();
    new_transaction.id = Some(id);

    println!("Transaction added successfully with ID: {}", id);
    Ok(new_transaction)
}

// NEW: Helper function to add a transfer between two accounts
#[tauri::command]
pub fn add_transfer(
    app: AppHandle,
    from_account: String,
    to_account: String,
    amount: f64,
    description: Option<String>,
    date: String,
    created_at: String,
) -> Result<(Transaction, Transaction), String> {
    println!("Adding transfer: {} from {} to {}", amount, from_account, to_account);
    
    if amount <= 0.0 {
        return Err("Transfer amount must be positive".to_string());
    }

    let conn = get_db(&app).map_err(|e| {
        eprintln!("Database error: {}", e);
        e.to_string()
    })?;

    // Start a transaction
    conn.execute("BEGIN TRANSACTION", [])
        .map_err(|e| e.to_string())?;

    // Add transfer_out transaction
    let transfer_out = Transaction {
        id: None,
        account_name: from_account.clone(),
        transaction_type: "transfer_out".to_string(),
        amount,
        description: description.clone(),
        related_transaction_id: None,
        date: date.clone(),
        created_at: created_at.clone(),
    };

    conn.execute(
        "INSERT INTO transactions (account_name, transaction_type, amount, description, related_transaction_id, date, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            transfer_out.account_name,
            transfer_out.transaction_type,
            transfer_out.amount,
            transfer_out.description,
            transfer_out.related_transaction_id,
            transfer_out.date,
            transfer_out.created_at,
        ],
    )
    .map_err(|e| {
        conn.execute("ROLLBACK", []).ok();
        e.to_string()
    })?;

    let out_id = conn.last_insert_rowid();

    // Add transfer_in transaction with related_transaction_id
    let transfer_in = Transaction {
        id: None,
        account_name: to_account.clone(),
        transaction_type: "transfer_in".to_string(),
        amount,
        description: description.clone(),
        related_transaction_id: Some(out_id),
        date: date.clone(),
        created_at: created_at.clone(),
    };

    conn.execute(
        "INSERT INTO transactions (account_name, transaction_type, amount, description, related_transaction_id, date, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            transfer_in.account_name,
            transfer_in.transaction_type,
            transfer_in.amount,
            transfer_in.description,
            transfer_in.related_transaction_id,
            transfer_in.date,
            transfer_in.created_at,
        ],
    )
    .map_err(|e| {
        conn.execute("ROLLBACK", []).ok();
        e.to_string()
    })?;

    let in_id = conn.last_insert_rowid();

    // Update the transfer_out transaction with the related_transaction_id
    conn.execute(
        "UPDATE transactions SET related_transaction_id = ?1 WHERE id = ?2",
        params![in_id, out_id],
    )
    .map_err(|e| {
        conn.execute("ROLLBACK", []).ok();
        e.to_string()
    })?;

    // Update from_account: decrease balance, increase total_withdrawals
    conn.execute(
        "UPDATE accounts 
         SET balance = balance - ?1, 
             total_withdrawals = total_withdrawals + ?1 
         WHERE name = ?2",
        params![amount, from_account],
    )
    .map_err(|e| {
        conn.execute("ROLLBACK", []).ok();
        e.to_string()
    })?;

    // Update to_account: increase balance, increase total_deposits
    conn.execute(
        "UPDATE accounts 
         SET balance = balance + ?1, 
             total_deposits = total_deposits + ?1 
         WHERE name = ?2",
        params![amount, to_account],
    )
    .map_err(|e| {
        conn.execute("ROLLBACK", []).ok();
        e.to_string()
    })?;

    // Commit the transaction
    conn.execute("COMMIT", [])
        .map_err(|e| e.to_string())?;

    let mut final_out = transfer_out;
    final_out.id = Some(out_id);
    final_out.related_transaction_id = Some(in_id);

    let mut final_in = transfer_in;
    final_in.id = Some(in_id);

    println!("Transfer completed successfully");
    Ok((final_out, final_in))
}

#[tauri::command]
pub fn get_all_transactions(app: AppHandle) -> Result<Vec<Transaction>, String> {
    let conn = get_db(&app).map_err(|e| {
        eprintln!("Database error: {}", e);
        e.to_string()
    })?;

    let mut stmt = conn
        .prepare(
            "SELECT id, account_name, transaction_type, amount, description, related_transaction_id, date, created_at 
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
                description: row.get(4)?,
                related_transaction_id: row.get(5)?,
                date: row.get(6)?,
                created_at: row.get(7)?,
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
            "SELECT id, account_name, transaction_type, amount, description, related_transaction_id, date, created_at 
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
                description: row.get(4)?,
                related_transaction_id: row.get(5)?,
                date: row.get(6)?,
                created_at: row.get(7)?,
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
             total_withdrawals = ?9, leverage = ?10, trading_terminal = ?11, created_at = ?12 
         WHERE id = ?13",
        params![
            account.name,
            account.broker,
            account.account_number,
            account.account_nickname,
            account.account_type,
            account.account_plan,
            account.balance,
            account.total_deposits,
            account.total_withdrawals,
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
            "SELECT id, account_name, transaction_type, amount, description, related_transaction_id, date, created_at 
             FROM transactions 
             WHERE id = ?1",
            params![transaction.id.unwrap()],
            |row| {
                Ok(Transaction {
                    id: row.get(0)?,
                    account_name: row.get(1)?,
                    transaction_type: row.get(2)?,
                    amount: row.get(3)?,
                    description: row.get(4)?,
                    related_transaction_id: row.get(5)?,
                    date: row.get(6)?,
                    created_at: row.get(7)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    // FIXED: Reverse the old transaction's effect properly
    match old_transaction.transaction_type.as_str() {
        "deposit" | "transfer_in" => {
            // Reverse: decrease balance and total_deposits
            conn.execute(
                "UPDATE accounts 
                 SET balance = balance - ?1, 
                     total_deposits = total_deposits - ?1 
                 WHERE name = ?2",
                params![old_transaction.amount, old_transaction.account_name],
            )
            .map_err(|e| e.to_string())?;
        }
        "withdrawal" | "transfer_out" => {
            // Reverse: increase balance and decrease total_withdrawals
            conn.execute(
                "UPDATE accounts 
                 SET balance = balance + ?1, 
                     total_withdrawals = total_withdrawals - ?1 
                 WHERE name = ?2",
                params![old_transaction.amount, old_transaction.account_name],
            )
            .map_err(|e| e.to_string())?;
        }
        _ => {}
    }

    // Update the transaction
    conn.execute(
        "UPDATE transactions 
         SET account_name = ?1, transaction_type = ?2, amount = ?3, description = ?4, 
             related_transaction_id = ?5, date = ?6, created_at = ?7 
         WHERE id = ?8",
        params![
            transaction.account_name,
            transaction.transaction_type,
            transaction.amount,
            transaction.description,
            transaction.related_transaction_id,
            transaction.date,
            transaction.created_at,
            transaction.id.unwrap(),
        ],
    )
    .map_err(|e| {
        eprintln!("Database update error: {}", e);
        e.to_string()
    })?;

    // FIXED: Apply the new transaction's effect properly
    match transaction.transaction_type.as_str() {
        "deposit" | "transfer_in" => {
            // Increase balance and total_deposits
            conn.execute(
                "UPDATE accounts 
                 SET balance = balance + ?1, 
                     total_deposits = total_deposits + ?1 
                 WHERE name = ?2",
                params![transaction.amount, transaction.account_name],
            )
            .map_err(|e| e.to_string())?;
        }
        "withdrawal" | "transfer_out" => {
            // Decrease balance and increase total_withdrawals
            conn.execute(
                "UPDATE accounts 
                 SET balance = balance - ?1, 
                     total_withdrawals = total_withdrawals + ?1 
                 WHERE name = ?2",
                params![transaction.amount, transaction.account_name],
            )
            .map_err(|e| e.to_string())?;
        }
        _ => {}
    }

    println!("Transaction updated successfully");
    Ok(transaction)
}

// NEW: Delete transaction
#[tauri::command]
pub fn delete_transaction(
    app: AppHandle,
    transaction_id: i64,
) -> Result<(), String> {
    println!("Deleting transaction with ID: {}", transaction_id);
    let conn = get_db(&app).map_err(|e| {
        eprintln!("Database error: {}", e);
        e.to_string()
    })?;

    // Get the transaction to reverse its effect
    let transaction: Transaction = conn
        .query_row(
            "SELECT id, account_name, transaction_type, amount, description, related_transaction_id, date, created_at 
             FROM transactions 
             WHERE id = ?1",
            params![transaction_id],
            |row| {
                Ok(Transaction {
                    id: row.get(0)?,
                    account_name: row.get(1)?,
                    transaction_type: row.get(2)?,
                    amount: row.get(3)?,
                    description: row.get(4)?,
                    related_transaction_id: row.get(5)?,
                    date: row.get(6)?,
                    created_at: row.get(7)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    // Reverse the transaction's effect
    match transaction.transaction_type.as_str() {
        "deposit" | "transfer_in" => {
            conn.execute(
                "UPDATE accounts 
                 SET balance = balance - ?1, 
                     total_deposits = total_deposits - ?1 
                 WHERE name = ?2",
                params![transaction.amount, transaction.account_name],
            )
            .map_err(|e| e.to_string())?;
        }
        "withdrawal" | "transfer_out" => {
            conn.execute(
                "UPDATE accounts 
                 SET balance = balance + ?1, 
                     total_withdrawals = total_withdrawals - ?1 
                 WHERE name = ?2",
                params![transaction.amount, transaction.account_name],
            )
            .map_err(|e| e.to_string())?;
        }
        _ => {}
    }

    // Delete the transaction
    conn.execute(
        "DELETE FROM transactions WHERE id = ?1",
        params![transaction_id],
    )
    .map_err(|e| {
        eprintln!("Database delete error: {}", e);
        e.to_string()
    })?;

    println!("Transaction deleted successfully");
    Ok(())
}
#[tauri::command]
pub fn get_account_balance_at_date(
    app: AppHandle,
    account_name: String,
    date: String,
) -> Result<f64, String> {
    let conn = get_db(&app).map_err(|e| e.to_string())?;
    
    // Get current balance
    let current_balance: f64 = conn.query_row(
        "SELECT balance FROM accounts WHERE name = ?1",
        params![account_name],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;
    
    // Get all transactions after the specified date
    let transactions_after: f64 = conn.query_row(
        "SELECT 
            COALESCE(SUM(CASE 
                WHEN transaction_type IN ('deposit', 'transfer_in') THEN amount
                WHEN transaction_type IN ('withdrawal', 'transfer_out') THEN -amount
                ELSE 0
            END), 0)
         FROM transactions 
         WHERE account_name = ?1 AND date > ?2",
        params![account_name, date],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;
    
    // Balance at date = current balance - transactions after that date
    Ok(current_balance - transactions_after)
}