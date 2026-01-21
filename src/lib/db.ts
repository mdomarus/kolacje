import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.NODE_ENV === 'test'
  ? ':memory:'
  : path.join(process.cwd(), 'meals.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    initializeSchema();
  }
  return db;
}

function initializeSchema() {
  const database = db!;

  // Users table
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add is_admin column if it doesn't exist (migration)
  try {
    const result = database.prepare("PRAGMA table_info(users)").all() as any[];
    const hasAdminColumn = result.some(col => col.name === 'is_admin');
    if (!hasAdminColumn) {
      database.exec(`ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0`);
    }
  } catch (e) {
    // Ignore errors - table might not exist or column already exists
  }

  // Dishes table
  database.exec(`
    CREATE TABLE IF NOT EXISTS dishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      course TEXT NOT NULL CHECK(course IN ('first', 'second')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Votes table
  database.exec(`
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      dish_id INTEGER NOT NULL,
      course TEXT NOT NULL CHECK(course IN ('first', 'second')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(dish_id) REFERENCES dishes(id),
      UNIQUE(user_id, course)
    )
  `);

  // Settings table
  database.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Initialize default settings
  try {
    const lockStatus = database
      .prepare("SELECT value FROM settings WHERE key = 'menus_locked'")
      .get();
    if (!lockStatus) {
      database
        .prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)")
        .run('menus_locked', '0');
    }
  } catch (e) {
    // Ignore errors - settings table might have just been created
  }
}

export default getDb;
