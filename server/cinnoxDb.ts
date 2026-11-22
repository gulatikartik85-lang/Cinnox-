import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'cinnox.db');
export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export interface DbUserRow {
  id: number;
  name: string;
  email: string;
  password_hash?: string;
  role: 'user' | 'admin';
  avatar_url: string;
  favorite_tools: string;
  created_at: string;
}

export interface SafeUser {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatarUrl: string;
  favoriteTools: string[];
  createdAt: string;
}

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      avatar_url TEXT NOT NULL DEFAULT '/src/assets/images/avatar_creator_pro_1795255529768.jpg',
      favorite_tools TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS generations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      tool_slug TEXT NOT NULL,
      tool_name TEXT NOT NULL,
      prompt TEXT NOT NULL,
      output_preview TEXT NOT NULL,
      output_data TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      persona TEXT NOT NULL DEFAULT 'general',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ad_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slot_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      page_path TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS affiliate_clicks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      partner_slug TEXT NOT NULL,
      partner_name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

export function formatUser(row: DbUserRow): SafeUser {
  let favorites: string[] = [];
  try {
    const parsed = JSON.parse(row.favorite_tools || '[]');
    if (Array.isArray(parsed)) {
      favorites = parsed.filter((x): x is string => typeof x === 'string');
    }
  } catch {
    favorites = [];
  }
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatarUrl: row.avatar_url,
    favoriteTools: favorites,
    createdAt: row.created_at,
  };
}
