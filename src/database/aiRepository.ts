import type { SQLiteDatabase } from 'expo-sqlite';

import { ensureSettingsRows } from './settingsRows';

export async function getAiOverwriteExamples(
  db: SQLiteDatabase,
): Promise<boolean> {
  const row = await db.getFirstAsync<{ ai_overwrite_examples: number }>(
    'SELECT ai_overwrite_examples FROM ai_settings WHERE id = 1',
  );
  return row?.ai_overwrite_examples === 1;
}

export async function setAiOverwriteExamples(
  db: SQLiteDatabase,
  overwrite: boolean,
): Promise<void> {
  await ensureSettingsRows(db);
  await db.runAsync(
    'UPDATE ai_settings SET ai_overwrite_examples = $overwrite WHERE id = 1',
    { $overwrite: overwrite ? 1 : 0 },
  );
}
