import type { SQLiteDatabase } from 'expo-sqlite';

import type { WordRecord } from './wordsRepository';

export type WrongBookSource = 'fill' | 'listening' | 'manual';

export type WrongBookEntry = WordRecord & {
  added_at: string;
  last_wrong_at: string;
  sources: string;
  wrong_count: number;
};

function mergeSources(currentSources: string, source: WrongBookSource): string {
  return [...new Set([...currentSources.split(','), source].filter(Boolean))].join(
    ',',
  );
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
  return db.getAllAsync<WrongBookEntry>(
    `SELECT
       words.id,
       words.word,
       words.meaning,
       words.phonetic,
       words.is_active,
       words.learning_status,
       words.created_at,
       words.updated_at,
       wrong_book_words.added_at,
       wrong_book_words.last_wrong_at,
       wrong_book_words.sources,
       wrong_book_words.wrong_count
     FROM wrong_book_words
     JOIN words ON words.id = wrong_book_words.word_id
     ORDER BY wrong_book_words.last_wrong_at DESC, words.word COLLATE NOCASE ASC
     LIMIT ? OFFSET ?`,
    limit,
    offset,
  );
}

export async function listAllWrongBookWords(
  db: SQLiteDatabase,
): Promise<WrongBookEntry[]> {
  return db.getAllAsync<WrongBookEntry>(
    `SELECT
       words.id,
       words.word,
       words.meaning,
       words.phonetic,
       words.is_active,
       words.learning_status,
       words.created_at,
       words.updated_at,
       wrong_book_words.added_at,
       wrong_book_words.last_wrong_at,
       wrong_book_words.sources,
       wrong_book_words.wrong_count
     FROM wrong_book_words
     JOIN words ON words.id = wrong_book_words.word_id
     ORDER BY wrong_book_words.last_wrong_at DESC, words.word COLLATE NOCASE ASC`,
  );
}

export async function countAvailableWordsForWrongBook(
  db: SQLiteDatabase,
): Promise<number> {
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count
     FROM words
     WHERE NOT EXISTS (
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
    `SELECT
       words.id,
       words.word,
       words.meaning,
       words.phonetic,
       words.is_active,
       words.learning_status,
       words.created_at,
       words.updated_at
     FROM words
     WHERE NOT EXISTS (
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
  const uniqueWordIds = [...new Set(wordIds)];
  if (uniqueWordIds.length === 0) {
    return;
  }

  const now = new Date().toISOString();

  await db.withExclusiveTransactionAsync(async (transaction) => {
    for (const wordId of uniqueWordIds) {
      const existing = await transaction.getFirstAsync<{ sources: string }>(
        'SELECT sources FROM wrong_book_words WHERE word_id = $wordId',
        { $wordId: wordId },
      );
      const sources = mergeSources(existing?.sources ?? '', source);

      await transaction.runAsync(
        `INSERT INTO wrong_book_words (
           word_id,
           added_at,
           last_wrong_at,
           wrong_count,
           sources
         )
         VALUES ($wordId, $now, $now, 0, $sources)
         ON CONFLICT(word_id) DO UPDATE SET
           sources = excluded.sources`,
        {
          $wordId: wordId,
          $now: now,
          $sources: sources,
        },
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

export async function recordWrongWords(
  db: SQLiteDatabase,
  wordIds: number[],
  source: WrongBookSource,
): Promise<void> {
  const uniqueWordIds = [...new Set(wordIds)];
  if (uniqueWordIds.length === 0) {
    return;
  }

  const now = new Date().toISOString();

  await db.withExclusiveTransactionAsync(async (transaction) => {
    for (const wordId of uniqueWordIds) {
      const existing = await transaction.getFirstAsync<{ sources: string }>(
        'SELECT sources FROM wrong_book_words WHERE word_id = $wordId',
        { $wordId: wordId },
      );
      const sources = mergeSources(existing?.sources ?? '', source);

      await transaction.runAsync(
        `INSERT INTO wrong_book_words (
           word_id,
           added_at,
           last_wrong_at,
           wrong_count,
           sources
         )
         VALUES ($wordId, $now, $now, 1, $sources)
         ON CONFLICT(word_id) DO UPDATE SET
           last_wrong_at = excluded.last_wrong_at,
           wrong_count = wrong_book_words.wrong_count + 1,
           sources = excluded.sources`,
        {
          $wordId: wordId,
          $now: now,
          $sources: sources,
        },
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
  const uniqueWordIds = [...new Set(wordIds)];
  if (uniqueWordIds.length === 0) {
    return;
  }

  const now = new Date().toISOString();

  await db.withExclusiveTransactionAsync(async (transaction) => {
    for (const wordId of uniqueWordIds) {
      if (targetStatus === 'wrong') {
        const existing = await transaction.getFirstAsync<{ sources: string }>(
          'SELECT sources FROM wrong_book_words WHERE word_id = $wordId',
          { $wordId: wordId },
        );
        const sources = mergeSources(existing?.sources ?? '', 'manual');

        await transaction.runAsync(
          `INSERT INTO wrong_book_words (
             word_id,
             added_at,
             last_wrong_at,
             wrong_count,
             sources
           )
           VALUES ($wordId, $now, $now, 0, $sources)
           ON CONFLICT(word_id) DO UPDATE SET
             sources = excluded.sources`,
          {
            $now: now,
            $sources: sources,
            $wordId: wordId,
          },
        );
      } else {
        await transaction.runAsync(
          'DELETE FROM wrong_book_words WHERE word_id = $wordId',
          { $wordId: wordId },
        );
      }

      await transaction.runAsync(
        `UPDATE words
         SET learning_status = $learningStatus
         WHERE id = $wordId`,
        {
          $learningStatus: targetStatus,
          $wordId: wordId,
        },
      );

      if (targetStatus === 'learned') {
        await transaction.runAsync(
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
  });
}
