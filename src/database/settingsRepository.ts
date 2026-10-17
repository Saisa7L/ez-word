import type { SQLiteDatabase } from 'expo-sqlite';

export const DAILY_WORD_LIMIT_MIN = 5;
export const DAILY_WORD_LIMIT_MAX = 50;
export const DAILY_WORD_LIMIT_STEP = 1;

export const LISTENING_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
export const LISTENING_WORD_INTERVAL_MIN = 1;
export const LISTENING_WORD_INTERVAL_MAX = 10;
export const LISTENING_WORD_INTERVAL_STEP = 0.1;

export const DEFAULT_DAILY_TASK_SETTINGS = {
  advanceOnMistakes: true,
  dailyWordLimit: 10,
  listeningDefaultRate: 1,
  listeningWordIntervalSeconds: 5,
  randomWordSelection: false,
} as const;

export type DailyTaskSettings = {
  advanceOnMistakes: boolean;
  dailyWordLimit: number;
  listeningDefaultRate: number;
  listeningWordIntervalSeconds: number;
  randomWordSelection: boolean;
};

type SettingsRow = {
  advance_on_mistakes: number;
  daily_word_limit: number;
  listening_default_rate: number;
  listening_word_interval_seconds: number;
  random_word_selection: number;
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

export function normalizeListeningWordInterval(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_DAILY_TASK_SETTINGS.listeningWordIntervalSeconds;
  }

  const steppedValue =
    Math.round(value / LISTENING_WORD_INTERVAL_STEP) *
    LISTENING_WORD_INTERVAL_STEP;
  return Math.min(
    LISTENING_WORD_INTERVAL_MAX,
    Math.max(LISTENING_WORD_INTERVAL_MIN, Math.round(steppedValue * 10) / 10),
  );
}

export async function getDailyTaskSettings(
  db: SQLiteDatabase,
): Promise<DailyTaskSettings> {
  const row = await db.getFirstAsync<SettingsRow>(
    `SELECT
       advance_on_mistakes,
       daily_word_limit,
       listening_default_rate,
       listening_word_interval_seconds,
       random_word_selection
     FROM app_settings
     WHERE id = 1`,
  );

  if (!row) {
    await saveDailyTaskSettings(db, DEFAULT_DAILY_TASK_SETTINGS);
    return { ...DEFAULT_DAILY_TASK_SETTINGS };
  }

  return {
    advanceOnMistakes: row.advance_on_mistakes === 1,
    dailyWordLimit: normalizeDailyWordLimit(row.daily_word_limit),
    listeningDefaultRate: normalizeListeningRate(row.listening_default_rate),
    listeningWordIntervalSeconds: normalizeListeningWordInterval(
      row.listening_word_interval_seconds,
    ),
    randomWordSelection: row.random_word_selection === 1,
  };
}

export async function saveDailyTaskSettings(
  db: SQLiteDatabase,
  settings: DailyTaskSettings,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO app_settings (
       advance_on_mistakes,
       id,
       daily_word_limit,
       listening_default_rate,
       listening_word_interval_seconds,
       random_word_selection
     )
     VALUES (
       $advanceOnMistakes,
       1,
       $dailyWordLimit,
       $listeningDefaultRate,
       $listeningWordIntervalSeconds,
       $randomWordSelection
     )
     ON CONFLICT(id) DO UPDATE SET
       advance_on_mistakes = excluded.advance_on_mistakes,
       daily_word_limit = excluded.daily_word_limit,
       listening_default_rate = excluded.listening_default_rate,
       listening_word_interval_seconds = excluded.listening_word_interval_seconds,
       random_word_selection = excluded.random_word_selection`,
    {
      $advanceOnMistakes: settings.advanceOnMistakes ? 1 : 0,
      $dailyWordLimit: normalizeDailyWordLimit(settings.dailyWordLimit),
      $listeningDefaultRate: normalizeListeningRate(
        settings.listeningDefaultRate,
      ),
      $listeningWordIntervalSeconds: normalizeListeningWordInterval(
        settings.listeningWordIntervalSeconds,
      ),
      $randomWordSelection: settings.randomWordSelection ? 1 : 0,
    },
  );
}
