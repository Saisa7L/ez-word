import type { SQLiteDatabase } from 'expo-sqlite';

import { formatLocalDate } from '@/utils/date';

import { ensureAppSettings } from './appSettings';

export type HomeStats = {
  checkinCount: number;
  studyDays: number;
  todayLearned: number;
  totalLearned: number;
  wrongBookCount: number;
};

export async function getHomeStats(db: SQLiteDatabase): Promise<HomeStats> {
  const today = formatLocalDate(new Date());
  const [
    todayRow,
    totalRow,
    wrongBookRow,
    studyDaysRow,
    checkinRow,
  ] = await Promise.all([
    db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(word_count), 0) AS total
       FROM study_sessions
       WHERE study_date = $today`,
      { $today: today },
    ),
    db.getFirstAsync<{ total: number }>(
      'SELECT COUNT(*) AS total FROM word_learning_state',
    ),
    db.getFirstAsync<{ total: number }>(
      'SELECT COUNT(*) AS total FROM wrong_book_words',
    ),
    db.getFirstAsync<{ total: number }>(
      'SELECT COUNT(DISTINCT study_date) AS total FROM study_sessions',
    ),
    db.getFirstAsync<{ total: number }>(
      'SELECT COUNT(*) AS total FROM study_sessions',
    ),
  ]);

  return {
    checkinCount: checkinRow?.total ?? 0,
    studyDays: studyDaysRow?.total ?? 0,
    todayLearned: todayRow?.total ?? 0,
    totalLearned: totalRow?.total ?? 0,
    wrongBookCount: wrongBookRow?.total ?? 0,
  };
}

export async function getLastReviewPromptStudyDay(
  db: SQLiteDatabase,
): Promise<number> {
  const row = await db.getFirstAsync<{ last_review_prompt_study_day: number }>(
    `SELECT last_review_prompt_study_day
     FROM app_settings
     WHERE id = 1`,
  );
  return row?.last_review_prompt_study_day ?? 0;
}

export async function markReviewPrompted(
  db: SQLiteDatabase,
  studyDay: number,
): Promise<void> {
  await ensureAppSettings(db);
  await db.runAsync(
    `UPDATE app_settings
     SET last_review_prompt_study_day = $studyDay
     WHERE id = 1
       AND last_review_prompt_study_day < $studyDay`,
    { $studyDay: studyDay },
  );
}
