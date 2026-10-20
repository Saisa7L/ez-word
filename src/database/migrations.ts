import type { SQLiteDatabase } from 'expo-sqlite';

import {
  DEFAULT_PROFILE_CARD_CONTENT_COLOR,
  DEFAULT_PROFILE_TEXT_STROKE_COLOR,
  DEFAULT_PROFILE_TEXT_STROKE_WIDTH,
  PROFILE_USERNAME_MAX_LENGTH,
} from '@/constants/profile';
import {
  DEFAULT_CUSTOM_BACKGROUND_COLOR,
  DEFAULT_CUSTOM_SURFACE_COLOR,
  DEFAULT_THEME_MODE,
  DEFAULT_THEME_PRIMARY_COLOR,
} from '@/constants/theme';

import { DEFAULT_DAILY_TASK_SETTINGS } from './settingsRepository';

export type DatabaseMigration = {
  description: string;
  to: number;
  up: (db: SQLiteDatabase) => Promise<void>;
};

async function ensureColumn(
  db: SQLiteDatabase,
  table: string,
  column: string,
  definition: string,
): Promise<void> {
  const columns = await db.getAllAsync<{ name: string }>(
    `PRAGMA table_info(${table})`,
  );

  if (!columns.some((entry) => entry.name === column)) {
    await db.execAsync(
      `ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`,
    );
  }
}

export const MIGRATIONS: readonly DatabaseMigration[] = [
  {
    description: '创建基础单词表',
    to: 1,
    up: async (db) => {
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
    },
  },
  {
    description: '增加软删除、设置、学习与错题表',
    to: 2,
    up: async (db) => {
      await ensureColumn(
        db,
        'words',
        'is_active',
        'INTEGER NOT NULL DEFAULT 1',
      );
      await db.execAsync(`
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
        VALUES (
          1,
          ${DEFAULT_DAILY_TASK_SETTINGS.dailyWordLimit},
          ${DEFAULT_DAILY_TASK_SETTINGS.listeningDefaultRate}
        );

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
    },
  },
  {
    description: '增加答错前进、听力间隔和随机选词设置',
    to: 3,
    up: async (db) => {
      await ensureColumn(
        db,
        'app_settings',
        'advance_on_mistakes',
        'INTEGER NOT NULL DEFAULT 1',
      );
      await ensureColumn(
        db,
        'app_settings',
        'listening_word_interval_seconds',
        'REAL NOT NULL DEFAULT 5.0',
      );
      await ensureColumn(
        db,
        'app_settings',
        'random_word_selection',
        'INTEGER NOT NULL DEFAULT 0',
      );
    },
  },
  {
    description: '增加单词学习状态',
    to: 4,
    up: async (db) => {
      await ensureColumn(
        db,
        'words',
        'learning_status',
        `TEXT NOT NULL DEFAULT 'unlearned'
         CHECK (learning_status IN ('unlearned', 'learned', 'wrong'))`,
      );
      await db.execAsync(`
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
    },
  },
  {
    description: '增加旧版复习提醒字段',
    to: 5,
    up: async (db) => {
      await ensureColumn(
        db,
        'app_settings',
        'last_review_prompt_checkin',
        'INTEGER NOT NULL DEFAULT 0',
      );
    },
  },
  {
    description: '增加错题随机和复习提醒设置',
    to: 6,
    up: async (db) => {
      await ensureColumn(
        db,
        'app_settings',
        'wrong_review_random',
        'INTEGER NOT NULL DEFAULT 0',
      );
      await ensureColumn(
        db,
        'app_settings',
        'review_reminder_enabled',
        'INTEGER NOT NULL DEFAULT 1',
      );
      await ensureColumn(
        db,
        'app_settings',
        'review_reminder_interval_days',
        'INTEGER NOT NULL DEFAULT 3',
      );
      await ensureColumn(
        db,
        'app_settings',
        'last_review_prompt_study_day',
        'INTEGER NOT NULL DEFAULT 0',
      );
    },
  },
  {
    description: '增加复习数量设置',
    to: 7,
    up: async (db) => {
      await ensureColumn(
        db,
        'app_settings',
        'word_review_word_limit',
        'INTEGER NOT NULL DEFAULT 10',
      );
      await ensureColumn(
        db,
        'app_settings',
        'wrong_review_word_limit',
        'INTEGER NOT NULL DEFAULT 10',
      );
      await ensureColumn(
        db,
        'app_settings',
        'auto_remove_correct_wrong_review',
        'INTEGER NOT NULL DEFAULT 0',
      );
    },
  },
  {
    description: '增加例句和 AI 覆盖设置',
    to: 8,
    up: async (db) => {
      await ensureColumn(
        db,
        'words',
        'example_sentence',
        "TEXT NOT NULL DEFAULT ''",
      );
      await ensureColumn(
        db,
        'words',
        'example_source',
        "TEXT NOT NULL DEFAULT ''",
      );
      await ensureColumn(db, 'words', 'example_generated_at', 'TEXT');
      await ensureColumn(
        db,
        'app_settings',
        'ai_overwrite_examples',
        'INTEGER NOT NULL DEFAULT 0',
      );
    },
  },
  {
    description: '创建个人资料表',
    to: 9,
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS user_profile (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          display_name TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);
      await db.runAsync(
        `INSERT OR IGNORE INTO user_profile (
           id,
           display_name,
           updated_at
         )
         VALUES (1, 'User', $updatedAt)`,
        { $updatedAt: new Date().toISOString() },
      );
    },
  },
  {
    description: '修正默认用户名',
    to: 10,
    up: async (db) => {
      await db.runAsync(
        `UPDATE user_profile
         SET display_name = 'User',
             updated_at = $updatedAt
         WHERE id = 1
           AND display_name = '憔悴样'`,
        { $updatedAt: new Date().toISOString() },
      );
    },
  },
  {
    description: '增加简介、头像和名片背景',
    to: 12,
    up: async (db) => {
      await ensureColumn(db, 'user_profile', 'bio', "TEXT NOT NULL DEFAULT ''");
      await ensureColumn(
        db,
        'user_profile',
        'avatar_data',
        "TEXT NOT NULL DEFAULT ''",
      );
      await ensureColumn(
        db,
        'user_profile',
        'background_data',
        "TEXT NOT NULL DEFAULT ''",
      );
      await db.execAsync(`
        UPDATE user_profile
        SET display_name = substr(display_name, 1, ${PROFILE_USERNAME_MAX_LENGTH});
      `);
    },
  },
  {
    description: '增加名片文字颜色',
    to: 13,
    up: async (db) => {
      await ensureColumn(
        db,
        'user_profile',
        'card_content_color',
        `TEXT NOT NULL DEFAULT '${DEFAULT_PROFILE_CARD_CONTENT_COLOR}'`,
      );
    },
  },
  {
    description: '增加名片描边设置',
    to: 14,
    up: async (db) => {
      await ensureColumn(
        db,
        'user_profile',
        'text_stroke_color',
        `TEXT NOT NULL DEFAULT '${DEFAULT_PROFILE_TEXT_STROKE_COLOR}'`,
      );
      await ensureColumn(
        db,
        'user_profile',
        'text_stroke_width',
        `REAL NOT NULL DEFAULT ${DEFAULT_PROFILE_TEXT_STROKE_WIDTH}`,
      );
      await db.execAsync(`
        UPDATE user_profile
        SET card_content_color = '${DEFAULT_PROFILE_CARD_CONTENT_COLOR}'
        WHERE card_content_color = '#1D2430';
      `);
    },
  },
  {
    description: '增加旧版主题模式与主色',
    to: 15,
    up: async (db) => {
      await ensureColumn(
        db,
        'app_settings',
        'theme_mode',
        `TEXT NOT NULL DEFAULT '${DEFAULT_THEME_MODE}'`,
      );
      await ensureColumn(
        db,
        'app_settings',
        'theme_accent_color',
        `TEXT NOT NULL DEFAULT '${DEFAULT_CUSTOM_SURFACE_COLOR}'`,
      );
    },
  },
  {
    description: '增加旧版主题表面与背景色',
    to: 16,
    up: async (db) => {
      await ensureColumn(
        db,
        'app_settings',
        'theme_surface_color',
        `TEXT NOT NULL DEFAULT '${DEFAULT_CUSTOM_SURFACE_COLOR}'`,
      );
      await ensureColumn(
        db,
        'app_settings',
        'theme_background_color',
        `TEXT NOT NULL DEFAULT '${DEFAULT_CUSTOM_BACKGROUND_COLOR}'`,
      );
      await db.execAsync(`
        UPDATE app_settings
        SET theme_surface_color = theme_accent_color
        WHERE theme_mode = 'custom';
      `);
    },
  },
  {
    description: '增加当前主题主色',
    to: 17,
    up: async (db) => {
      await ensureColumn(
        db,
        'app_settings',
        'theme_primary_color',
        `TEXT NOT NULL DEFAULT '${DEFAULT_THEME_PRIMARY_COLOR}'`,
      );
      await db.execAsync(`
        UPDATE app_settings
        SET theme_primary_color = CASE
          WHEN theme_mode = 'custom' THEN theme_surface_color
          ELSE '${DEFAULT_THEME_PRIMARY_COLOR}'
        END;
      `);
    },
  },
  {
    description: '增加任务、复习和统计查询索引',
    to: 18,
    up: async (db) => {
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_words_active_status_word
        ON words(is_active, learning_status, word COLLATE NOCASE);

        CREATE INDEX IF NOT EXISTS idx_learning_last_learned
        ON word_learning_state(last_learned_at);

        CREATE INDEX IF NOT EXISTS idx_wrong_last_wrong
        ON wrong_book_words(last_wrong_at DESC);

        CREATE INDEX IF NOT EXISTS idx_sessions_study_date
        ON study_sessions(study_date);
      `);
    },
  },
  {
    description: '拆分设置表并移除旧主题列',
    to: 19,
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS task_settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          daily_word_limit INTEGER NOT NULL DEFAULT 10,
          listening_default_rate REAL NOT NULL DEFAULT 1,
          advance_on_mistakes INTEGER NOT NULL DEFAULT 1,
          listening_word_interval_seconds REAL NOT NULL DEFAULT 5,
          random_word_selection INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS review_settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          last_review_prompt_study_day INTEGER NOT NULL DEFAULT 0,
          wrong_review_random INTEGER NOT NULL DEFAULT 0,
          review_reminder_enabled INTEGER NOT NULL DEFAULT 1,
          review_reminder_interval_days INTEGER NOT NULL DEFAULT 3,
          word_review_word_limit INTEGER NOT NULL DEFAULT 10,
          wrong_review_word_limit INTEGER NOT NULL DEFAULT 10,
          auto_remove_correct_wrong_review INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS ai_settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          ai_overwrite_examples INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS theme_settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          theme_mode TEXT NOT NULL DEFAULT 'day'
            CHECK (theme_mode IN ('day', 'night', 'custom')),
          theme_primary_color TEXT NOT NULL DEFAULT '${DEFAULT_THEME_PRIMARY_COLOR}'
        );

        INSERT OR IGNORE INTO task_settings (
          id,
          daily_word_limit,
          listening_default_rate,
          advance_on_mistakes,
          listening_word_interval_seconds,
          random_word_selection
        )
        SELECT
          id,
          daily_word_limit,
          listening_default_rate,
          advance_on_mistakes,
          listening_word_interval_seconds,
          random_word_selection
        FROM app_settings
        WHERE id = 1;

        INSERT OR IGNORE INTO review_settings (
          id,
          last_review_prompt_study_day,
          wrong_review_random,
          review_reminder_enabled,
          review_reminder_interval_days,
          word_review_word_limit,
          wrong_review_word_limit,
          auto_remove_correct_wrong_review
        )
        SELECT
          id,
          last_review_prompt_study_day,
          wrong_review_random,
          review_reminder_enabled,
          review_reminder_interval_days,
          word_review_word_limit,
          wrong_review_word_limit,
          auto_remove_correct_wrong_review
        FROM app_settings
        WHERE id = 1;

        INSERT OR IGNORE INTO ai_settings (id, ai_overwrite_examples)
        SELECT id, ai_overwrite_examples
        FROM app_settings
        WHERE id = 1;

        INSERT OR IGNORE INTO theme_settings (
          id,
          theme_mode,
          theme_primary_color
        )
        SELECT id, theme_mode, theme_primary_color
        FROM app_settings
        WHERE id = 1;

        INSERT OR IGNORE INTO task_settings (id) VALUES (1);
        INSERT OR IGNORE INTO review_settings (id) VALUES (1);
        INSERT OR IGNORE INTO ai_settings (id) VALUES (1);
        INSERT OR IGNORE INTO theme_settings (id) VALUES (1);

        DROP TABLE app_settings;
      `);
    },
  },
];

export async function runMigrations(
  db: SQLiteDatabase,
  currentVersion: number,
  migrations: readonly DatabaseMigration[] = MIGRATIONS,
): Promise<number> {
  let version = currentVersion;

  await db.withTransactionAsync(async () => {
    for (const migration of migrations) {
      if (version >= migration.to) {
        continue;
      }

      await migration.up(db);
      version = migration.to;
      await db.execAsync(`PRAGMA user_version = ${version}`);
    }
  });

  return version;
}
