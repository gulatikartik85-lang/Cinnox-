import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.resolve(dataDir, 'ludostar.db');
export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
      avatar_url TEXT NOT NULL DEFAULT '/src/assets/images/avatar_champion_one_1795161899775.jpg',
      coins INTEGER NOT NULL DEFAULT 500,
      wins INTEGER NOT NULL DEFAULT 0,
      matches_played INTEGER NOT NULL DEFAULT 0,
      daily_streak INTEGER NOT NULL DEFAULT 0,
      last_daily_claim TEXT,
      ad_consent TEXT NOT NULL DEFAULT 'unknown' CHECK (ad_consent IN ('unknown', 'personalized', 'non_personalized')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mode TEXT NOT NULL,
      winner_user_id INTEGER,
      winner_name TEXT NOT NULL,
      winner_color TEXT NOT NULL,
      players_count INTEGER NOT NULL DEFAULT 2,
      duration_seconds INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (winner_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS ad_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      ad_type TEXT NOT NULL CHECK (ad_type IN ('banner', 'interstitial', 'rewarded', 'native')),
      event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'click', 'reward', 'error')),
      ad_unit_id TEXT NOT NULL,
      estimated_revenue_usd REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  seedInitialData();
}

function seedInitialData(): void {
  const adminExists = db.prepare(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`).get();
  if (!adminExists) {
    const adminHash = bcrypt.hashSync('LudoStarAdmin2026!', 10);
    const userHash = bcrypt.hashSync('LudoStarPlayer2026!', 10);
    const insertUser = db.prepare(
      `INSERT OR IGNORE INTO users (name, email, password_hash, role, avatar_url, coins, wins, matches_played, daily_streak)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    insertUser.run(
      'LudoStar Admin',
      'admin@ludostar.app',
      adminHash,
      'admin',
      '/src/assets/images/ludo_royal_emblem_1795161899711.jpg',
      5000,
      42,
      58,
      7
    );
    insertUser.run(
      'Aarav Sharma',
      'player@ludostar.app',
      userHash,
      'user',
      '/src/assets/images/avatar_champion_one_1795161899775.jpg',
      1450,
      19,
      28,
      3
    );
    insertUser.run(
      'Priya Nair',
      'priya@ludostar.app',
      userHash,
      'user',
      '/src/assets/images/avatar_champion_one_1795161899775.jpg',
      2890,
      34,
      46,
      5
    );
    insertUser.run(
      'Kabir Verma',
      'kabir@ludostar.app',
      userHash,
      'user',
      '/src/assets/images/avatar_champion_one_1795161899775.jpg',
      2120,
      25,
      39,
      4
    );
    insertUser.run(
      'Ananya Patel',
      'ananya@ludostar.app',
      userHash,
      'user',
      '/src/assets/images/avatar_champion_one_1795161899775.jpg',
      1780,
      21,
      31,
      2
    );
  }

  const matchCount = (db.prepare(`SELECT COUNT(*) as c FROM matches`).get() as { c: number }).c;
  if (matchCount === 0) {
    const insertMatch = db.prepare(
      `INSERT INTO matches (mode, winner_name, winner_color, players_count, duration_seconds) VALUES (?, ?, ?, ?, ?)`
    );
    insertMatch.run('online_public', 'Priya Nair', 'red', 4, 420);
    insertMatch.run('vs_ai_4p', 'Kabir Verma', 'yellow', 4, 365);
    insertMatch.run('online_private', 'Aarav Sharma', 'green', 2, 240);
  }
}

export interface DbUserRow {
  id: number;
  name: string;
  email: string;
  password_hash?: string;
  role: 'user' | 'admin';
  avatar_url: string;
  coins: number;
  wins: number;
  matches_played: number;
  daily_streak: number;
  last_daily_claim: string | null;
  ad_consent: 'unknown' | 'personalized' | 'non_personalized';
  created_at: string;
}

export function formatUser(row: DbUserRow) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatarUrl: row.avatar_url,
    coins: row.coins,
    wins: row.wins,
    matchesPlayed: row.matches_played,
    dailyStreak: row.daily_streak,
    lastDailyClaim: row.last_daily_claim,
    adConsent: row.ad_consent,
    createdAt: row.created_at,
  };
}
