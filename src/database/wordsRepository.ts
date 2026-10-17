import type { SQLiteDatabase } from 'expo-sqlite';

import type { WordImportRow } from '@/features/word-import/types';

export type WordRecord = {
  id: number;
  word: string;
  meaning: string;
  phonetic: string;
  created_at: string;
  updated_at: string;
};

export type UpsertWordsResult = {
  inserted: number;
  updated: number;
};

export async function upsertWords(
  db: SQLiteDatabase,
  rows: WordImportRow[],
): Promise<UpsertWordsResult> {
  let inserted = 0;
  let updated = 0;
  const now = new Date().toISOString();

  await db.withExclusiveTransactionAsync(async (transaction) => {
    for (const row of rows) {
      const existing = await transaction.getFirstAsync<{ id: number }>(
        'SELECT id FROM words WHERE word = $word COLLATE NOCASE',
        { $word: row.word },
      );

      if (existing) {
        await transaction.runAsync(
          `UPDATE words
           SET meaning = $meaning,
               phonetic = $phonetic,
               is_active = 1,
               updated_at = $updatedAt
           WHERE id = $id`,
          {
            $id: existing.id,
            $meaning: row.meaning,
            $phonetic: row.phonetic,
            $updatedAt: now,
          },
        );
        updated += 1;
      } else {
        await transaction.runAsync(
          `INSERT INTO words (word, meaning, phonetic, created_at, updated_at)
           VALUES ($word, $meaning, $phonetic, $createdAt, $updatedAt)`,
          {
            $word: row.word,
            $meaning: row.meaning,
            $phonetic: row.phonetic,
            $createdAt: now,
            $updatedAt: now,
          },
        );
        inserted += 1;
      }
    }
  });

  return { inserted, updated };
}

export async function getWordCount(db: SQLiteDatabase): Promise<number> {
  const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM words');
  return result?.count ?? 0;
}

export async function getActiveWordCount(db: SQLiteDatabase): Promise<number> {
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM words WHERE is_active = 1',
  );
  return result?.count ?? 0;
}

export async function deactivateAllWords(db: SQLiteDatabase): Promise<number> {
  let clearedCount = 0;
  const now = new Date().toISOString();

  await db.withExclusiveTransactionAsync(async (transaction) => {
    const result = await transaction.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM words WHERE is_active = 1',
    );
    clearedCount = result?.count ?? 0;

    if (clearedCount > 0) {
      await transaction.runAsync(
        `UPDATE words
         SET is_active = 0,
             updated_at = $updatedAt
         WHERE is_active = 1`,
        { $updatedAt: now },
      );
    }
  });

  return clearedCount;
}

export async function listWords(db: SQLiteDatabase, limit = 50): Promise<WordRecord[]> {
  return db.getAllAsync<WordRecord>(
    `SELECT id, word, meaning, phonetic, created_at, updated_at
     FROM words
     ORDER BY word COLLATE NOCASE ASC
     LIMIT ?`,
    limit,
  );
}

export async function listUnlearnedActiveWords(
  db: SQLiteDatabase,
  limit: number,
  randomize = false,
): Promise<WordRecord[]> {
  const orderBy = randomize
    ? 'RANDOM()'
    : 'words.word COLLATE NOCASE ASC';

  return db.getAllAsync<WordRecord>(
    `SELECT
       words.id,
       words.word,
       words.meaning,
       words.phonetic,
       words.created_at,
       words.updated_at
     FROM words
     LEFT JOIN word_learning_state
       ON word_learning_state.word_id = words.id
     WHERE words.is_active = 1
       AND word_learning_state.word_id IS NULL
     ORDER BY ${orderBy}
     LIMIT ?`,
    limit,
  );
}
