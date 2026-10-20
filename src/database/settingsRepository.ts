import type { SQLiteDatabase } from 'expo-sqlite';

export const DAILY_WORD_LIMIT_MIN = 5;
export const DAILY_WORD_LIMIT_MAX = 50;
export const DAILY_WORD_LIMIT_STEP = 1;

export const LISTENING_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
export const LISTENING_WORD_INTERVAL_MIN = 1;
export const LISTENING_WORD_INTERVAL_MAX = 10;
export const LISTENING_WORD_INTERVAL_STEP = 0.1;
export const REVIEW_REMINDER_INTERVAL_MIN = 1;
export const REVIEW_REMINDER_INTERVAL_MAX = 30;
export const REVIEW_WORD_LIMIT_MIN = 1;
export const REVIEW_WORD_LIMIT_MAX = 100;

export const DEFAULT_DAILY_TASK_SETTINGS = {
  advanceOnMistakes: true,
  autoRemoveCorrectWrongReview: false,
  dailyWordLimit: 10,
  listeningDefaultRate: 1,
  listeningWordIntervalSeconds: 5,
  randomWordSelection: false,
  reviewReminderEnabled: true,
  reviewReminderIntervalDays: 3,
  wrongReviewRandom: false,
  wrongReviewWordLimit: 10,
  wordReviewWordLimit: 10,
} as const;

export type DailyTaskSettings = {
  advanceOnMistakes: boolean;
  autoRemoveCorrectWrongReview: boolean;
  dailyWordLimit: number;
  listeningDefaultRate: number;
  listeningWordIntervalSeconds: number;
  randomWordSelection: boolean;
  reviewReminderEnabled: boolean;
  reviewReminderIntervalDays: number;
  wrongReviewRandom: boolean;
  wrongReviewWordLimit: number;
  wordReviewWordLimit: number;
};

type SettingsRow = {
  advance_on_mistakes: number;
  auto_remove_correct_wrong_review: number;
  daily_word_limit: number;
  listening_default_rate: number;
  listening_word_interval_seconds: number;
  random_word_selection: number;
  review_reminder_enabled: number;
  review_reminder_interval_days: number;
  wrong_review_random: number;
  wrong_review_word_limit: number;
  word_review_word_limit: number;
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
    Math.abs(candidate - value) < Math.abs(closest - value)
      ? candidate
      : closest,
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

export function normalizeReviewReminderInterval(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_DAILY_TASK_SETTINGS.reviewReminderIntervalDays;
  }
  return Math.min(
    REVIEW_REMINDER_INTERVAL_MAX,
    Math.max(REVIEW_REMINDER_INTERVAL_MIN, Math.round(value)),
  );
}

export function normalizeReviewWordLimit(value: number): number {
  if (!Number.isFinite(value)) {
    return 10;
  }
  return Math.min(
    REVIEW_WORD_LIMIT_MAX,
    Math.max(REVIEW_WORD_LIMIT_MIN, Math.round(value)),
  );
}

export async function getDailyTaskSettings(
  db: SQLiteDatabase,
): Promise<DailyTaskSettings> {
  const row = await db.getFirstAsync<SettingsRow>(
    `SELECT
       advance_on_mistakes,
       auto_remove_correct_wrong_review,
       daily_word_limit,
       listening_default_rate,
       listening_word_interval_seconds,
       random_word_selection,
       review_reminder_enabled,
       review_reminder_interval_days,
       wrong_review_random,
       wrong_review_word_limit,
       word_review_word_limit
     FROM app_settings
     WHERE id = 1`,
  );

  if (!row) {
    return { ...DEFAULT_DAILY_TASK_SETTINGS };
  }

  return {
    advanceOnMistakes: row.advance_on_mistakes === 1,
    autoRemoveCorrectWrongReview: row.auto_remove_correct_wrong_review === 1,
    dailyWordLimit: normalizeDailyWordLimit(row.daily_word_limit),
    listeningDefaultRate: normalizeListeningRate(row.listening_default_rate),
    listeningWordIntervalSeconds: normalizeListeningWordInterval(
      row.listening_word_interval_seconds,
    ),
    randomWordSelection: row.random_word_selection === 1,
    reviewReminderEnabled: row.review_reminder_enabled === 1,
    reviewReminderIntervalDays: normalizeReviewReminderInterval(
      row.review_reminder_interval_days,
    ),
    wrongReviewRandom: row.wrong_review_random === 1,
    wrongReviewWordLimit: normalizeReviewWordLimit(row.wrong_review_word_limit),
    wordReviewWordLimit: normalizeReviewWordLimit(row.word_review_word_limit),
  };
}

export async function saveDailyTaskSettings(
  db: SQLiteDatabase,
  settings: DailyTaskSettings,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO app_settings (
       advance_on_mistakes,
       auto_remove_correct_wrong_review,
       id,
       daily_word_limit,
       listening_default_rate,
       listening_word_interval_seconds,
       random_word_selection,
       review_reminder_enabled,
       review_reminder_interval_days,
       wrong_review_random,
       wrong_review_word_limit,
       word_review_word_limit
     )
     VALUES (
       $advanceOnMistakes,
       $autoRemoveCorrectWrongReview,
       1,
       $dailyWordLimit,
       $listeningDefaultRate,
       $listeningWordIntervalSeconds,
       $randomWordSelection,
       $reviewReminderEnabled,
       $reviewReminderIntervalDays,
       $wrongReviewRandom,
       $wrongReviewWordLimit,
       $wordReviewWordLimit
     )
     ON CONFLICT(id) DO UPDATE SET
       advance_on_mistakes = excluded.advance_on_mistakes,
       auto_remove_correct_wrong_review = excluded.auto_remove_correct_wrong_review,
       daily_word_limit = excluded.daily_word_limit,
       listening_default_rate = excluded.listening_default_rate,
       listening_word_interval_seconds = excluded.listening_word_interval_seconds,
       random_word_selection = excluded.random_word_selection,
       review_reminder_enabled = excluded.review_reminder_enabled,
       review_reminder_interval_days = excluded.review_reminder_interval_days,
       wrong_review_random = excluded.wrong_review_random,
       wrong_review_word_limit = excluded.wrong_review_word_limit,
       word_review_word_limit = excluded.word_review_word_limit`,
    {
      $advanceOnMistakes: settings.advanceOnMistakes ? 1 : 0,
      $autoRemoveCorrectWrongReview: settings.autoRemoveCorrectWrongReview
        ? 1
        : 0,
      $dailyWordLimit: normalizeDailyWordLimit(settings.dailyWordLimit),
      $listeningDefaultRate: normalizeListeningRate(
        settings.listeningDefaultRate,
      ),
      $listeningWordIntervalSeconds: normalizeListeningWordInterval(
        settings.listeningWordIntervalSeconds,
      ),
      $randomWordSelection: settings.randomWordSelection ? 1 : 0,
      $reviewReminderEnabled: settings.reviewReminderEnabled ? 1 : 0,
      $reviewReminderIntervalDays: normalizeReviewReminderInterval(
        settings.reviewReminderIntervalDays,
      ),
      $wrongReviewRandom: settings.wrongReviewRandom ? 1 : 0,
      $wrongReviewWordLimit: normalizeReviewWordLimit(
        settings.wrongReviewWordLimit,
      ),
      $wordReviewWordLimit: normalizeReviewWordLimit(
        settings.wordReviewWordLimit,
      ),
    },
  );
}
