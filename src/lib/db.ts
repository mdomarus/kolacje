import postgres from 'postgres';

let sql: postgres.Sql | null = null;

export function getDb() {
  if (!sql) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    sql = postgres(connectionString, {
      ssl: 'require',
    });
    initializeSchema();
  }
  return sql;
}

async function initializeSchema() {
  const db = sql!;

  try {
    // Users table
    await db`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        is_admin INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Dishes table
    await db`
      CREATE TABLE IF NOT EXISTS dishes (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        course TEXT NOT NULL CHECK(course IN ('first', 'second')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Votes table
    await db`
      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        dish_id INTEGER NOT NULL,
        course TEXT NOT NULL CHECK(course IN ('first', 'second')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
        UNIQUE(user_id, course)
      )
    `;

    // Settings table
    await db`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Initialize default settings
    await db`
      INSERT INTO settings (key, value)
      VALUES ('menus_locked', '0')
      ON CONFLICT DO NOTHING
    `;
  } catch (error) {
    console.error('Error initializing database schema:', error);
  }
}

export default getDb;
