const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./users.db', (err) => {
  if (err) console.error(err.message);
  else console.log('✓ Connected to SQLite database');
});

// Users table
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Login logs table
db.run(`CREATE TABLE IF NOT EXISTS login_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  username TEXT,
  ip TEXT,
  country TEXT,
  city TEXT,
  isp TEXT,
  device TEXT,
  browser TEXT,
  os TEXT,
  status TEXT,
  attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

module.exports = db;