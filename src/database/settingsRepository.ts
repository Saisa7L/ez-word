import type { SQLiteDatabase } from 'expo-sqlite';

export const DAILY_WORD_LIMIT_MIN = 5;
export const DAILY_WORD_LIMIT_MAX = 50;
export const DAILY_WORD_LIMIT_STEP = 1;

export const LISTENING_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export const DEFAULT_DAILY_TASK_SETTINGS = {
  dailyWordLimit: 10,
  listeningDefaultRate: 1,
} as const;

export type DailyTaskSettings = {
  dailyWordLimit: number;
  listeningDefaultRate: number;
};

type SettingsRow = {
  daily_word_limit: number;
  listening_default_rate: number;
};

export function normalizeDailyWordLimit(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_DAILY_TASK_SETTINGS.dailyWordLimit;
  }

  const steppedValue =
    Math.round(value / DAILY_WORD_LIMIT_STEP) * DAILY_WORD_LIMIT_STEP;
  return Math.min(
    DAILY_WORD_LIMIT_MAX,
    Math.max(DAILY_WORD_LIMIT_MIN, steppedValue),
  );
}

export function normalizeListeningRate(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_DAILY_TASK_SETTINGS.listeningDefaultRate;
  }

  return LISTENING_RATES.reduce((closest, candidate) =>
    Math.abs(candidate - value) < Math.abs(closest - value) ? candidate : closest,
  );
}

export async function getDailyTaskSettings(
  db: SQLiteDatabase,
): Promise<DailyTaskSettings> {
  const row = await db.getFirstAsync<SettingsRow>(
    `SELECT daily_word_limit, listening_default_rate
     FROM app_settings
     WHERE id = 1`,
  );

  if (!row) {
    await saveDailyTaskSettings(db, DEFAULT_DAILY_TASK_SETTINGS);
    return { ...DEFAULT_DAILY_TASK_SETTINGS };
  }

  return {
    dailyWordLimit: normalizeDailyWordLimit(row.daily_word_limit),
    listeningDefaultRate: normalizeListeningRate(row.listening_default_rate),
  };
}

export async function saveDailyTaskSettings(
  db: SQLiteDatabase,
  settings: DailyTaskSettings,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO app_settings (
       id,
       daily_word_limit,
       listening_default_rate
     )
     VALUES (1, $dailyWordLimit, $listeningDefaultRate)
     ON CONFLICT(id) DO UPDATE SET
       daily_word_limit = excluded.daily_word_limit,
       listening_default_rate = excluded.listening_default_rate`,
    {
      $dailyWordLimit: normalizeDailyWordLimit(settings.dailyWordLimit),
      $listeningDefaultRate: normalizeListeningRate(
        settings.listeningDefaultRate,
      ),
    },
  );
}
