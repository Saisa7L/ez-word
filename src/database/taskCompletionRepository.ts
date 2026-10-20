import type { SQLiteDatabase } from 'expo-sqlite';

import { formatLocalDate } from '@/utils/date';

import {
  recordWrongWordsInTransaction,
  setWordsLearningStatusInTransaction,
  type WrongBookSource,
} from './wrongBookRepository';

export type TaskCompletionMode = 'daily' | 'wrongReview' | 'wordReview';

export type CompleteTaskSessionOptions = {
  autoRemoveCorrectWrongReview: boolean;
  completedAt?: Date;
  fillMistakeWordIds: number[];
  listeningMistakeWordIds: number[];
  mode: TaskCompletionMode;
  wordIds: number[];
};

export type TaskCompletionResult = {
  wrongWordCount: number;
};

export async function completeTaskSession(
  db: SQLiteDatabase,
  {
    autoRemoveCorrectWrongReview,
    completedAt = new Date(),
    fillMistakeWordIds,
    listeningMistakeWordIds,
    mode,
    wordIds,
  }: CompleteTaskSessionOptions,
): Promise<TaskCompletionResult> {
  const completedAtIso = completedAt.toISOString();
  const studyDate = formatLocalDate(completedAt);
  const uniqueWordIds = [...new Set(wordIds)];
  const sourcesByWordId = new Map<number, Set<WrongBookSource>>();

  const addSources = (ids: number[], source: WrongBookSource) => {
    for (const wordId of ids) {
      const sources = sourcesByWordId.get(wordId) ?? new Set();
      sources.add(source);
      sourcesByWordId.set(wordId, sources);
    }
  };

  addSources(fillMistakeWordIds, 'fill');
  addSources(listeningMistakeWordIds, 'listening');

  const wrongWordIds = new Set(sourcesByWordId.keys());
  const finalizedSources = new Map<number, readonly WrongBookSource[]>();
  for (const [wordId, sources] of sourcesByWordId) {
    finalizedSources.set(wordId, [...sources]);
  }

  await db.withTransactionAsync(async () => {
    if (finalizedSources.size > 0) {
      await recordWrongWordsInTransaction(
        db,
        finalizedSources,
        completedAtIso,
      );
    }

    if (mode === 'daily') {
      for (const wordId of uniqueWordIds) {
        await db.runAsync(
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
            $completedAt: completedAtIso,
            $wordId: wordId,
          },
        );

        await db.runAsync(
          `UPDATE words
           SET learning_status = $learningStatus
           WHERE id = $wordId`,
          {
            $learningStatus: wrongWordIds.has(wordId)
              ? 'wrong'
              : 'learned',
            $wordId: wordId,
          },
        );
      }

      await db.runAsync(
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
          $wrongCount: wrongWordIds.size,
        },
      );
    } else if (
      mode === 'wrongReview' &&
      autoRemoveCorrectWrongReview
    ) {
      const correctWordIds = uniqueWordIds.filter(
        (wordId) => !wrongWordIds.has(wordId),
      );
      await setWordsLearningStatusInTransaction(
        db,
        correctWordIds,
        'learned',
        completedAtIso,
      );
    }
  });

  return {
    wrongWordCount: wrongWordIds.size,
  };
}
