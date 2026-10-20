import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

import type { SQLiteDatabase } from 'expo-sqlite';

import {
  loadDailyTaskSelection,
  loadWordReviewSelection,
  loadWrongReviewSelection,
} from '../src/application/daily-task/startTaskSelection';
import { migrateDatabase } from '../src/database/database';
import {
  MIGRATIONS,
  runMigrations,
  type DatabaseMigration,
} from '../src/database/migrations';
import { getDailyTaskSettings } from '../src/database/settingsRepository';
import { validateDatabaseSchema } from '../src/database/schema';
import { completeTaskSession } from '../src/database/taskCompletionRepository';
import {
  getThemeSettings,
  saveThemeSettings,
} from '../src/database/themeRepository';
import { getUserProfile } from '../src/database/userProfileRepository';
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

  async getAllAsync<T>(source: string, params?: SqlParams): Promise<T[]> {
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

  async runAsync(source: string, params?: SqlParams): Promise<unknown> {
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

  async withTransactionAsync(task: () => Promise<void>): Promise<void> {
    this.db.exec('BEGIN');
    try {
      await task();
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
}

async function createMigratedAdapter(): Promise<NodeSqliteAdapter> {
  const adapter = new NodeSqliteAdapter(new DatabaseSync(':memory:'));
  await migrateDatabase(asDatabase(adapter));
  return adapter;
}

function asDatabase(adapter: NodeSqliteAdapter): SQLiteDatabase {
  return adapter as unknown as SQLiteDatabase;
}

async function insertTestWord(
  adapter: NodeSqliteAdapter,
  options: {
    exampleSentence?: string;
    id: number;
    learningStatus?: 'learned' | 'unlearned' | 'wrong';
    word: string;
  },
): Promise<void> {
  const now = '2026-10-19T10:00:00.000Z';
  await adapter.runAsync(
    `INSERT INTO words (
       id, word, meaning, phonetic, created_at, updated_at,
       is_active, learning_status, example_sentence,
       example_source, example_generated_at
     ) VALUES (
       $id, $word, $meaning, '', $now, $now,
       1, $status, $example, '', NULL
     )`,
    {
      $example: options.exampleSentence ?? '',
      $id: options.id,
      $meaning: options.word,
      $now: now,
      $status: options.learningStatus ?? 'unlearned',
      $word: options.word,
    },
  );
}

function convertSettingsToLegacyArchive(archive: {
  databaseVersion: number;
  tables: Record<string, Record<string, unknown>[]>;
}): Record<string, unknown> {
  const task = archive.tables.task_settings[0];
  const review = archive.tables.review_settings[0];
  const ai = archive.tables.ai_settings[0];
  const theme = archive.tables.theme_settings[0];
  if (!task || !review || !ai || !theme) {
    throw new Error('当前测试存档缺少设置行');
  }

  const legacySettings = {
    advance_on_mistakes: task.advance_on_mistakes,
    ai_overwrite_examples: ai.ai_overwrite_examples,
    auto_remove_correct_wrong_review: review.auto_remove_correct_wrong_review,
    daily_word_limit: task.daily_word_limit,
    id: 1,
    last_review_prompt_checkin: 0,
    last_review_prompt_study_day: review.last_review_prompt_study_day,
    listening_default_rate: task.listening_default_rate,
    listening_word_interval_seconds: task.listening_word_interval_seconds,
    random_word_selection: task.random_word_selection,
    review_reminder_enabled: review.review_reminder_enabled,
    review_reminder_interval_days: review.review_reminder_interval_days,
    theme_accent_color: '#FFFFFF',
    theme_background_color: '#F0F0F8',
    theme_mode: theme.theme_mode,
    theme_primary_color: theme.theme_primary_color,
    theme_surface_color: '#FFFFFF',
    word_review_word_limit: review.word_review_word_limit,
    wrong_review_random: review.wrong_review_random,
    wrong_review_word_limit: review.wrong_review_word_limit,
  };

  archive.tables.app_settings = [legacySettings];
  delete archive.tables.task_settings;
  delete archive.tables.review_settings;
  delete archive.tables.ai_settings;
  delete archive.tables.theme_settings;
  return legacySettings;
}

test('validates the current database schema', async () => {
  const adapter = await createMigratedAdapter();
  await validateDatabaseSchema(asDatabase(adapter));
});

test('migrates an empty database to v19 and matches schema', async () => {
  const adapter = new NodeSqliteAdapter(new DatabaseSync(':memory:'));

  await migrateDatabase(asDatabase(adapter));
  await validateDatabaseSchema(asDatabase(adapter));

  const version = adapter.db.prepare('PRAGMA user_version').get() as {
    user_version: number;
  };
  const settings = adapter.db
    .prepare(
      `SELECT daily_word_limit, listening_default_rate
       FROM task_settings
       WHERE id = 1`,
    )
    .get() as {
    daily_word_limit: number;
    listening_default_rate: number;
  };

  assert.equal(version.user_version, 19);
  assert.equal(settings.daily_word_limit, 10);
  assert.equal(settings.listening_default_rate, 1);
});

test('rejects a database whose table columns drifted', async () => {
  const adapter = await createMigratedAdapter();
  adapter.db.exec('ALTER TABLE words ADD COLUMN unexpected TEXT');

  await assert.rejects(
    () => validateDatabaseSchema(asDatabase(adapter)),
    /数据库表 words 结构不匹配/,
  );
});

test('round-trips archive JSON and restores all tables', async () => {
  const source = await createMigratedAdapter();
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
    `UPDATE task_settings
     SET daily_word_limit = 12,
         listening_default_rate = 1.5,
         advance_on_mistakes = 0,
         listening_word_interval_seconds = 4,
         random_word_selection = 1
     WHERE id = 1`,
  );
  await source.runAsync(
    `UPDATE review_settings
     SET wrong_review_random = 1,
         review_reminder_enabled = 0,
         review_reminder_interval_days = 7,
         last_review_prompt_study_day = 3,
         word_review_word_limit = 20,
         wrong_review_word_limit = 15,
         auto_remove_correct_wrong_review = 1
     WHERE id = 1`,
  );
  await source.runAsync(
    'UPDATE ai_settings SET ai_overwrite_examples = 1 WHERE id = 1',
  );
  await source.runAsync(
    `UPDATE theme_settings
     SET theme_mode = 'custom',
         theme_primary_color = '#245A8D'
     WHERE id = 1`,
  );
  await source.runAsync(
    `INSERT OR REPLACE INTO user_profile (
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
  const target = await createMigratedAdapter();

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

test('rolls back every pending migration when one step fails', async () => {
  const adapter = new NodeSqliteAdapter(new DatabaseSync(':memory:'));
  const migrations: readonly DatabaseMigration[] = [
    {
      description: '创建第一张表',
      to: 1,
      up: async (db) => {
        await db.execAsync('CREATE TABLE first_migration_test (id INTEGER)');
      },
    },
    {
      description: '故意失败',
      to: 2,
      up: async () => {
        throw new Error('migration failed');
      },
    },
  ];

  await assert.rejects(
    () => runMigrations(asDatabase(adapter), 0, migrations),
    /migration failed/,
  );

  const table = adapter.db
    .prepare(
      `SELECT name
       FROM sqlite_master
       WHERE type = 'table'
         AND name = 'first_migration_test'`,
    )
    .get();
  const version = adapter.db.prepare('PRAGMA user_version').get() as {
    user_version: number;
  };

  assert.equal(table, undefined);
  assert.equal(version.user_version, 0);
});

test('repairs a schema that advanced before user_version was written', async () => {
  const adapter = await createMigratedAdapter();
  adapter.db.exec('PRAGMA user_version = 0');

  await migrateDatabase(asDatabase(adapter));
  await validateDatabaseSchema(asDatabase(adapter));

  const version = adapter.db.prepare('PRAGMA user_version').get() as {
    user_version: number;
  };
  assert.equal(version.user_version, 19);
});

test('recreates theme settings before saving a theme', async () => {
  const adapter = await createMigratedAdapter();
  adapter.db.exec('DELETE FROM theme_settings');

  await saveThemeSettings(asDatabase(adapter), {
    mode: 'custom',
    primaryColor: '#245A8D',
  });

  const settings = await getThemeSettings(asDatabase(adapter));
  const count = adapter.db
    .prepare('SELECT COUNT(*) AS total FROM theme_settings')
    .get() as { total: number };

  assert.deepEqual(settings, {
    mode: 'custom',
    primaryColor: '#245A8D',
  });
  assert.equal(count.total, 1);
});

test('migrates v18 settings into split v19 tables', async () => {
  const adapter = new NodeSqliteAdapter(new DatabaseSync(':memory:'));
  const migrationsThroughV18 = MIGRATIONS.filter(
    (migration) => migration.to <= 18,
  );
  await runMigrations(asDatabase(adapter), 0, migrationsThroughV18);
  adapter.db.exec(`
    UPDATE app_settings
    SET daily_word_limit = 37,
        listening_default_rate = 1.5,
        word_review_word_limit = 23,
        ai_overwrite_examples = 1,
        theme_mode = 'night'
    WHERE id = 1;
  `);

  await runMigrations(asDatabase(adapter), 18);
  await validateDatabaseSchema(asDatabase(adapter));

  const task = adapter.db
    .prepare(
      'SELECT daily_word_limit, listening_default_rate FROM task_settings',
    )
    .get() as { daily_word_limit: number; listening_default_rate: number };
  const review = adapter.db
    .prepare('SELECT word_review_word_limit FROM review_settings')
    .get() as { word_review_word_limit: number };
  const ai = adapter.db
    .prepare('SELECT ai_overwrite_examples FROM ai_settings')
    .get() as { ai_overwrite_examples: number };
  const theme = adapter.db
    .prepare('SELECT theme_mode FROM theme_settings')
    .get() as { theme_mode: string };
  const legacyTable = adapter.db
    .prepare(
      `SELECT name
       FROM sqlite_master
       WHERE type = 'table' AND name = 'app_settings'`,
    )
    .get();

  assert.deepEqual(
    { ...task },
    {
      daily_word_limit: 37,
      listening_default_rate: 1.5,
    },
  );
  assert.equal(review.word_review_word_limit, 23);
  assert.equal(ai.ai_overwrite_examples, 1);
  assert.equal(theme.theme_mode, 'night');
  assert.equal(legacyTable, undefined);
});

test('rejects database versions supported by a newer app', async () => {
  const adapter = await createMigratedAdapter();
  adapter.db.exec('PRAGMA user_version = 20');

  await assert.rejects(
    () => migrateDatabase(asDatabase(adapter)),
    /高于 App 支持的 19/,
  );
});

test('rejects database versions without a migration path', async () => {
  const adapter = new NodeSqliteAdapter(new DatabaseSync(':memory:'));
  adapter.db.exec('PRAGMA user_version = 11');

  await assert.rejects(
    () => migrateDatabase(asDatabase(adapter)),
    /不支持的数据库版本：11/,
  );
});

test('reads daily task settings without creating a missing row', async () => {
  const adapter = await createMigratedAdapter();
  adapter.db.exec(`
    DELETE FROM task_settings;
    DELETE FROM review_settings;
  `);

  const settings = await getDailyTaskSettings(asDatabase(adapter));
  const taskCount = adapter.db
    .prepare('SELECT COUNT(*) AS total FROM task_settings')
    .get() as { total: number };
  const reviewCount = adapter.db
    .prepare('SELECT COUNT(*) AS total FROM review_settings')
    .get() as { total: number };

  assert.equal(settings.dailyWordLimit, 10);
  assert.equal(taskCount.total, 0);
  assert.equal(reviewCount.total, 0);
});

test('migrates a v16 custom theme into the current archive shape', async () => {
  const source = await createMigratedAdapter();
  const snapshot = await createArchiveSnapshot(asDatabase(source));
  const archive = JSON.parse(stringifyArchive(snapshot)) as {
    databaseVersion: number;
    tables: Record<string, Record<string, unknown>[]>;
  };

  archive.databaseVersion = 16;
  const settings = convertSettingsToLegacyArchive(archive);
  settings.theme_mode = 'custom';
  delete settings.theme_primary_color;
  settings.theme_surface_color = '#245A8D';
  settings.theme_accent_color = '#112233';

  const parsed = parseArchiveSnapshot(JSON.stringify(archive));
  assert.equal(parsed.tables.theme_settings[0]?.theme_primary_color, '#245A8D');

  const target = await createMigratedAdapter();
  await restoreArchiveSnapshot(asDatabase(target), parsed);
  const theme = await getThemeSettings(asDatabase(target));

  assert.deepEqual(theme, {
    mode: 'custom',
    primaryColor: '#245A8D',
  });
});

test('migrates a v18 app settings archive into split tables', async () => {
  const source = await createMigratedAdapter();
  const snapshot = await createArchiveSnapshot(asDatabase(source));
  const archive = JSON.parse(stringifyArchive(snapshot)) as {
    databaseVersion: number;
    tables: Record<string, Record<string, unknown>[]>;
  };

  archive.databaseVersion = 18;
  const settings = convertSettingsToLegacyArchive(archive);
  settings.daily_word_limit = 33;
  settings.word_review_word_limit = 19;
  settings.theme_mode = 'night';

  const parsed = parseArchiveSnapshot(JSON.stringify(archive));
  assert.equal(parsed.tables.task_settings[0]?.daily_word_limit, 33);
  assert.equal(parsed.tables.review_settings[0]?.word_review_word_limit, 19);
  assert.equal(parsed.tables.theme_settings[0]?.theme_mode, 'night');
  assert.equal(parsed.tables.app_settings, undefined);

  const target = await createMigratedAdapter();
  await restoreArchiveSnapshot(asDatabase(target), parsed);
  const restored = await getDailyTaskSettings(asDatabase(target));
  assert.equal(restored.dailyWordLimit, 33);
  assert.equal(restored.wordReviewWordLimit, 19);
});

test('rejects current archives with missing required fields', async () => {
  const source = await createMigratedAdapter();
  const snapshot = await createArchiveSnapshot(asDatabase(source));
  const archive = JSON.parse(stringifyArchive(snapshot)) as {
    tables: Record<string, Record<string, unknown>[]>;
  };

  delete archive.tables.theme_settings[0].theme_primary_color;

  assert.throws(
    () => parseArchiveSnapshot(JSON.stringify(archive)),
    /缺少字段 theme_primary_color/,
  );
});

test('rejects archive image values that are not local data URIs', async () => {
  const source = await createMigratedAdapter();
  const snapshot = await createArchiveSnapshot(asDatabase(source));
  const archive = JSON.parse(stringifyArchive(snapshot)) as {
    tables: Record<string, Record<string, unknown>[]>;
  };

  archive.tables.user_profile[0].avatar_data = 'https://example.com/avatar.png';

  assert.throws(
    () => parseArchiveSnapshot(JSON.stringify(archive)),
    /不是受支持的本地图片/,
  );
});

test('rejects archive child rows that reference missing words', async () => {
  const source = await createMigratedAdapter();
  const snapshot = await createArchiveSnapshot(asDatabase(source));
  const archive = JSON.parse(stringifyArchive(snapshot)) as {
    tables: Record<string, Record<string, unknown>[]>;
  };

  archive.tables.word_learning_state.push({
    first_learned_at: '2026-10-19T10:00:00.000Z',
    last_learned_at: '2026-10-19T10:00:00.000Z',
    learned_count: 1,
    word_id: 1,
  });

  assert.throws(
    () => parseArchiveSnapshot(JSON.stringify(archive)),
    /引用了不存在的单词/,
  );
});

test('restores an empty settings collection with default settings', async () => {
  const source = await createMigratedAdapter();
  const snapshot = await createArchiveSnapshot(asDatabase(source));
  const archive = JSON.parse(stringifyArchive(snapshot)) as {
    tables: Record<string, Record<string, unknown>[]>;
  };
  archive.tables.task_settings = [];
  archive.tables.review_settings = [];
  archive.tables.ai_settings = [];
  archive.tables.theme_settings = [];

  const parsed = parseArchiveSnapshot(JSON.stringify(archive));
  const target = await createMigratedAdapter();
  await restoreArchiveSnapshot(asDatabase(target), parsed);

  const settings = await getDailyTaskSettings(asDatabase(target));
  assert.equal(settings.dailyWordLimit, 10);
});

test('fills v10 profile and theme defaults during archive migration', async () => {
  const source = await createMigratedAdapter();
  const snapshot = await createArchiveSnapshot(asDatabase(source));
  const archive = JSON.parse(stringifyArchive(snapshot)) as {
    databaseVersion: number;
    tables: Record<string, Record<string, unknown>[]>;
  };
  const profile = archive.tables.user_profile[0];

  archive.databaseVersion = 10;
  const settings = convertSettingsToLegacyArchive(archive);
  delete settings.theme_mode;
  delete settings.theme_primary_color;
  delete profile.bio;
  delete profile.avatar_data;
  delete profile.background_data;
  delete profile.card_content_color;
  delete profile.text_stroke_color;
  delete profile.text_stroke_width;

  const parsed = parseArchiveSnapshot(JSON.stringify(archive));
  assert.equal(parsed.tables.theme_settings[0]?.theme_mode, 'day');
  assert.equal(parsed.tables.theme_settings[0]?.theme_primary_color, '#FFFFFF');
  assert.equal(parsed.tables.user_profile[0]?.bio, '');

  const target = await createMigratedAdapter();
  await restoreArchiveSnapshot(asDatabase(target), parsed);
  const profileResult = await getUserProfile(asDatabase(target));

  assert.equal(profileResult.bio, '');
  assert.equal(profileResult.avatarData, '');
});

test('uses the default theme for a v14 archive without theme fields', async () => {
  const source = await createMigratedAdapter();
  const snapshot = await createArchiveSnapshot(asDatabase(source));
  const archive = JSON.parse(stringifyArchive(snapshot)) as {
    databaseVersion: number;
    tables: Record<string, Record<string, unknown>[]>;
  };

  archive.databaseVersion = 14;
  const settings = convertSettingsToLegacyArchive(archive);
  delete settings.theme_mode;
  delete settings.theme_primary_color;

  const parsed = parseArchiveSnapshot(JSON.stringify(archive));
  const target = await createMigratedAdapter();
  await restoreArchiveSnapshot(asDatabase(target), parsed);
  const theme = await getThemeSettings(asDatabase(target));

  assert.deepEqual(theme, {
    mode: 'day',
    primaryColor: '#FFFFFF',
  });
});

test('persists daily task state only in one completion step', async () => {
  const adapter = await createMigratedAdapter();
  const db = asDatabase(adapter);
  const now = '2026-10-19T10:00:00.000Z';

  for (const [id, word] of [
    [1, 'abandon'],
    [2, 'brief'],
  ] as const) {
    await db.runAsync(
      `INSERT INTO words (
         id, word, meaning, phonetic, created_at, updated_at,
         is_active, learning_status, example_sentence,
         example_source, example_generated_at
       ) VALUES (
         $id, $word, $meaning, '', $now, $now,
         1, 'unlearned', '', '', NULL
       )`,
      {
        $id: id,
        $meaning: word,
        $now: now,
        $word: word,
      },
    );
  }

  const beforeWrongBook = adapter.db
    .prepare('SELECT COUNT(*) AS total FROM wrong_book_words')
    .get() as { total: number };
  assert.equal(beforeWrongBook.total, 0);

  const result = await completeTaskSession(db, {
    autoRemoveCorrectWrongReview: false,
    completedAt: new Date(now),
    fillMistakeWordIds: [1],
    listeningMistakeWordIds: [1, 2],
    mode: 'daily',
    wordIds: [1, 2],
  });

  const wrongRows = adapter.db
    .prepare(
      `SELECT word_id, wrong_count, sources
       FROM wrong_book_words
       ORDER BY word_id`,
    )
    .all() as {
    sources: string;
    word_id: number;
    wrong_count: number;
  }[];
  const statusRows = adapter.db
    .prepare('SELECT id, learning_status FROM words ORDER BY id')
    .all() as { id: number; learning_status: string }[];
  const learningCount = adapter.db
    .prepare('SELECT COUNT(*) AS total FROM word_learning_state')
    .get() as { total: number };
  const session = adapter.db
    .prepare('SELECT word_count, wrong_count FROM study_sessions LIMIT 1')
    .get() as { word_count: number; wrong_count: number };

  assert.equal(result.wrongWordCount, 2);
  assert.deepEqual(
    wrongRows.map((row) => ({ ...row })),
    [
      { sources: 'fill,listening', word_id: 1, wrong_count: 1 },
      { sources: 'listening', word_id: 2, wrong_count: 1 },
    ],
  );
  assert.deepEqual(
    statusRows.map((row) => ({ ...row })),
    [
      { id: 1, learning_status: 'wrong' },
      { id: 2, learning_status: 'wrong' },
    ],
  );
  assert.equal(learningCount.total, 2);
  assert.deepEqual({ ...session }, { word_count: 2, wrong_count: 2 });
});

test('applies wrong-review removal only when the task is finalized', async () => {
  const adapter = await createMigratedAdapter();
  const db = asDatabase(adapter);
  const now = '2026-10-19T10:00:00.000Z';

  for (const [id, word] of [
    [1, 'abandon'],
    [2, 'brief'],
  ] as const) {
    await db.runAsync(
      `INSERT INTO words (
         id, word, meaning, phonetic, created_at, updated_at,
         is_active, learning_status, example_sentence,
         example_source, example_generated_at
       ) VALUES (
         $id, $word, $meaning, '', $now, $now,
         1, 'wrong', '', '', NULL
       )`,
      {
        $id: id,
        $meaning: word,
        $now: now,
        $word: word,
      },
    );
    await db.runAsync(
      `INSERT INTO wrong_book_words (
         word_id, added_at, last_wrong_at, wrong_count, sources
       ) VALUES ($id, $now, $now, 1, 'fill')`,
      { $id: id, $now: now },
    );
  }

  await completeTaskSession(db, {
    autoRemoveCorrectWrongReview: true,
    completedAt: new Date(now),
    fillMistakeWordIds: [1],
    listeningMistakeWordIds: [],
    mode: 'wrongReview',
    wordIds: [1, 2],
  });

  const wrongRows = adapter.db
    .prepare(
      `SELECT word_id, wrong_count
       FROM wrong_book_words
       ORDER BY word_id`,
    )
    .all() as { word_id: number; wrong_count: number }[];
  const statusRows = adapter.db
    .prepare('SELECT id, learning_status FROM words ORDER BY id')
    .all() as { id: number; learning_status: string }[];

  assert.deepEqual(
    wrongRows.map((row) => ({ ...row })),
    [{ word_id: 1, wrong_count: 2 }],
  );
  assert.deepEqual(
    statusRows.map((row) => ({ ...row })),
    [
      { id: 1, learning_status: 'wrong' },
      { id: 2, learning_status: 'learned' },
    ],
  );
});

test('creates the v18 query indexes', async () => {
  const adapter = await createMigratedAdapter();
  const indexNames = (table: string) =>
    (
      adapter.db.prepare(`PRAGMA index_list(${table})`).all() as {
        name: string;
      }[]
    ).map((row) => row.name);

  assert.ok(indexNames('words').includes('idx_words_active_status_word'));
  assert.ok(
    indexNames('word_learning_state').includes('idx_learning_last_learned'),
  );
  assert.ok(indexNames('wrong_book_words').includes('idx_wrong_last_wrong'));
  assert.ok(indexNames('study_sessions').includes('idx_sessions_study_date'));
});

test('loads daily task words through the TaskWord mapper', async () => {
  const adapter = await createMigratedAdapter();
  await insertTestWord(adapter, {
    exampleSentence: 'Alpha appears here.',
    id: 1,
    word: 'alpha',
  });
  await insertTestWord(adapter, { id: 2, word: 'beta' });
  await insertTestWord(adapter, {
    id: 3,
    learningStatus: 'learned',
    word: 'gamma',
  });

  const selection = await loadDailyTaskSelection(asDatabase(adapter));

  assert.deepEqual(
    selection.words.map((word) => word.word),
    ['alpha', 'beta'],
  );
  assert.equal(selection.words[0]?.exampleSentence, 'Alpha appears here.');
});

test('loads wrong-review words through the application use case', async () => {
  const adapter = await createMigratedAdapter();
  const now = '2026-10-19T10:00:00.000Z';

  await insertTestWord(adapter, {
    id: 1,
    learningStatus: 'wrong',
    word: 'alpha',
  });
  await insertTestWord(adapter, {
    id: 2,
    learningStatus: 'wrong',
    word: 'beta',
  });

  for (const id of [1, 2]) {
    await adapter.runAsync(
      `INSERT INTO wrong_book_words (
         word_id, added_at, last_wrong_at, wrong_count, sources
       ) VALUES ($id, $now, $now, 1, 'fill')`,
      { $id: id, $now: now },
    );
  }

  const selection = await loadWrongReviewSelection(asDatabase(adapter));
  assert.deepEqual(
    selection.words.map((word) => word.word),
    ['alpha', 'beta'],
  );
});

test('loads the configured number of word-review words', async () => {
  const adapter = await createMigratedAdapter();
  const now = '2026-10-19T10:00:00.000Z';

  for (const [id, word] of [
    [1, 'alpha'],
    [2, 'beta'],
  ] as const) {
    await insertTestWord(adapter, {
      id,
      learningStatus: 'learned',
      word,
    });
    await adapter.runAsync(
      `INSERT INTO word_learning_state (
         word_id, first_learned_at, last_learned_at, learned_count
       ) VALUES ($id, $now, $now, 1)`,
      { $id: id, $now: now },
    );
  }

  await adapter.runAsync(
    'UPDATE review_settings SET word_review_word_limit = 1 WHERE id = 1',
  );
  const selection = await loadWordReviewSelection(asDatabase(adapter), null);

  assert.equal(selection.settings.wordReviewWordLimit, 1);
  assert.equal(selection.words.length, 1);
});
