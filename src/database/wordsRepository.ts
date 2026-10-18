import type { SQLiteDatabase } from 'expo-sqlite';

import type { WordImportRow } from '@/features/word-import/types';

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
        const exampleSentence = row.example_sentence?.trim() ?? '';
        await transaction.runAsync(
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
            $id: existing.id,
            $meaning: row.meaning,
            $phonetic: row.phonetic,
            $exampleSentence: exampleSentence,
            $updatedAt: now,
          },
        );
        updated += 1;
      } else {
        await transaction.runAsync(
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
            $word: row.word,
            $meaning: row.meaning,
            $phonetic: row.phonetic,
            $exampleSentence: row.example_sentence?.trim() ?? '',
            $exampleSource: row.example_sentence?.trim() ? 'csv' : '',
            $exampleGeneratedAt: row.example_sentence?.trim() ? now : null,
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

export async function upsertSingleWord(
  db: SQLiteDatabase,
  row: WordImportRow,
): Promise<number> {
  const now = new Date().toISOString();
  let wordId = 0;

  await db.withExclusiveTransactionAsync(async (transaction) => {
    const existing = await transaction.getFirstAsync<{ id: number }>(
      'SELECT id FROM words WHERE word = $word COLLATE NOCASE',
      { $word: row.word },
    );

    if (existing) {
      wordId = existing.id;
      const exampleSentence = row.example_sentence?.trim() ?? '';
      await transaction.runAsync(
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
          $id: existing.id,
          $meaning: row.meaning,
          $phonetic: row.phonetic,
          $exampleSentence: exampleSentence,
          $updatedAt: now,
        },
      );
      return;
    }

    const result = await transaction.runAsync(
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
        $word: row.word,
        $meaning: row.meaning,
        $phonetic: row.phonetic,
        $exampleSentence: row.example_sentence?.trim() ?? '',
        $exampleSource: row.example_sentence?.trim() ? 'csv' : '',
        $exampleGeneratedAt: row.example_sentence?.trim() ? now : null,
        $createdAt: now,
        $updatedAt: now,
      },
    );
    wordId = result.lastInsertRowId;
  });

  return wordId;
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

export async function listActiveWords(
  db: SQLiteDatabase,
  limit: number,
  offset: number,
): Promise<WordRecord[]> {
  return db.getAllAsync<WordRecord>(
    `SELECT
       id,
       word,
       meaning,
       phonetic,
       example_sentence,
       example_source,
       example_generated_at,
       is_active,
       learning_status,
       created_at,
       updated_at
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
    `SELECT
       id,
       word,
       meaning,
       phonetic,
       example_sentence,
       example_source,
       example_generated_at,
       is_active,
       learning_status,
       created_at,
       updated_at
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
    `SELECT
       id,
       word,
       meaning,
       phonetic,
       example_sentence,
       example_source,
       example_generated_at,
       is_active,
       learning_status,
       created_at,
       updated_at
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

export async function listWords(db: SQLiteDatabase, limit = 50): Promise<WordRecord[]> {
  return db.getAllAsync<WordRecord>(
    `SELECT
       id,
       word,
       meaning,
       phonetic,
       example_sentence,
       example_source,
       example_generated_at,
       is_active,
       learning_status,
       created_at,
       updated_at
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
       words.example_sentence,
       words.example_source,
       words.example_generated_at,
       words.is_active,
       words.learning_status,
       words.created_at,
       words.updated_at
     FROM words
     WHERE words.is_active = 1
       AND words.learning_status = 'unlearned'
     ORDER BY ${orderBy}
     LIMIT ?`,
    limit,
  );
}
