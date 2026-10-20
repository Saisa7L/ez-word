import type { SQLiteDatabase } from 'expo-sqlite';

import { DEFAULT_DAILY_TASK_SETTINGS } from './settingsRepository';

export async function ensureAppSettings(
  db: Pick<SQLiteDatabase, 'runAsync'>,
): Promise<void> {
  await db.runAsync(
    `INSERT OR IGNORE INTO app_settings (
       id,
       daily_word_limit,
       listening_default_rate
     )
     VALUES (
       1,
       $dailyWordLimit,
       $listeningDefaultRate
     )`,
    {
      $dailyWordLimit: DEFAULT_DAILY_TASK_SETTINGS.dailyWordLimit,
      $listeningDefaultRate:
        DEFAULT_DAILY_TASK_SETTINGS.listeningDefaultRate,
    },
  );
}
