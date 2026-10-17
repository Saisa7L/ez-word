import type { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'vocabulary.db';

const DATABASE_VERSION = 2;

export async function migrateDatabase(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  if (currentVersion === 0) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT NOT NULL COLLATE NOCASE UNIQUE,
        meaning TEXT NOT NULL,
        phonetic TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    currentVersion = 1;
  }

  if (currentVersion === 1) {
    await db.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.execAsync(`
        ALTER TABLE words
        ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;

        CREATE INDEX IF NOT EXISTS idx_words_active
        ON words(is_active);

        CREATE TABLE IF NOT EXISTS app_settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          daily_word_limit INTEGER NOT NULL,
          listening_default_rate REAL NOT NULL
        );

        INSERT OR IGNORE INTO app_settings (
          id,
          daily_word_limit,
          listening_default_rate
        )
        VALUES (1, 10, 1.0);

        CREATE TABLE IF NOT EXISTS word_learning_state (
          word_id INTEGER PRIMARY KEY,
          first_learned_at TEXT NOT NULL,
          last_learned_at TEXT NOT NULL,
          learned_count INTEGER NOT NULL DEFAULT 0,
          FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS wrong_book_words (
          word_id INTEGER PRIMARY KEY,
          added_at TEXT NOT NULL,
          last_wrong_at TEXT NOT NULL,
          wrong_count INTEGER NOT NULL DEFAULT 0,
          sources TEXT NOT NULL DEFAULT '',
          FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS study_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          completed_at TEXT NOT NULL,
          study_date TEXT NOT NULL,
          word_count INTEGER NOT NULL,
          wrong_count INTEGER NOT NULL DEFAULT 0
        );
      `);
    });

    currentVersion = 2;
  }

  await db.execAsync(`PRAGMA user_version = ${currentVersion}`);
}
