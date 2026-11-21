import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance;

  const dbPath = process.env.PATHFINDER_DB_PATH
    ? path.resolve(process.cwd(), process.env.PATHFINDER_DB_PATH)
    : path.resolve(process.cwd(), 'data', 'pathfinder.sqlite');

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);

  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS student_states (
      user_id TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS share_snapshots (
      token TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      anon_session_hash TEXT NOT NULL,
      meta_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  dbInstance = db;
  return db;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

export function createUserAccount(email: string, password: string): { id: string; email: string } {
  const db = getDb();
  const normalizedEmail = email.trim().toLowerCase();
  const existing = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get(normalizedEmail) as { id: string } | undefined;
  if (existing) {
    throw new Error('EMAIL_EXISTS');
  }
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const hash = hashPassword(password);
  db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)').run(
    id,
    normalizedEmail,
    hash,
    now
  );
  return { id, email: normalizedEmail };
}

export function authenticateUser(
  email: string,
  password: string
): { id: string; email: string } | null {
  const db = getDb();
  const normalizedEmail = email.trim().toLowerCase();
  const row = db
    .prepare('SELECT id, email, password_hash FROM users WHERE email = ?')
    .get(normalizedEmail) as { id: string; email: string; password_hash: string } | undefined;
  if (!row) return null;
  if (!verifyPassword(password, row.password_hash)) return null;
  return { id: row.id, email: row.email };
}

export function createSession(userId: string): string {
  const db = getDb();
  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date();
  const expires = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 14); // 14 days
  db.prepare('INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)').run(
    token,
    userId,
    expires.toISOString(),
    now.toISOString()
  );
  return token;
}

export function getSessionUser(token: string): { id: string; email: string } | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT u.id, u.email, s.expires_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ?`
    )
    .get(token) as { id: string; email: string; expires_at: string } | undefined;
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return null;
  }
  return { id: row.id, email: row.email };
}

export function deleteSession(token: string): void {
  const db = getDb();
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function saveUserState(userId: string, stateObj: unknown): void {
  const db = getDb();
  const now = new Date().toISOString();
  const json = JSON.stringify(stateObj);
  db.prepare(
    `INSERT INTO student_states (user_id, payload_json, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET payload_json = excluded.payload_json, updated_at = excluded.updated_at`
  ).run(userId, json, now);
}

export function loadUserState(userId: string): unknown | null {
  const db = getDb();
  const row = db
    .prepare('SELECT payload_json FROM student_states WHERE user_id = ?')
    .get(userId) as { payload_json: string } | undefined;
  if (!row) return null;
  try {
    return JSON.parse(row.payload_json);
  } catch {
    return null;
  }
}

export function deleteUserAndAllData(userId: string): void {
  const db = getDb();
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM student_states WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
}

export function createShareSnapshot(payload: unknown): string {
  const db = getDb();
  const token = crypto.randomBytes(9).toString('base64url');
  const now = new Date().toISOString();
  db.prepare('INSERT INTO share_snapshots (token, payload_json, created_at) VALUES (?, ?, ?)').run(
    token,
    JSON.stringify(payload),
    now
  );
  return token;
}

export function getShareSnapshot(token: string): unknown | null {
  const db = getDb();
  const row = db
    .prepare('SELECT payload_json FROM share_snapshots WHERE token = ?')
    .get(token) as { payload_json: string } | undefined;
  if (!row) return null;
  try {
    return JSON.parse(row.payload_json);
  } catch {
    return null;
  }
}

export function recordAnalyticsEvent(
  eventType: string,
  anonSessionId: string,
  meta: Record<string, string | number | boolean>
): void {
  const db = getDb();
  // One-way SHA-256 hash so logs never contain raw session identifiers or PII
  const hashedSession = crypto.createHash('sha256').update(anonSessionId).digest('hex').slice(0, 20);
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO analytics_events (event_type, anon_session_hash, meta_json, created_at) VALUES (?, ?, ?, ?)'
  ).run(eventType, hashedSession, JSON.stringify(meta), now);
}

export function getAnalyticsSummary(): Record<string, number> {
  const db = getDb();
  const rows = db
    .prepare('SELECT event_type, COUNT(*) as count FROM analytics_events GROUP BY event_type')
    .all() as Array<{ event_type: string; count: number }>;
  const summary: Record<string, number> = {};
  for (const r of rows) {
    summary[r.event_type] = Number(r.count);
  }
  return summary;
}
