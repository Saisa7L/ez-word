import type { SQLiteDatabase } from 'expo-sqlite';

export type UserProfile = {
  displayName: string;
  updatedAt: string;
};

export async function getUserProfile(
  db: SQLiteDatabase,
): Promise<UserProfile> {
  const row = await db.getFirstAsync<{
    display_name: string;
    updated_at: string;
  }>(
    `SELECT display_name, updated_at
     FROM user_profile
     WHERE id = 1`,
  );

  return {
    displayName: row?.display_name ?? 'User',
    updatedAt: row?.updated_at ?? new Date(0).toISOString(),
  };
}

export async function updateDisplayName(
  db: SQLiteDatabase,
  displayName: string,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO user_profile (id, display_name, updated_at)
     VALUES (1, $displayName, $updatedAt)
     ON CONFLICT(id) DO UPDATE SET
       display_name = excluded.display_name,
       updated_at = excluded.updated_at`,
    {
      $displayName: displayName.trim(),
      $updatedAt: new Date().toISOString(),
    },
  );
}
