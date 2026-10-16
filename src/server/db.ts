import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'plottwist.sqlite');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    try {
      const buffer = fs.readFileSync(DB_FILE);
      dbInstance = new SQL.Database(buffer);
    } catch (err) {
      console.error('Failed to load existing SQLite database, creating fresh one:', err);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  initSchema(dbInstance);
  saveDb();
  return dbInstance;
}

export function saveDb(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Failed to persist SQLite database to disk:', err);
  }
}

function initSchema(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS polls (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      question TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT DEFAULT 'General',
      image_url TEXT DEFAULT '',
      is_sample INTEGER DEFAULT 0,
      is_verified_org INTEGER DEFAULT 0,
      total_votes INTEGER DEFAULT 0,
      allow_multiple INTEGER DEFAULT 0,
      report_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS poll_options (
      id TEXT PRIMARY KEY,
      poll_id TEXT NOT NULL,
      text TEXT NOT NULL,
      vote_count INTEGER DEFAULT 0,
      order_index INTEGER NOT NULL,
      FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS poll_votes (
      id TEXT PRIMARY KEY,
      poll_id TEXT NOT NULL,
      option_id TEXT NOT NULL,
      voter_fingerprint TEXT NOT NULL,
      ip_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(poll_id, voter_fingerprint),
      FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
      FOREIGN KEY (option_id) REFERENCES poll_options(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS poll_reports (
      id TEXT PRIMARY KEY,
      poll_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      details TEXT DEFAULT '',
      reporter_fingerprint TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS poll_likes (
      id TEXT PRIMARY KEY,
      poll_id TEXT NOT NULL,
      user_fingerprint TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(poll_id, user_fingerprint),
      FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS poll_comments (
      id TEXT PRIMARY KEY,
      poll_id TEXT NOT NULL,
      comment_text TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_fingerprint TEXT NOT NULL,
      report_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at TEXT NOT NULL,
      FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comment_reports (
      id TEXT PRIMARY KEY,
      comment_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      reporter_fingerprint TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (comment_id) REFERENCES poll_comments(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_polls_created_at ON polls(created_at);
    CREATE INDEX IF NOT EXISTS idx_polls_total_votes ON polls(total_votes);
    CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id);
    CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON poll_votes(poll_id);
    CREATE INDEX IF NOT EXISTS idx_poll_votes_fingerprint ON poll_votes(poll_id, voter_fingerprint);
    CREATE INDEX IF NOT EXISTS idx_poll_likes_poll_id ON poll_likes(poll_id);
    CREATE INDEX IF NOT EXISTS idx_poll_comments_poll_id ON poll_comments(poll_id);
  `);

  // Migration: Ensure image_url column exists in polls table and comment columns exist
  try {
    const pollsInfo = queryAll(db, `PRAGMA table_info(polls)`);
    const hasImageCol = pollsInfo.some((col: any) => col.name === 'image_url');
    if (!hasImageCol) {
      db.exec(`ALTER TABLE polls ADD COLUMN image_url TEXT DEFAULT '';`);
    }

    const commentInfo = queryAll(db, `PRAGMA table_info(poll_comments)`);
    if (!commentInfo.some((col: any) => col.name === 'author_fingerprint')) {
      db.exec(`ALTER TABLE poll_comments ADD COLUMN author_fingerprint TEXT DEFAULT '';`);
    }
    if (!commentInfo.some((col: any) => col.name === 'status')) {
      db.exec(`ALTER TABLE poll_comments ADD COLUMN status TEXT DEFAULT 'active';`);
    }
    if (!commentInfo.some((col: any) => col.name === 'report_count')) {
      db.exec(`ALTER TABLE poll_comments ADD COLUMN report_count INTEGER DEFAULT 0;`);
    }
  } catch (err) {
    console.error('Migration pragma check error (handled):', err);
  }

  // Purge any fake hardcoded sample polls from previous runs as explicitly requested:
  // "Remove all hardcoded sample polls, fake vote counts, fake popularity numbers, and fabricated activity from the live feed."
  try {
    db.run(`DELETE FROM poll_options WHERE poll_id IN (SELECT id FROM polls WHERE is_sample = 1);`);
    db.run(`DELETE FROM poll_votes WHERE poll_id IN (SELECT id FROM polls WHERE is_sample = 1);`);
    db.run(`DELETE FROM polls WHERE is_sample = 1;`);
  } catch (err) {
    console.error('Error cleaning legacy sample data (handled):', err);
  }
}

// Database query helpers
export function queryAll<T = any>(db: Database, sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

export function queryOne<T = any>(db: Database, sql: string, params: any[] = []): T | null {
  const results = queryAll<T>(db, sql, params);
  return results.length > 0 ? results[0] : null;
}

export function execute(db: Database, sql: string, params: any[] = []): void {
  db.run(sql, params);
  saveDb();
}
