import type { SQLiteDatabase } from 'expo-sqlite';

import { formatLocalDate } from '@/utils/date';

type RecordTaskCompletionOptions = {
  completedAt?: Date;
  wordIds: number[];
  wrongCount: number;
  wrongWordIds: number[];
};

export async function recordTaskCompletion(
  db: SQLiteDatabase,
  {
    completedAt = new Date(),
    wordIds,
    wrongCount,
    wrongWordIds,
  }: RecordTaskCompletionOptions,
): Promise<void> {
  const completedAtIso = completedAt.toISOString();
  const studyDate = formatLocalDate(completedAt);
  const uniqueWordIds = [...new Set(wordIds)];
  const wrongWordIdSet = new Set(wrongWordIds);

  await db.withExclusiveTransactionAsync(async (transaction) => {
    for (const wordId of uniqueWordIds) {
      await transaction.runAsync(
        `INSERT INTO word_learning_state (
           word_id,
           first_learned_at,
           last_learned_at
         )
         VALUES ($wordId, $completedAt, $completedAt)
         ON CONFLICT(word_id) DO UPDATE SET
           last_learned_at = excluded.last_learned_at`,
        {
          $wordId: wordId,
          $completedAt: completedAtIso,
        },
      );

      await transaction.runAsync(
        `UPDATE words
         SET learning_status = $learningStatus
         WHERE id = $wordId`,
        {
          $learningStatus: wrongWordIdSet.has(wordId) ? 'wrong' : 'learned',
          $wordId: wordId,
        },
      );
    }

    await transaction.runAsync(
      `INSERT INTO study_sessions (
         completed_at,
         study_date,
         word_count,
         wrong_count
       )
       VALUES ($completedAt, $studyDate, $wordCount, $wrongCount)`,
      {
        $completedAt: completedAtIso,
        $studyDate: studyDate,
        $wordCount: uniqueWordIds.length,
        $wrongCount: Math.max(0, wrongCount),
      },
    );
  });
}
