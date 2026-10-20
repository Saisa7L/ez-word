import type { SQLiteDatabase } from 'expo-sqlite';

import type { TaskWord } from '@/domain/word/taskWord';

import { mapTaskWordRow, type TaskWordRow } from './taskWordMapper';
import type { WordRecord } from './wordsRepository';
import { selectTaskWordColumns, selectWordColumns } from './sqlFragments';

export type WrongBookSource = 'fill' | 'listening' | 'manual';

export type WrongBookEntry = WordRecord & {
  added_at: string;
  last_wrong_at: string;
  sources: WrongBookSource[];
  wrong_count: number;
};

type WrongBookEntryRow = Omit<WrongBookEntry, 'sources'> & {
  sources: string;
};

const SOURCE_ORDER: readonly WrongBookSource[] = [
  'fill',
  'listening',
  'manual',
];

function parseSources(value: string): WrongBookSource[] {
  const sources = new Set(value.split(',').filter(Boolean));
  return SOURCE_ORDER.filter((source) => sources.has(source));
}

async function addWrongBookSources(
  db: SQLiteDatabase,
  wordId: number,
  sources: readonly WrongBookSource[],
): Promise<void> {
  for (const source of new Set(sources)) {
    await db.runAsync(
      `INSERT OR IGNORE INTO wrong_book_sources (word_id, source)
       VALUES ($wordId, $source)`,
      {
        $source: source,
        $wordId: wordId,
      },
    );
  }
}

async function saveWrongBookEntry(
  db: SQLiteDatabase,
  wordId: number,
  addedSources: readonly WrongBookSource[],
  now: string,
  countAsMistake: boolean,
): Promise<void> {
  if (countAsMistake) {
    await db.runAsync(
      `INSERT INTO wrong_book_words (
         word_id,
         added_at,
         last_wrong_at,
         wrong_count
       )
       VALUES ($wordId, $now, $now, 1)
       ON CONFLICT(word_id) DO UPDATE SET
         last_wrong_at = excluded.last_wrong_at,
         wrong_count = wrong_book_words.wrong_count + 1`,
      {
        $now: now,
        $wordId: wordId,
      },
    );
  } else {
    await db.runAsync(
      `INSERT INTO wrong_book_words (
         word_id,
         added_at,
         last_wrong_at,
         wrong_count
       )
       VALUES ($wordId, $now, $now, 0)
       ON CONFLICT(word_id) DO NOTHING`,
      {
        $now: now,
        $wordId: wordId,
      },
    );
  }

  await addWrongBookSources(db, wordId, addedSources);
}

async function saveWrongBookEntries(
  db: SQLiteDatabase,
  wordIds: number[],
  source: WrongBookSource,
  countAsMistake: boolean,
): Promise<void> {
  const uniqueWordIds = [...new Set(wordIds)];
  if (uniqueWordIds.length === 0) {
    return;
  }

  const now = new Date().toISOString();
  await db.withExclusiveTransactionAsync(async (transaction) => {
    for (const wordId of uniqueWordIds) {
      await saveWrongBookEntry(
        transaction,
        wordId,
        [source],
        now,
        countAsMistake,
      );
      await transaction.runAsync(
        `UPDATE words
         SET learning_status = 'wrong'
         WHERE id = $wordId`,
        { $wordId: wordId },
      );
    }
  });
}

export async function recordWrongWordsInTransaction(
  db: SQLiteDatabase,
  sourcesByWordId: ReadonlyMap<number, readonly WrongBookSource[]>,
  now: string,
): Promise<void> {
  for (const [wordId, sources] of sourcesByWordId) {
    await saveWrongBookEntry(db, wordId, sources, now, true);
    await db.runAsync(
      `UPDATE words
       SET learning_status = 'wrong'
       WHERE id = $wordId`,
      { $wordId: wordId },
    );
  }
}

export async function countWrongBookWords(db: SQLiteDatabase): Promise<number> {
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM wrong_book_words',
  );
  return result?.count ?? 0;
}

export async function listWrongBookWords(
  db: SQLiteDatabase,
  limit: number,
  offset: number,
): Promise<WrongBookEntry[]> {
  const rows = await db.getAllAsync<WrongBookEntryRow>(
    `SELECT ${selectWordColumns('words')},
       wrong_book_words.added_at,
       wrong_book_words.last_wrong_at,
       wrong_book_words.wrong_count,
       COALESCE(GROUP_CONCAT(wrong_book_sources.source, ','), '') AS sources
     FROM wrong_book_words
     JOIN words ON words.id = wrong_book_words.word_id
     LEFT JOIN wrong_book_sources
       ON wrong_book_sources.word_id = wrong_book_words.word_id
     GROUP BY wrong_book_words.word_id
     ORDER BY wrong_book_words.last_wrong_at DESC, words.word COLLATE NOCASE ASC
     LIMIT ? OFFSET ?`,
    limit,
    offset,
  );
  return rows.map((row) => ({
    ...row,
    sources: parseSources(row.sources),
  }));
}

export async function listWrongReviewWords(
  db: SQLiteDatabase,
  limit: number,
  randomize: boolean,
): Promise<TaskWord[]> {
  const orderBy = randomize
    ? 'RANDOM()'
    : 'wrong_book_words.last_wrong_at DESC, words.word COLLATE NOCASE ASC';
  const rows = await db.getAllAsync<TaskWordRow>(
    `SELECT ${selectTaskWordColumns('words')}
     FROM wrong_book_words
     JOIN words ON words.id = wrong_book_words.word_id
     ORDER BY ${orderBy}
     LIMIT ?`,
    limit,
  );
  return rows.map(mapTaskWordRow);
}

export async function countAvailableWordsForWrongBook(
  db: SQLiteDatabase,
): Promise<number> {
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count
     FROM words
     WHERE words.is_active = 1
       AND NOT EXISTS (
       SELECT 1
       FROM wrong_book_words
       WHERE wrong_book_words.word_id = words.id
     )`,
  );
  return result?.count ?? 0;
}

export async function listAvailableWordsForWrongBook(
  db: SQLiteDatabase,
  limit: number,
  offset: number,
): Promise<WordRecord[]> {
  return db.getAllAsync<WordRecord>(
    `SELECT ${selectWordColumns('words')}
     FROM words
     WHERE words.is_active = 1
       AND NOT EXISTS (
       SELECT 1
       FROM wrong_book_words
       WHERE wrong_book_words.word_id = words.id
     )
     ORDER BY words.word COLLATE NOCASE ASC
     LIMIT ? OFFSET ?`,
    limit,
    offset,
  );
}

export async function addWrongBookWord(
  db: SQLiteDatabase,
  wordId: number,
  source: WrongBookSource = 'manual',
): Promise<void> {
  await addWrongBookWords(db, [wordId], source);
}

export async function addWrongBookWords(
  db: SQLiteDatabase,
  wordIds: number[],
  source: WrongBookSource = 'manual',
): Promise<void> {
  await saveWrongBookEntries(db, wordIds, source, false);
}

export async function recordWrongWords(
  db: SQLiteDatabase,
  wordIds: number[],
  source: WrongBookSource,
): Promise<void> {
  await saveWrongBookEntries(db, wordIds, source, true);
}

export async function resolveWrongBookRemoval(
  db: SQLiteDatabase,
  wordIds: number[],
  targetStatus: 'learned' | 'unlearned',
): Promise<void> {
  await setWordsLearningStatus(db, wordIds, targetStatus);
}

export async function setWordsLearningStatus(
  db: SQLiteDatabase,
  wordIds: number[],
  targetStatus: 'learned' | 'unlearned' | 'wrong',
): Promise<void> {
  const now = new Date().toISOString();
  await db.withExclusiveTransactionAsync(async (transaction) => {
    await setWordsLearningStatusInTransaction(
      transaction,
      wordIds,
      targetStatus,
      now,
    );
  });
}

export async function setWordsLearningStatusInTransaction(
  db: SQLiteDatabase,
  wordIds: number[],
  targetStatus: 'learned' | 'unlearned' | 'wrong',
  now: string,
): Promise<void> {
  const uniqueWordIds = [...new Set(wordIds)];
  if (uniqueWordIds.length === 0) {
    return;
  }

  for (const wordId of uniqueWordIds) {
    if (targetStatus === 'wrong') {
      await saveWrongBookEntry(db, wordId, ['manual'], now, false);
    } else {
      await db.runAsync(
        'DELETE FROM wrong_book_sources WHERE word_id = $wordId',
        { $wordId: wordId },
      );
      await db.runAsync(
        'DELETE FROM wrong_book_words WHERE word_id = $wordId',
        { $wordId: wordId },
      );
    }

    await db.runAsync(
      `UPDATE words
       SET learning_status = $learningStatus
       WHERE id = $wordId`,
      {
        $learningStatus: targetStatus,
        $wordId: wordId,
      },
    );

    if (targetStatus === 'learned') {
      await db.runAsync(
        `INSERT INTO word_learning_state (
           word_id,
           first_learned_at,
           last_learned_at,
           learned_count
         )
         VALUES ($wordId, $now, $now, 0)
         ON CONFLICT(word_id) DO NOTHING`,
        {
          $now: now,
          $wordId: wordId,
        },
      );
    }
  }
}
