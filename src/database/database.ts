import type { SQLiteDatabase } from 'expo-sqlite';

import {
  DEFAULT_PROFILE_CARD_CONTENT_COLOR,
  DEFAULT_PROFILE_TEXT_STROKE_COLOR,
  DEFAULT_PROFILE_TEXT_STROKE_WIDTH,
  PROFILE_USERNAME_MAX_LENGTH,
} from '@/constants/profile';

export const DATABASE_NAME = 'vocabulary.db';

export const DATABASE_VERSION = 14;

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

  if (currentVersion === 2) {
    await db.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.execAsync(`
        ALTER TABLE app_settings
        ADD COLUMN advance_on_mistakes INTEGER NOT NULL DEFAULT 1;

        ALTER TABLE app_settings
        ADD COLUMN listening_word_interval_seconds REAL NOT NULL DEFAULT 5.0;

        ALTER TABLE app_settings
        ADD COLUMN random_word_selection INTEGER NOT NULL DEFAULT 0;
      `);
    });

    currentVersion = 3;
  }

  if (currentVersion === 3) {
    await db.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.execAsync(`
        ALTER TABLE words
        ADD COLUMN learning_status TEXT NOT NULL DEFAULT 'unlearned'
        CHECK (learning_status IN ('unlearned', 'learned', 'wrong'));

        UPDATE words
        SET learning_status = 'wrong'
        WHERE id IN (
          SELECT word_id
          FROM wrong_book_words
        );

        UPDATE words
        SET learning_status = 'learned'
        WHERE learning_status = 'unlearned'
          AND id IN (
            SELECT word_id
            FROM word_learning_state
          );
      `);
    });

    currentVersion = 4;
  }

  if (currentVersion === 4) {
    await db.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.execAsync(`
        ALTER TABLE app_settings
        ADD COLUMN last_review_prompt_checkin INTEGER NOT NULL DEFAULT 0;
      `);
    });

    currentVersion = 5;
  }

  if (currentVersion === 5) {
    await db.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.execAsync(`
        ALTER TABLE app_settings
        ADD COLUMN wrong_review_random INTEGER NOT NULL DEFAULT 0;

        ALTER TABLE app_settings
        ADD COLUMN review_reminder_enabled INTEGER NOT NULL DEFAULT 1;

        ALTER TABLE app_settings
        ADD COLUMN review_reminder_interval_days INTEGER NOT NULL DEFAULT 3;

        ALTER TABLE app_settings
        ADD COLUMN last_review_prompt_study_day INTEGER NOT NULL DEFAULT 0;
      `);
    });

    currentVersion = 6;
  }

  if (currentVersion === 6) {
    await db.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.execAsync(`
        ALTER TABLE app_settings
        ADD COLUMN word_review_word_limit INTEGER NOT NULL DEFAULT 10;

        ALTER TABLE app_settings
        ADD COLUMN wrong_review_word_limit INTEGER NOT NULL DEFAULT 10;

        ALTER TABLE app_settings
        ADD COLUMN auto_remove_correct_wrong_review INTEGER NOT NULL DEFAULT 0;
      `);
    });

    currentVersion = 7;
  }

  if (currentVersion === 7) {
    await db.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.execAsync(`
        ALTER TABLE words
        ADD COLUMN example_sentence TEXT NOT NULL DEFAULT '';

        ALTER TABLE words
        ADD COLUMN example_source TEXT NOT NULL DEFAULT '';

        ALTER TABLE words
        ADD COLUMN example_generated_at TEXT;

        ALTER TABLE app_settings
        ADD COLUMN ai_overwrite_examples INTEGER NOT NULL DEFAULT 0;
      `);
    });

    currentVersion = 8;
  }

  if (currentVersion === 8) {
    await db.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.execAsync(`
        CREATE TABLE IF NOT EXISTS user_profile (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          display_name TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        INSERT OR IGNORE INTO user_profile (
          id,
          display_name,
          updated_at
        )
        VALUES (
          1,
          'User',
          '${new Date().toISOString()}'
        );
      `);
    });

    currentVersion = 9;
  }

  if (currentVersion === 9) {
    await db.runAsync(
      `UPDATE user_profile
       SET display_name = 'User',
           updated_at = $updatedAt
       WHERE id = 1
         AND display_name = '憔悴样'`,
      { $updatedAt: new Date().toISOString() },
    );

    currentVersion = 10;
  }

  if (currentVersion === 10) {
    await db.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.execAsync(`
        ALTER TABLE user_profile
        ADD COLUMN bio TEXT NOT NULL DEFAULT '';

        ALTER TABLE user_profile
        ADD COLUMN avatar_data TEXT NOT NULL DEFAULT '';

        ALTER TABLE user_profile
        ADD COLUMN background_data TEXT NOT NULL DEFAULT '';

        UPDATE user_profile
        SET display_name = substr(display_name, 1, ${PROFILE_USERNAME_MAX_LENGTH});
      `);
    });

    currentVersion = 12;
  }

  if (currentVersion === 12) {
    await db.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.execAsync(`
        ALTER TABLE user_profile
        ADD COLUMN card_content_color TEXT NOT NULL
        DEFAULT '${DEFAULT_PROFILE_CARD_CONTENT_COLOR}';
      `);
    });

    currentVersion = 13;
  }

  if (currentVersion === 13) {
    await db.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.execAsync(`
        ALTER TABLE user_profile
        ADD COLUMN text_stroke_color TEXT NOT NULL
        DEFAULT '${DEFAULT_PROFILE_TEXT_STROKE_COLOR}';

        ALTER TABLE user_profile
        ADD COLUMN text_stroke_width REAL NOT NULL
        DEFAULT ${DEFAULT_PROFILE_TEXT_STROKE_WIDTH};

        UPDATE user_profile
        SET card_content_color = '${DEFAULT_PROFILE_CARD_CONTENT_COLOR}'
        WHERE card_content_color = '#1D2430';
      `);
    });

    currentVersion = 14;
  }

  await db.execAsync(`PRAGMA user_version = ${currentVersion}`);
}
