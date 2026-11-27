import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'helpworld.db');
export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export interface DbUserRow {
  id: number;
  name: string;
  email: string;
  password_hash?: string;
  preferred_language: string;
  tts_voice: string;
  is_plus: number;
  favorite_hubs: string;
  accessibility_json: string;
  avatar_url: string;
  created_at: string;
}

export interface AccessibilityPrefs {
  textScale: 'normal' | 'lg' | 'xl';
  highContrast: boolean;
  reducedMotion: boolean;
  autoReadAloud: boolean;
}

export interface SafeUser {
  id: number;
  name: string;
  email: string;
  preferredLanguage: string;
  ttsVoice: string;
  isPlus: boolean;
  favoriteHubs: string[];
  accessibility: AccessibilityPrefs;
  avatarUrl: string;
  createdAt: string;
}

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      preferred_language TEXT NOT NULL DEFAULT 'English',
      tts_voice TEXT NOT NULL DEFAULT 'Kore',
      is_plus INTEGER NOT NULL DEFAULT 0,
      favorite_hubs TEXT NOT NULL DEFAULT '[]',
      accessibility_json TEXT NOT NULL DEFAULT '{"textScale":"normal","highContrast":false,"reducedMotion":false,"autoReadAloud":false}',
      avatar_url TEXT NOT NULL DEFAULT '/src/assets/images/avatar_helpworld_member_1795768852444.jpg',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS help_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      hub_slug TEXT NOT NULL,
      hub_name TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'English',
      prompt TEXT NOT NULL,
      response_preview TEXT NOT NULL,
      response_data TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chat_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ad_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      placement_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      page_path TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      topic TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

export function formatUser(row: DbUserRow): SafeUser {
  let favorites: string[] = [];
  try {
    const parsed = JSON.parse(row.favorite_hubs || '[]');
    if (Array.isArray(parsed)) {
      favorites = parsed.filter((x): x is string => typeof x === 'string');
    }
  } catch {
    favorites = [];
  }

  let accessibility: AccessibilityPrefs = {
    textScale: 'normal',
    highContrast: false,
    reducedMotion: false,
    autoReadAloud: false,
  };
  try {
    const parsed = JSON.parse(row.accessibility_json || '{}');
    accessibility = {
      textScale: parsed.textScale === 'lg' || parsed.textScale === 'xl' ? parsed.textScale : 'normal',
      highContrast: Boolean(parsed.highContrast),
      reducedMotion: Boolean(parsed.reducedMotion),
      autoReadAloud: Boolean(parsed.autoReadAloud),
    };
  } catch {
    // keep default
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    preferredLanguage: row.preferred_language || 'English',
    ttsVoice: row.tts_voice || 'Kore',
    isPlus: Boolean(row.is_plus),
    favoriteHubs: favorites,
    accessibility,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
  };
}
