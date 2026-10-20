import type { SQLiteDatabase } from 'expo-sqlite';

import { MIGRATIONS, runMigrations } from './migrations';
import { validateDatabaseSchema } from './schema';
import { ensureSettingsRows } from './settingsRows';

export const DATABASE_NAME = 'vocabulary.db';

export const DATABASE_VERSION = MIGRATIONS[MIGRATIONS.length - 1]?.to ?? 0;

export async function migrateDatabase(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  const versionRow = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version',
  );
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion > DATABASE_VERSION) {
    throw new Error(
      `数据库版本 ${currentVersion} 高于 App 支持的 ${DATABASE_VERSION}`,
    );
  }

  const supportedVersions = new Set<number>([
    0,
    ...MIGRATIONS.map((migration) => migration.to),
  ]);
  if (!supportedVersions.has(currentVersion)) {
    throw new Error(`不支持的数据库版本：${currentVersion}`);
  }

  if (currentVersion < DATABASE_VERSION) {
    await runMigrations(db, currentVersion);
  }

  await validateDatabaseSchema(db);
  await ensureSettingsRows(db);
}
