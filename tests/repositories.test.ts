import assert from 'node:assert/strict';
import test from 'node:test';

import type { SQLiteDatabase } from 'expo-sqlite';

import {
  getAiOverwriteExamples,
  setAiOverwriteExamples,
} from '../src/database/aiRepository';
import { pickRandomReviewWords } from '../src/database/reviewRepository';
import {
  getHomeStats,
  getLastReviewPromptStudyDay,
  markReviewPrompted,
} from '../src/database/statsRepository';
import { formatStudyDate } from '../src/utils/date';
import {
  asDatabase,
  createMigratedAdapter,
  insertTestWord,
  TEST_NOW,
} from './helpers/nodeSqlite';

function dayOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatStudyDate(date);
}

test('returns zeroed home stats for a fresh database', async () => {
  const adapter = await createMigratedAdapter();

  assert.deepEqual(await getHomeStats(asDatabase(adapter)), {
    checkinCount: 0,
    studyDays: 0,
    todayLearned: 0,
    totalLearned: 0,
    wrongBookCount: 0,
  });
});

test('aggregates home stats across sessions, learning state and wrong book', async () => {
  const adapter = await createMigratedAdapter();
  const db = asDatabase(adapter);

  await insertTestWord(adapter, { id: 1, word: 'alpha' });
  await insertTestWord(adapter, { id: 2, word: 'beta' });
  await insertTestWord(adapter, { id: 3, word: 'gamma' });
  for (const id of [1, 2]) {
    await adapter.runAsync(
      `INSERT INTO word_learning_state (
         word_id, first_learned_at, last_learned_at
       ) VALUES ($id, $now, $now)`,
      { $id: id, $now: TEST_NOW },
    );
  }
  await adapter.runAsync(
    `INSERT INTO wrong_book_words (
       word_id, added_at, last_wrong_at, wrong_count
     ) VALUES (3, $now, $now, 2)`,
    { $now: TEST_NOW },
  );

  const today = dayOffset(0);
  const yesterday = dayOffset(-1);
  for (const [wordCount, wrongCount, date] of [
    [3, 1, today],
    [2, 0, today],
    [4, 2, yesterday],
  ] as const) {
    await adapter.runAsync(
      `INSERT INTO study_sessions (
         completed_at, study_date, word_count, wrong_count
       ) VALUES ($now, $date, $wordCount, $wrongCount)`,
      {
        $date: date,
        $now: TEST_NOW,
        $wordCount: wordCount,
        $wrongCount: wrongCount,
      },
    );
  }

  const stats = await getHomeStats(db);

  assert.deepEqual(stats, {
    checkinCount: 3,
    studyDays: 2,
    todayLearned: 5,
    totalLearned: 2,
    wrongBookCount: 1,
  });
});

test('counts only the current study date as today', async () => {
  const adapter = await createMigratedAdapter();
  const yesterday = dayOffset(-1);

  await adapter.runAsync(
    `INSERT INTO study_sessions (
       completed_at, study_date, word_count, wrong_count
     ) VALUES ($now, $date, 7, 0)`,
    { $date: yesterday, $now: TEST_NOW },
  );

  const stats = await getHomeStats(asDatabase(adapter));

  assert.equal(stats.todayLearned, 0);
  assert.equal(stats.studyDays, 1);
});

test('falls back to zero when the aggregate queries return no rows', async () => {
  const db = {
    getFirstAsync: async () => null,
  } as unknown as SQLiteDatabase;

  assert.deepEqual(await getHomeStats(db), {
    checkinCount: 0,
    studyDays: 0,
    todayLearned: 0,
    totalLearned: 0,
    wrongBookCount: 0,
  });
  assert.equal(await getLastReviewPromptStudyDay(db), 0);
});

test('reads the review prompt study day as zero by default', async () => {
  const adapter = await createMigratedAdapter();

  assert.equal(await getLastReviewPromptStudyDay(asDatabase(adapter)), 0);
});

test('only advances the review prompt study day', async () => {
  const adapter = await createMigratedAdapter();
  const db = asDatabase(adapter);

  await markReviewPrompted(db, 5);
  assert.equal(await getLastReviewPromptStudyDay(db), 5);

  await markReviewPrompted(db, 3);
  assert.equal(await getLastReviewPromptStudyDay(db), 5);

  await markReviewPrompted(db, 8);
  assert.equal(await getLastReviewPromptStudyDay(db), 8);
});

test('recreates missing settings rows before marking the prompt', async () => {
  const adapter = await createMigratedAdapter();
  adapter.db.exec('DELETE FROM review_settings');

  await markReviewPrompted(asDatabase(adapter), 4);

  assert.equal(await getLastReviewPromptStudyDay(asDatabase(adapter)), 4);
  const count = adapter.db
    .prepare('SELECT COUNT(*) AS total FROM review_settings')
    .get() as { total: number };
  assert.equal(count.total, 1);
});

test('defaults the AI overwrite flag to false', async () => {
  const adapter = await createMigratedAdapter();

  assert.equal(await getAiOverwriteExamples(asDatabase(adapter)), false);
});

test('persists the AI overwrite flag in both directions', async () => {
  const adapter = await createMigratedAdapter();
  const db = asDatabase(adapter);

  await setAiOverwriteExamples(db, true);
  assert.equal(await getAiOverwriteExamples(db), true);

  await setAiOverwriteExamples(db, false);
  assert.equal(await getAiOverwriteExamples(db), false);

  const rows = adapter.db
    .prepare('SELECT ai_overwrite_examples AS value FROM ai_settings')
    .all() as { value: number }[];
  assert.deepEqual(
    rows.map((row) => row.value),
    [0],
  );
});

test('recreates ai settings before saving the overwrite flag', async () => {
  const adapter = await createMigratedAdapter();
  adapter.db.exec('DELETE FROM ai_settings');

  await setAiOverwriteExamples(asDatabase(adapter), true);

  assert.equal(await getAiOverwriteExamples(asDatabase(adapter)), true);
  const count = adapter.db
    .prepare('SELECT COUNT(*) AS total FROM ai_settings')
    .get() as { total: number };
  assert.equal(count.total, 1);
});

test('picks learned active words for review regardless of age', async () => {
  const adapter = await createMigratedAdapter();
  const db = asDatabase(adapter);

  await insertTestWord(adapter, {
    id: 1,
    learningStatus: 'learned',
    word: 'alpha',
  });
  await insertTestWord(adapter, {
    id: 2,
    learningStatus: 'learned',
    word: 'beta',
  });
  await insertTestWord(adapter, {
    id: 3,
    learningStatus: 'wrong',
    word: 'gone',
  });
  await insertTestWord(adapter, {
    id: 4,
    isActive: false,
    learningStatus: 'learned',
    word: 'hidden',
  });

  for (const [id, lastLearnedAt] of [
    [1, '2026-01-01T00:00:00.000Z'],
    [2, '2026-01-02T00:00:00.000Z'],
    [3, '2026-01-03T00:00:00.000Z'],
    [4, '2026-01-04T00:00:00.000Z'],
  ] as const) {
    await adapter.runAsync(
      `INSERT INTO word_learning_state (
         word_id, first_learned_at, last_learned_at
       ) VALUES ($id, $lastLearnedAt, $lastLearnedAt)`,
      { $id: id, $lastLearnedAt: lastLearnedAt },
    );
  }

  const words = await pickRandomReviewWords(db, null, 10);

  assert.deepEqual(words.map((word) => word.word).sort(), ['alpha', 'beta']);
  assert.equal(words[0]?.meaning, words[0]?.word);
});

test('limits review words by the recency cutoff and the row limit', async () => {
  const adapter = await createMigratedAdapter();
  const db = asDatabase(adapter);

  for (const id of [1, 2]) {
    await insertTestWord(adapter, {
      id,
      learningStatus: 'learned',
      word: `word-${id}`,
    });
  }
  await adapter.runAsync(
    `INSERT INTO word_learning_state (
       word_id, first_learned_at, last_learned_at
     ) VALUES (1, $old, $old)`,
    { $old: '2020-01-01T00:00:00.000Z' },
  );
  await adapter.runAsync(
    `INSERT INTO word_learning_state (
       word_id, first_learned_at, last_learned_at
     ) VALUES (2, $recent, $recent)`,
    { $recent: new Date().toISOString() },
  );

  const recent = await pickRandomReviewWords(db, 7, 10);
  assert.deepEqual(
    recent.map((word) => word.word),
    ['word-2'],
  );

  const limited = await pickRandomReviewWords(db, null, 1);
  assert.equal(limited.length, 1);
});
