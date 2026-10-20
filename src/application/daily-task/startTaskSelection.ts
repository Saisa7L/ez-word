import type { SQLiteDatabase } from 'expo-sqlite';

import {
  getDailyTaskSettings,
  type DailyTaskSettings,
} from '@/database/settingsRepository';
import { pickRandomReviewWords } from '@/database/reviewRepository';
import { listUnlearnedActiveWords } from '@/database/wordsRepository';
import { listWrongReviewWords } from '@/database/wrongBookRepository';
import type { TaskWord } from '@/domain/word/taskWord';

export type TaskSelection = {
  settings: DailyTaskSettings;
  words: TaskWord[];
};

export async function loadDailyTaskSelection(
  db: SQLiteDatabase,
): Promise<TaskSelection> {
  const settings = await getDailyTaskSettings(db);
  const words = await listUnlearnedActiveWords(
    db,
    settings.dailyWordLimit,
    settings.randomWordSelection,
  );

  return { settings, words };
}

export async function loadWrongReviewSelection(
  db: SQLiteDatabase,
): Promise<TaskSelection> {
  const settings = await getDailyTaskSettings(db);
  const words = await listWrongReviewWords(
    db,
    settings.wrongReviewWordLimit,
    settings.wrongReviewRandom,
  );

  return { settings, words };
}

export async function loadWordReviewSelection(
  db: SQLiteDatabase,
  days: number | null,
): Promise<TaskSelection> {
  const settings = await getDailyTaskSettings(db);
  const words = await pickRandomReviewWords(
    db,
    days,
    settings.wordReviewWordLimit,
  );
  return { settings, words };
}
