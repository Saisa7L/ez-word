import type { SQLiteDatabase } from 'expo-sqlite';

import type { TaskWord } from '@/domain/word/taskWord';

import { mapTaskWordRow, type TaskWordRow } from './taskWordMapper';
import { selectTaskWordColumns } from './sqlFragments';
function getCutoffIso(days: number | null): string | null {
  if (days === null) {
    return null;
  }
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export async function pickRandomReviewWords(
  db: SQLiteDatabase,
  days: number | null,
  limit: number,
): Promise<TaskWord[]> {
  const rows = await db.getAllAsync<TaskWordRow>(
    `SELECT ${selectTaskWordColumns('words')}
     FROM word_learning_state
     JOIN words ON words.id = word_learning_state.word_id
     WHERE ($cutoff IS NULL OR word_learning_state.last_learned_at >= $cutoff)
       AND words.is_active = 1
       AND words.learning_status = 'learned'
     ORDER BY RANDOM()
     LIMIT $limit`,
    { $cutoff: getCutoffIso(days), $limit: limit },
  );
  return rows.map(mapTaskWordRow);
}
