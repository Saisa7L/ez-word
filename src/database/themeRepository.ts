import type { SQLiteDatabase } from 'expo-sqlite';

import {
  DEFAULT_THEME_PRIMARY_COLOR,
  DEFAULT_THEME_MODE,
  normalizeThemeColor,
  type ThemeMode,
} from '@/constants/theme';

import { ensureSettingsRows } from './settingsRows';

export type ThemeSettings = {
  mode: ThemeMode;
  primaryColor: string;
};

type ThemeSettingsRow = {
  theme_mode: string;
  theme_primary_color: string;
};

function normalizeThemeMode(value: string): ThemeMode {
  return value === 'night' || value === 'custom' ? value : 'day';
}

export async function getThemeSettings(
  db: SQLiteDatabase,
): Promise<ThemeSettings> {
  const row = await db.getFirstAsync<ThemeSettingsRow>(
    `SELECT theme_mode, theme_primary_color
     FROM theme_settings
     WHERE id = 1`,
  );

  return {
    mode: normalizeThemeMode(row?.theme_mode ?? DEFAULT_THEME_MODE),
    primaryColor: normalizeThemeColor(
      row?.theme_primary_color ?? DEFAULT_THEME_PRIMARY_COLOR,
      DEFAULT_THEME_PRIMARY_COLOR,
    ),
  };
}

export async function saveThemeSettings(
  db: SQLiteDatabase,
  settings: ThemeSettings,
): Promise<void> {
  await ensureSettingsRows(db);
  await db.runAsync(
    `UPDATE theme_settings
     SET theme_mode = $mode,
         theme_primary_color = $primaryColor
     WHERE id = 1`,
    {
      $mode: normalizeThemeMode(settings.mode),
      $primaryColor: normalizeThemeColor(
        settings.primaryColor,
        DEFAULT_THEME_PRIMARY_COLOR,
      ),
    },
  );
}
