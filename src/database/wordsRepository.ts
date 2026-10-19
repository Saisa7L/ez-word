import type { SQLiteDatabase } from 'expo-sqlite';

import type { WordImportRow } from '@/features/word-import/types';

import { selectWordColumns } from './sqlFragments';

export type WordRecord = {
  example_generated_at: string | null;
  example_sentence: string;
  example_source: string;
  id: number;
  word: string;
  meaning: string;
  phonetic: string;
  is_active: number;
  learning_status: LearningStatus;
  created_at: string;
  updated_at: string;
};

export type LearningStatus = 'unlearned' | 'learned' | 'wrong';

export type UpsertWordsResult = {
  inserted: number;
  updated: number;
};

type UpsertWordResult = {
  id: number;
  inserted: boolean;
};

async function upsertWordRecord(
  db: SQLiteDatabase,
  row: WordImportRow,
  now: string,
): Promise<UpsertWordResult> {
  const existing = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM words WHERE word = $word COLLATE NOCASE',
    { $word: row.word },
  );
  const exampleSentence = row.example_sentence?.trim() ?? '';

  if (existing) {
    await db.runAsync(
      `UPDATE words
       SET meaning = $meaning,
           phonetic = $phonetic,
           example_sentence = CASE
             WHEN $exampleSentence <> '' THEN $exampleSentence
             ELSE example_sentence
           END,
           example_source = CASE
             WHEN $exampleSentence <> '' THEN 'csv'
             ELSE example_source
           END,
           example_generated_at = CASE
             WHEN $exampleSentence <> '' THEN $updatedAt
             ELSE example_generated_at
           END,
           is_active = 1,
           updated_at = $updatedAt
       WHERE id = $id`,
      {
        $exampleSentence: exampleSentence,
        $id: existing.id,
        $meaning: row.meaning,
        $phonetic: row.phonetic,
        $updatedAt: now,
      },
    );
    return { id: existing.id, inserted: false };
  }

  const result = await db.runAsync(
    `INSERT INTO words (
       word,
       meaning,
       phonetic,
       example_sentence,
       example_source,
       example_generated_at,
       created_at,
       updated_at
     )
     VALUES (
       $word,
       $meaning,
       $phonetic,
       $exampleSentence,
       $exampleSource,
       $exampleGeneratedAt,
       $createdAt,
       $updatedAt
     )`,
    {
      $createdAt: now,
      $exampleGeneratedAt: exampleSentence ? now : null,
      $exampleSentence: exampleSentence,
      $exampleSource: exampleSentence ? 'csv' : '',
      $meaning: row.meaning,
      $phonetic: row.phonetic,
      $updatedAt: now,
      $word: row.word,
    },
  );

  return { id: result.lastInsertRowId, inserted: true };
}

export async function upsertWords(
  db: SQLiteDatabase,
  rows: WordImportRow[],
): Promise<UpsertWordsResult> {
  let inserted = 0;
  let updated = 0;
  const now = new Date().toISOString();

  await db.withExclusiveTransactionAsync(async (transaction) => {
    for (const row of rows) {
      const result = await upsertWordRecord(transaction, row, now);
      if (result.inserted) {
        inserted += 1;
      } else {
        updated += 1;
      }
    }
  });

  return { inserted, updated };
}

export async function upsertSingleWord(
  db: SQLiteDatabase,
  row: WordImportRow,
): Promise<number> {
  const now = new Date().toISOString();
  let wordId = 0;

  await db.withExclusiveTransactionAsync(async (transaction) => {
    const result = await upsertWordRecord(transaction, row, now);
    wordId = result.id;
  });

  return wordId;
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

export async function listActiveWords(
  db: SQLiteDatabase,
  limit: number,
  offset: number,
): Promise<WordRecord[]> {
  return db.getAllAsync<WordRecord>(
    `SELECT ${selectWordColumns()}
     FROM words
     WHERE is_active = 1
     ORDER BY word COLLATE NOCASE ASC
     LIMIT ? OFFSET ?`,
    limit,
    offset,
  );
}

export async function deactivateWords(
  db: SQLiteDatabase,
  wordIds: number[],
): Promise<void> {
  const uniqueWordIds = [...new Set(wordIds)];
  if (uniqueWordIds.length === 0) {
    return;
  }

  const now = new Date().toISOString();
  await db.withExclusiveTransactionAsync(async (transaction) => {
    for (const wordId of uniqueWordIds) {
      await transaction.runAsync(
        `UPDATE words
         SET is_active = 0,
             updated_at = $updatedAt
         WHERE id = $wordId`,
        {
          $updatedAt: now,
          $wordId: wordId,
        },
      );
    }
  });
}

export async function findWordByWord(
  db: SQLiteDatabase,
  word: string,
): Promise<WordRecord | null> {
  return db.getFirstAsync<WordRecord>(
    `SELECT ${selectWordColumns()}
     FROM words
     WHERE word = $word COLLATE NOCASE
     LIMIT 1`,
    { $word: word },
  );
}

export async function listWordsForExampleGeneration(
  db: SQLiteDatabase,
  overwriteExisting: boolean,
): Promise<WordRecord[]> {
  const whereExample = overwriteExisting
    ? ''
    : "AND TRIM(example_sentence) = ''";

  return db.getAllAsync<WordRecord>(
    `SELECT ${selectWordColumns()}
     FROM words
     WHERE is_active = 1
       ${whereExample}
     ORDER BY word COLLATE NOCASE ASC`,
  );
}

export async function updateWordExample(
  db: SQLiteDatabase,
  wordId: number,
  exampleSentence: string,
  source: 'ai' | 'csv' = 'ai',
): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE words
     SET example_sentence = $exampleSentence,
         example_source = $source,
         example_generated_at = $generatedAt,
         updated_at = $generatedAt
     WHERE id = $wordId`,
    {
      $exampleSentence: exampleSentence,
      $generatedAt: now,
      $source: source,
      $wordId: wordId,
    },
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
    `SELECT ${selectWordColumns('words')}
     FROM words
     WHERE words.is_active = 1
       AND words.learning_status = 'unlearned'
     ORDER BY ${orderBy}
     LIMIT ?`,
    limit,
  );
}
