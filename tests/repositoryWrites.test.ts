import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DAILY_WORD_LIMIT_MAX,
  DAILY_WORD_LIMIT_MIN,
  DEFAULT_DAILY_TASK_SETTINGS,
  getDailyTaskSettings,
  normalizeDailyWordLimit,
  normalizeListeningRate,
  normalizeListeningWordInterval,
  normalizeReviewReminderInterval,
  normalizeReviewWordLimit,
  saveDailyTaskSettings,
  type DailyTaskSettings,
} from '../src/database/settingsRepository';
import {
  getUserProfile,
  updateUserProfile,
} from '../src/database/userProfileRepository';
import {
  addWrongBookWord,
  addWrongBookWords,
  countWrongBookWords,
  listWrongBookWords,
  listWrongReviewWords,
  recordWrongWords,
  recordWrongWordsInTransaction,
  resolveWrongBookRemoval,
  setWordsLearningStatus,
} from '../src/database/wrongBookRepository';
import {
  deactivateAllWords,
  deactivateWords,
  findWordByWord,
  getActiveWordCount,
  listActiveWords,
  listUnlearnedActiveWords,
  upsertSingleWord,
  upsertWords,
} from '../src/database/wordsRepository';
import {
  asDatabase,
  createMigratedAdapter,
  insertTestWord,
  insertWrongBookEntry,
  NodeSqliteAdapter,
  TEST_NOW,
} from './helpers/nodeSqlite';

async function seedWords(adapter: NodeSqliteAdapter): Promise<void> {
  await insertTestWord(adapter, { id: 1, word: 'Alpha' });
  await insertTestWord(adapter, {
    exampleSentence: 'Beta already exists.',
    id: 2,
    phonetic: '/b/',
    word: 'beta',
  });
  await insertTestWord(adapter, { id: 3, isActive: false, word: 'gamma' });
}

test('counts only active words', async () => {
  const adapter = await createMigratedAdapter();
  await seedWords(adapter);

  assert.equal(await getActiveWordCount(asDatabase(adapter)), 2);
});

test('lists active words with case-insensitive paging', async () => {
  const adapter = await createMigratedAdapter();
  await seedWords(adapter);

  const firstPage = await listActiveWords(asDatabase(adapter), 1, 0);
  const secondPage = await listActiveWords(asDatabase(adapter), 1, 1);

  assert.deepEqual(
    firstPage.map((word) => word.word),
    ['Alpha'],
  );
  assert.deepEqual(
    secondPage.map((word) => word.word),
    ['beta'],
  );
});

test('finds a word regardless of casing', async () => {
  const adapter = await createMigratedAdapter();
  await seedWords(adapter);

  const found = await findWordByWord(asDatabase(adapter), 'ALPHA');
  const missing = await findWordByWord(asDatabase(adapter), 'delta');

  assert.equal(found?.id, 1);
  assert.equal(missing, null);
});

test('lists unlearned words in both orders', async () => {
  const adapter = await createMigratedAdapter();
  await insertTestWord(adapter, { id: 1, word: 'beta' });
  await insertTestWord(adapter, { id: 2, word: 'alpha' });
  await insertTestWord(adapter, {
    id: 3,
    learningStatus: 'learned',
    word: 'gamma',
  });

  const ordered = await listUnlearnedActiveWords(asDatabase(adapter), 10);
  const randomized = await listUnlearnedActiveWords(
    asDatabase(adapter),
    10,
    true,
  );

  assert.deepEqual(
    ordered.map((word) => word.word),
    ['alpha', 'beta'],
  );
  assert.deepEqual(randomized.map((word) => word.word).sort(), [
    'alpha',
    'beta',
  ]);
});

test('soft-deletes every active word and reports the count', async () => {
  const adapter = await createMigratedAdapter();
  await seedWords(adapter);

  const cleared = await deactivateAllWords(asDatabase(adapter));

  assert.equal(cleared, 2);
  assert.equal(await getActiveWordCount(asDatabase(adapter)), 0);
});

test('does nothing when every word is already soft-deleted', async () => {
  const adapter = await createMigratedAdapter();
  await insertTestWord(adapter, { id: 1, isActive: false, word: 'alpha' });

  assert.equal(await deactivateAllWords(asDatabase(adapter)), 0);
});

test('soft-deletes only the given words without duplicates', async () => {
  const adapter = await createMigratedAdapter();
  await seedWords(adapter);

  await deactivateWords(asDatabase(adapter), [1, 1]);
  await deactivateWords(asDatabase(adapter), []);

  assert.equal(await getActiveWordCount(asDatabase(adapter)), 1);
  const rows = adapter.db
    .prepare('SELECT word, is_active FROM words ORDER BY id')
    .all() as { is_active: number; word: string }[];
  assert.deepEqual(
    rows.map((row) => ({ ...row })),
    [
      { is_active: 0, word: 'Alpha' },
      { is_active: 1, word: 'beta' },
      { is_active: 0, word: 'gamma' },
    ],
  );
});

test('upserts a single word and returns its id', async () => {
  const adapter = await createMigratedAdapter();
  const db = asDatabase(adapter);

  const first = await upsertSingleWord(db, {
    meaning: '阿尔法',
    phonetic: '/a/',
    word: 'alpha',
  });
  const second = await upsertSingleWord(db, {
    meaning: '阿尔法二号',
    phonetic: '/a2/',
    word: 'alpha',
  });

  assert.equal(first, second);
  const rows = adapter.db
    .prepare('SELECT meaning, phonetic FROM words')
    .all() as { meaning: string; phonetic: string }[];
  assert.deepEqual(
    rows.map((row) => ({ ...row })),
    [{ meaning: '阿尔法二号', phonetic: '/a2/' }],
  );
});

test('restores a soft-deleted word on re-import', async () => {
  const adapter = await createMigratedAdapter();
  const db = asDatabase(adapter);
  await insertTestWord(adapter, { id: 5, isActive: false, word: 'alpha' });

  const id = await upsertSingleWord(db, {
    meaning: '阿尔法',
    phonetic: '/a/',
    word: 'ALPHA',
  });

  assert.equal(id, 5);
  assert.equal(await getActiveWordCount(db), 1);
});

test('records CSV provenance only when the row carries an example', async () => {
  const adapter = await createMigratedAdapter();

  const result = await upsertWords(asDatabase(adapter), [
    {
      example_sentence: 'Alpha runs.',
      meaning: '阿尔法',
      phonetic: '/a/',
      word: 'alpha',
    },
    { meaning: '贝塔', phonetic: '/b/', word: 'beta' },
  ]);

  assert.deepEqual(result, { inserted: 2, updated: 0 });
  const rows = adapter.db
    .prepare(
      `SELECT word, example_source, example_generated_at
       FROM words
       ORDER BY word`,
    )
    .all() as {
    example_generated_at: string | null;
    example_source: string;
    word: string;
  }[];
  assert.deepEqual(
    rows.map((row) => ({
      example_source: row.example_source,
      has_generated_at: row.example_generated_at !== null,
      word: row.word,
    })),
    [
      { example_source: 'csv', has_generated_at: true, word: 'alpha' },
      { example_source: '', has_generated_at: false, word: 'beta' },
    ],
  );
});

test('fills profile defaults when the row is missing', async () => {
  const adapter = await createMigratedAdapter();
  adapter.db.exec('DELETE FROM user_profile');

  const profile = await getUserProfile(asDatabase(adapter));

  assert.deepEqual(profile, {
    avatarData: '',
    backgroundData: '',
    bio: '',
    cardContentColor: '#FFFFFF',
    displayName: 'User',
    textStrokeColor: '#000000',
    textStrokeWidth: 2,
    updatedAt: new Date(0).toISOString(),
  });
});

test('clamps stored profile values that are out of range', async () => {
  const adapter = await createMigratedAdapter();
  adapter.db.exec(`
    UPDATE user_profile
    SET display_name = '名字名字名字名字名字名字名字名字名字名字名字名字',
        text_stroke_width = 99
    WHERE id = 1;
  `);

  const profile = await getUserProfile(asDatabase(adapter));

  assert.equal(profile.displayName.length, 10);
  assert.equal(profile.textStrokeWidth, 5);
});

test('trims and clamps profile values on save', async () => {
  const adapter = await createMigratedAdapter();
  const db = asDatabase(adapter);

  await updateUserProfile(db, {
    avatarData: '',
    backgroundData: '',
    bio: '  hello  ',
    cardContentColor: '',
    displayName: '  Tester  ',
    textStrokeColor: '',
    textStrokeWidth: -5,
  });

  const profile = await getUserProfile(db);

  assert.equal(profile.bio, 'hello');
  assert.equal(profile.displayName, 'Tester');
  assert.equal(profile.cardContentColor, '#FFFFFF');
  assert.equal(profile.textStrokeColor, '#000000');
  assert.equal(profile.textStrokeWidth, 0);
});

test('updates an existing profile row instead of inserting another', async () => {
  const adapter = await createMigratedAdapter();

  await updateUserProfile(asDatabase(adapter), {
    avatarData: 'data:image/png;base64,aaa',
    backgroundData: '',
    bio: 'first',
    cardContentColor: '#111111',
    displayName: 'First',
    textStrokeColor: '#222222',
    textStrokeWidth: 3,
  });
  await updateUserProfile(asDatabase(adapter), {
    avatarData: 'data:image/png;base64,bbb',
    backgroundData: '',
    bio: 'second',
    cardContentColor: '#333333',
    displayName: 'Second',
    textStrokeColor: '#444444',
    textStrokeWidth: 9,
  });

  const rows = adapter.db
    .prepare('SELECT COUNT(*) AS total FROM user_profile')
    .get() as { total: number };
  const profile = await getUserProfile(asDatabase(adapter));

  assert.equal(rows.total, 1);
  assert.equal(profile.displayName, 'Second');
  assert.equal(profile.textStrokeWidth, 5);
});

test('normalizes the daily word limit to the allowed range', () => {
  assert.equal(normalizeDailyWordLimit(Number.NaN), 10);
  assert.equal(normalizeDailyWordLimit(1), DAILY_WORD_LIMIT_MIN);
  assert.equal(normalizeDailyWordLimit(999), DAILY_WORD_LIMIT_MAX);
  assert.equal(normalizeDailyWordLimit(7.4), 7);
});

test('snaps the listening rate to a configured value', () => {
  assert.equal(normalizeListeningRate(Number.NaN), 1);
  assert.equal(normalizeListeningRate(0.6), 0.5);
  assert.equal(normalizeListeningRate(1.4), 1.5);
  assert.equal(normalizeListeningRate(99), 2);
});

test('normalizes the listening interval to a tenth of a second', () => {
  assert.equal(normalizeListeningWordInterval(Number.NaN), 5);
  assert.equal(normalizeListeningWordInterval(0), 1);
  assert.equal(normalizeListeningWordInterval(42), 10);
  assert.equal(normalizeListeningWordInterval(3.44), 3.4);
});

test('normalizes reminder intervals and review limits', () => {
  assert.equal(normalizeReviewReminderInterval(Number.NaN), 3);
  assert.equal(normalizeReviewReminderInterval(0), 1);
  assert.equal(normalizeReviewReminderInterval(99), 30);
  assert.equal(normalizeReviewReminderInterval(4.6), 5);

  assert.equal(normalizeReviewWordLimit(Number.NaN), 10);
  assert.equal(normalizeReviewWordLimit(0), 1);
  assert.equal(normalizeReviewWordLimit(999), 100);
});

test('round-trips daily task settings through normalization', async () => {
  const adapter = await createMigratedAdapter();
  const db = asDatabase(adapter);

  await saveDailyTaskSettings(db, {
    advanceOnMistakes: false,
    autoRemoveCorrectWrongReview: true,
    dailyWordLimit: 999,
    listeningDefaultRate: 1.4,
    listeningWordIntervalSeconds: 42,
    randomWordSelection: true,
    reviewReminderEnabled: false,
    reviewReminderIntervalDays: 99,
    wrongReviewRandom: true,
    wrongReviewWordLimit: 0,
    wordReviewWordLimit: 999,
  });

  const settings = await getDailyTaskSettings(db);

  assert.deepEqual(settings, {
    advanceOnMistakes: false,
    autoRemoveCorrectWrongReview: true,
    dailyWordLimit: DAILY_WORD_LIMIT_MAX,
    listeningDefaultRate: 1.5,
    listeningWordIntervalSeconds: 10,
    randomWordSelection: true,
    reviewReminderEnabled: false,
    reviewReminderIntervalDays: 30,
    wrongReviewRandom: true,
    wrongReviewWordLimit: 1,
    wordReviewWordLimit: 100,
  });
});

test('falls back to defaults when only one settings table survives', async () => {
  const adapter = await createMigratedAdapter();
  const db = asDatabase(adapter);
  adapter.db.exec('DELETE FROM task_settings');

  const withoutTask = await getDailyTaskSettings(db);
  assert.equal(
    withoutTask.dailyWordLimit,
    DEFAULT_DAILY_TASK_SETTINGS.dailyWordLimit,
  );
  assert.equal(
    withoutTask.wordReviewWordLimit,
    DEFAULT_DAILY_TASK_SETTINGS.wordReviewWordLimit,
  );

  adapter.db.exec(`
    DELETE FROM review_settings;
    INSERT INTO task_settings (id, daily_word_limit) VALUES (1, 12);
  `);
  const withoutReview = await getDailyTaskSettings(db);
  assert.equal(withoutReview.dailyWordLimit, 12);
  assert.equal(
    withoutReview.wrongReviewWordLimit,
    DEFAULT_DAILY_TASK_SETTINGS.wrongReviewWordLimit,
  );
});

test('saves settings that only differ in the review table', async () => {
  const adapter = await createMigratedAdapter();
  const db = asDatabase(adapter);
  const base: DailyTaskSettings = { ...DEFAULT_DAILY_TASK_SETTINGS };

  await saveDailyTaskSettings(db, { ...base, reviewReminderEnabled: false });
  await saveDailyTaskSettings(db, { ...base, reviewReminderEnabled: true });

  const rows = adapter.db
    .prepare('SELECT COUNT(*) AS total FROM review_settings')
    .get() as { total: number };
  const settings = await getDailyTaskSettings(db);

  assert.equal(rows.total, 1);
  assert.equal(settings.reviewReminderEnabled, true);
});

test('records new wrong words and increments existing counts', async () => {
  const adapter = await createMigratedAdapter();
  const db = asDatabase(adapter);
  await insertTestWord(adapter, { id: 1, word: 'alpha' });
  await insertTestWord(adapter, { id: 2, word: 'beta' });
  await insertWrongBookEntry(adapter, 2, ['manual'], 3);

  await recordWrongWords(db, [1, 1, 2], 'fill');

  const rows = adapter.db
    .prepare(
      `SELECT word_id, wrong_count
       FROM wrong_book_words
       ORDER BY word_id`,
    )
    .all() as { word_id: number; wrong_count: number }[];
  const statuses = adapter.db
    .prepare('SELECT learning_status FROM words ORDER BY id')
    .all() as { learning_status: string }[];

  assert.deepEqual(
    rows.map((row) => ({ ...row })),
    [
      { word_id: 1, wrong_count: 1 },
      { word_id: 2, wrong_count: 4 },
    ],
  );
  assert.deepEqual(
    statuses.map((row) => row.learning_status),
    ['wrong', 'wrong'],
  );
});

test('ignores an empty wrong-word batch', async () => {
  const adapter = await createMigratedAdapter();

  await recordWrongWords(asDatabase(adapter), [], 'fill');

  assert.equal(await countWrongBookWords(asDatabase(adapter)), 0);
});

test('adds manual wrong-book words without counting a mistake', async () => {
  const adapter = await createMigratedAdapter();
  const db = asDatabase(adapter);
  await insertTestWord(adapter, {
    id: 1,
    word: 'alpha',
    learningStatus: 'wrong',
  });
  await insertTestWord(adapter, {
    id: 2,
    word: 'beta',
    learningStatus: 'wrong',
  });
  await insertWrongBookEntry(adapter, 1, ['fill'], 2);

  await addWrongBookWord(db, 1);
  await addWrongBookWords(db, [2, 2, 1], 'manual');

  const rows = adapter.db
    .prepare(
      `SELECT wrong_book_words.word_id,
              wrong_book_words.wrong_count,
              GROUP_CONCAT(wrong_book_sources.source, ',') AS sources
       FROM wrong_book_words
       JOIN wrong_book_sources
         ON wrong_book_sources.word_id = wrong_book_words.word_id
       GROUP BY wrong_book_words.word_id
       ORDER BY wrong_book_words.word_id`,
    )
    .all() as { sources: string; word_id: number; wrong_count: number }[];

  assert.deepEqual(
    rows.map((row) => ({ ...row })),
    [
      { sources: 'fill,manual', word_id: 1, wrong_count: 2 },
      { sources: 'manual', word_id: 2, wrong_count: 0 },
    ],
  );
});

test('records wrong words inside an existing transaction', async () => {
  const adapter = await createMigratedAdapter();
  const db = asDatabase(adapter);
  await insertTestWord(adapter, { id: 1, word: 'alpha' });

  await db.withTransactionAsync(async () => {
    await recordWrongWordsInTransaction(
      db,
      new Map([[1, ['fill', 'listening'] as const]]),
      TEST_NOW,
    );
  });

  const entry = await listWrongBookWords(db, 10, 0);
  assert.deepEqual(entry[0]?.sources, ['fill', 'listening']);
  assert.equal(entry[0]?.wrong_count, 1);
});

test('lists wrong-book entries with ordered sources and recency', async () => {
  const adapter = await createMigratedAdapter();
  const db = asDatabase(adapter);
  await insertTestWord(adapter, { id: 1, word: 'alpha' });
  await insertTestWord(adapter, { id: 2, word: 'beta' });
  await insertWrongBookEntry(adapter, 1, ['manual', 'fill'], 2, TEST_NOW);
  await insertWrongBookEntry(adapter, 2, [], 1, '2026-10-20T10:00:00.000Z');
  await adapter.runAsync(
    `UPDATE wrong_book_words SET last_wrong_at = $now WHERE word_id = 2`,
    { $now: '2026-10-21T10:00:00.000Z' },
  );

  const entries = await listWrongBookWords(db, 10, 0);
  const page = await listWrongBookWords(db, 1, 1);

  assert.deepEqual(
    entries.map((entry) => ({ sources: entry.sources, word: entry.word })),
    [
      { sources: [], word: 'beta' },
      { sources: ['fill', 'manual'], word: 'alpha' },
    ],
  );
  assert.deepEqual(
    page.map((entry) => entry.word),
    ['alpha'],
  );
});

test('lists wrong-review words in both orders', async () => {
  const adapter = await createMigratedAdapter();
  const db = asDatabase(adapter);
  await insertTestWord(adapter, {
    id: 1,
    word: 'alpha',
    learningStatus: 'wrong',
  });
  await insertTestWord(adapter, {
    id: 2,
    word: 'beta',
    learningStatus: 'wrong',
  });
  await insertWrongBookEntry(adapter, 1, ['fill'], 1, TEST_NOW);
  await insertWrongBookEntry(
    adapter,
    2,
    ['fill'],
    1,
    '2026-10-18T10:00:00.000Z',
  );

  const ordered = await listWrongReviewWords(db, 10, false);
  const randomized = await listWrongReviewWords(db, 10, true);

  assert.deepEqual(
    ordered.map((word) => word.word),
    ['alpha', 'beta'],
  );
  assert.deepEqual(randomized.map((word) => word.word).sort(), [
    'alpha',
    'beta',
  ]);
});

test('removes a corrected wrong word and marks it learned', async () => {
  const adapter = await createMigratedAdapter();
  const db = asDatabase(adapter);
  await insertTestWord(adapter, {
    id: 1,
    word: 'alpha',
    learningStatus: 'wrong',
  });
  await insertWrongBookEntry(adapter, 1, ['fill'], 2);

  await resolveWrongBookRemoval(db, [1], 'learned');

  assert.equal(await countWrongBookWords(db), 0);
  const sources = adapter.db
    .prepare('SELECT COUNT(*) AS total FROM wrong_book_sources')
    .get() as { total: number };
  const word = adapter.db
    .prepare('SELECT learning_status FROM words WHERE id = 1')
    .get() as { learning_status: string };
  const state = adapter.db
    .prepare('SELECT COUNT(*) AS total FROM word_learning_state')
    .get() as { total: number };

  assert.equal(sources.total, 0);
  assert.equal(word.learning_status, 'learned');
  assert.equal(state.total, 1);
});

test('keeps the first learn date when a word is relearned', async () => {
  const adapter = await createMigratedAdapter();
  const db = asDatabase(adapter);
  await insertTestWord(adapter, {
    id: 1,
    word: 'alpha',
    learningStatus: 'wrong',
  });
  await insertWrongBookEntry(adapter, 1, ['fill'], 1);
  await adapter.runAsync(
    `INSERT INTO word_learning_state (
       word_id, first_learned_at, last_learned_at
     ) VALUES (1, $first, $first)`,
    { $first: '2026-01-01T00:00:00.000Z' },
  );

  await resolveWrongBookRemoval(db, [1], 'learned');

  const state = adapter.db
    .prepare(
      'SELECT first_learned_at FROM word_learning_state WHERE word_id = 1',
    )
    .get() as { first_learned_at: string };
  assert.equal(state.first_learned_at, '2026-01-01T00:00:00.000Z');
});

test('marks words as unlearned and can push them back to the wrong book', async () => {
  const adapter = await createMigratedAdapter();
  const db = asDatabase(adapter);
  await insertTestWord(adapter, {
    id: 1,
    word: 'alpha',
    learningStatus: 'learned',
  });
  await insertTestWord(adapter, { id: 2, word: 'beta' });
  await insertWrongBookEntry(adapter, 1, ['fill'], 1);

  await setWordsLearningStatus(db, [1, 1], 'unlearned');
  await setWordsLearningStatus(db, [2], 'wrong');
  await setWordsLearningStatus(db, [], 'learned');

  const statuses = adapter.db
    .prepare('SELECT learning_status FROM words ORDER BY id')
    .all() as { learning_status: string }[];
  const entries = await listWrongBookWords(db, 10, 0);

  assert.deepEqual(
    statuses.map((row) => row.learning_status),
    ['unlearned', 'wrong'],
  );
  assert.deepEqual(
    entries.map((entry) => ({ sources: entry.sources, word: entry.word })),
    [{ sources: ['manual'], word: 'beta' }],
  );
});
