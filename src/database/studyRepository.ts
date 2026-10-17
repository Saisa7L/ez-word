import type { SQLiteDatabase } from 'expo-sqlite';

type RecordTaskCompletionOptions = {
  completedAt?: Date;
  wordIds: number[];
  wrongCount: number;
  wrongWordIds: number[];
};

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
           last_learned_at,
           learned_count
         )
         VALUES ($wordId, $completedAt, $completedAt, 1)
         ON CONFLICT(word_id) DO UPDATE SET
           last_learned_at = excluded.last_learned_at,
           learned_count = word_learning_state.learned_count + 1`,
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
