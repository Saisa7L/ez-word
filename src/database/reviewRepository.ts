import type { SQLiteDatabase } from 'expo-sqlite';

import type { WordRecord } from './wordsRepository';

export type ReviewWord = WordRecord & {
  last_learned_at: string;
};

function getCutoffIso(days: number | null): string | null {
  if (days === null) {
    return null;
  }
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export async function countReviewWords(
  db: SQLiteDatabase,
  days: number | null,
): Promise<number> {
  const row = await db.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) AS total
     FROM word_learning_state
     JOIN words ON words.id = word_learning_state.word_id
     WHERE ($cutoff IS NULL OR word_learning_state.last_learned_at >= $cutoff)
       AND words.is_active = 1
       AND words.learning_status = 'learned'`,
    { $cutoff: getCutoffIso(days) },
  );
  return row?.total ?? 0;
}

export async function listReviewWords(
  db: SQLiteDatabase,
  days: number | null,
): Promise<ReviewWord[]> {
  return db.getAllAsync<ReviewWord>(
    `SELECT
       words.id,
       words.word,
       words.meaning,
       words.phonetic,
       words.is_active,
       words.learning_status,
       words.created_at,
       words.updated_at,
       word_learning_state.last_learned_at
     FROM word_learning_state
     JOIN words ON words.id = word_learning_state.word_id
     WHERE ($cutoff IS NULL OR word_learning_state.last_learned_at >= $cutoff)
       AND words.is_active = 1
       AND words.learning_status = 'learned'
     ORDER BY word_learning_state.last_learned_at DESC,
              words.word COLLATE NOCASE ASC`,
    { $cutoff: getCutoffIso(days) },
  );
}
