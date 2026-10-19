import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

import type { SQLiteDatabase } from 'expo-sqlite';

import { migrateDatabase } from '../src/database/database';
import {
  DATABASE_TABLE_SCHEMAS,
  validateDatabaseSchema,
} from '../src/database/schema';
import {
  createArchiveSnapshot,
  parseArchiveSnapshot,
  restoreArchiveSnapshot,
  stringifyArchive,
} from '../src/features/archive/archiveSnapshot';

type SqlParams = Record<string, number | string | null> | undefined;

class NodeSqliteAdapter {
  constructor(readonly db: DatabaseSync) {}

  async execAsync(source: string): Promise<void> {
    this.db.exec(source);
  }

  async getAllAsync<T>(
    source: string,
    params?: SqlParams,
  ): Promise<T[]> {
    const statement = this.db.prepare(source);
    return (params ? statement.all(params) : statement.all()) as T[];
  }

  async getFirstAsync<T>(
    source: string,
    params?: SqlParams,
  ): Promise<T | null> {
    const statement = this.db.prepare(source);
    const row = params ? statement.get(params) : statement.get();
    return (row ?? null) as T | null;
  }

  async runAsync(
    source: string,
    params?: SqlParams,
  ): Promise<unknown> {
    const statement = this.db.prepare(source);
    return params ? statement.run(params) : statement.run();
  }

  async withExclusiveTransactionAsync(
    task: (transaction: NodeSqliteAdapter) => Promise<void>,
  ): Promise<void> {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      await task(this);
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
}

function createAdapter(): NodeSqliteAdapter {
  const db = new DatabaseSync(':memory:');
  const adapter = new NodeSqliteAdapter(db);

  for (const table of DATABASE_TABLE_SCHEMAS) {
    const columns = table.columns.map((column) => {
      if (column !== 'id') {
        return `"${column}" TEXT`;
      }
      if (table.name === 'words' || table.name === 'study_sessions') {
        return '"id" INTEGER PRIMARY KEY AUTOINCREMENT';
      }
      return '"id" INTEGER PRIMARY KEY';
    });
    db.exec(`CREATE TABLE "${table.name}" (${columns.join(', ')})`);
  }

  return adapter;
}

function asDatabase(adapter: NodeSqliteAdapter): SQLiteDatabase {
  return adapter as unknown as SQLiteDatabase;
}

test('validates the current database schema', async () => {
  const adapter = createAdapter();
  await validateDatabaseSchema(asDatabase(adapter));
});

test('migrates an empty database to v17 and matches schema', async () => {
  const adapter = new NodeSqliteAdapter(new DatabaseSync(':memory:'));

  await migrateDatabase(asDatabase(adapter));
  await validateDatabaseSchema(asDatabase(adapter));

  const version = adapter.db
    .prepare('PRAGMA user_version')
    .get() as { user_version: number };
  const settings = adapter.db
    .prepare(
      `SELECT daily_word_limit, listening_default_rate
       FROM app_settings
       WHERE id = 1`,
    )
    .get() as {
    daily_word_limit: number;
    listening_default_rate: number;
  };

  assert.equal(version.user_version, 17);
  assert.equal(settings.daily_word_limit, 10);
  assert.equal(settings.listening_default_rate, 1);
});

test('rejects a database whose table columns drifted', async () => {
  const adapter = createAdapter();
  adapter.db.exec('ALTER TABLE words ADD COLUMN unexpected TEXT');

  await assert.rejects(
    () => validateDatabaseSchema(asDatabase(adapter)),
    /数据库表 words 结构不匹配/,
  );
});

test('round-trips archive JSON and restores all tables', async () => {
  const source = createAdapter();
  const now = '2026-10-19T10:00:00.000Z';

  await source.runAsync(
    `INSERT INTO words (
       id, word, meaning, phonetic, created_at, updated_at,
       is_active, learning_status, example_sentence,
       example_source, example_generated_at
     ) VALUES (
       1, $word, $meaning, $phonetic, $now, $now,
       1, $status, $example, $source, $now
     )`,
    {
      $example: 'They had to abandon the old plan.',
      $meaning: '放弃',
      $now: now,
      $phonetic: '/əˈbændən/',
      $source: 'csv',
      $status: 'learned',
      $word: 'abandon',
    },
  );
  await source.runAsync(
    `INSERT INTO app_settings (
       id, daily_word_limit, listening_default_rate,
       advance_on_mistakes, listening_word_interval_seconds,
       random_word_selection, last_review_prompt_checkin,
       wrong_review_random, review_reminder_enabled,
       review_reminder_interval_days, last_review_prompt_study_day,
       word_review_word_limit, wrong_review_word_limit,
       auto_remove_correct_wrong_review, ai_overwrite_examples,
       theme_mode, theme_accent_color, theme_surface_color,
       theme_background_color, theme_primary_color
     ) VALUES (
       1, 10, 1, 1, 5, 0, 0, 0, 1, 3, 0, 10, 10, 0, 0,
       'day', '#FFFFFF', '#FFFFFF', '#F0F0F8', '#FFFFFF'
     )`,
  );
  await source.runAsync(
    `INSERT INTO user_profile (
       id, display_name, updated_at, bio, avatar_data,
       background_data, card_content_color, text_stroke_color,
       text_stroke_width
     ) VALUES (
       1, 'Tester', $now, 'Bio', '', '', '#FFFFFF', '#000000', 2
     )`,
    { $now: now },
  );
  await source.runAsync(
    `INSERT INTO word_learning_state (
       word_id, first_learned_at, last_learned_at, learned_count
     ) VALUES (1, $now, $now, 1)`,
    { $now: now },
  );
  await source.runAsync(
    `INSERT INTO wrong_book_words (
       word_id, added_at, last_wrong_at, wrong_count, sources
     ) VALUES (1, $now, $now, 1, 'fill')`,
    { $now: now },
  );
  await source.runAsync(
    `INSERT INTO study_sessions (
       id, completed_at, study_date, word_count, wrong_count
     ) VALUES (1, $now, '2026-10-19', 1, 1)`,
    { $now: now },
  );

  const snapshot = await createArchiveSnapshot(asDatabase(source));
  const parsed = parseArchiveSnapshot(stringifyArchive(snapshot));
  const target = createAdapter();

  await restoreArchiveSnapshot(asDatabase(target), parsed);
  const restored = await createArchiveSnapshot(asDatabase(target));

  assert.deepEqual(restored.tables, snapshot.tables);
  assert.equal(restored.summary.words, 1);
  assert.equal(restored.summary.learnedWords, 1);
  assert.equal(restored.summary.wrongWords, 1);
});

test('rejects archives with another format', () => {
  assert.throws(
    () => parseArchiveSnapshot(JSON.stringify({ format: 'other' })),
    /不是本 App 的存档文件/,
  );
});
