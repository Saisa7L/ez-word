import type { SQLiteDatabase } from 'expo-sqlite';

const SETTINGS_TABLES = [
  'task_settings',
  'review_settings',
  'ai_settings',
  'theme_settings',
] as const;

export async function ensureSettingsRows(
  db: Pick<SQLiteDatabase, 'runAsync'>,
): Promise<void> {
  for (const table of SETTINGS_TABLES) {
    await db.runAsync(`INSERT OR IGNORE INTO ${table} (id) VALUES (1)`);
  }
}
