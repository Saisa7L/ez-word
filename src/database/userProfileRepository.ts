import type { SQLiteDatabase } from 'expo-sqlite';

import {
  DEFAULT_PROFILE_CARD_CONTENT_COLOR,
  DEFAULT_PROFILE_TEXT_STROKE_COLOR,
  DEFAULT_PROFILE_TEXT_STROKE_WIDTH,
  PROFILE_USERNAME_MAX_LENGTH,
  PROFILE_TEXT_STROKE_MAX_WIDTH,
} from '@/constants/profile';

export type UserProfile = {
  avatarData: string;
  backgroundData: string;
  bio: string;
  cardContentColor: string;
  displayName: string;
  textStrokeColor: string;
  textStrokeWidth: number;
  updatedAt: string;
};

export async function getUserProfile(
  db: SQLiteDatabase,
): Promise<UserProfile> {
  const row = await db.getFirstAsync<{
    avatar_data: string;
    background_data: string;
    bio: string;
    card_content_color: string;
    display_name: string;
    text_stroke_color: string;
    text_stroke_width: number;
    updated_at: string;
  }>(
    `SELECT display_name, bio, avatar_data, background_data,
            card_content_color, text_stroke_color, text_stroke_width,
            updated_at
     FROM user_profile
     WHERE id = 1`,
  );

  return {
    avatarData: row?.avatar_data ?? '',
    backgroundData: row?.background_data ?? '',
    bio: row?.bio ?? '',
    cardContentColor:
      row?.card_content_color ?? DEFAULT_PROFILE_CARD_CONTENT_COLOR,
    displayName: (row?.display_name ?? 'User').slice(
      0,
      PROFILE_USERNAME_MAX_LENGTH,
    ),
    textStrokeColor:
      row?.text_stroke_color ?? DEFAULT_PROFILE_TEXT_STROKE_COLOR,
    textStrokeWidth: Math.min(
      PROFILE_TEXT_STROKE_MAX_WIDTH,
      Math.max(
        0,
        row?.text_stroke_width ?? DEFAULT_PROFILE_TEXT_STROKE_WIDTH,
      ),
    ),
    updatedAt: row?.updated_at ?? new Date(0).toISOString(),
  };
}

export async function updateUserProfile(
  db: SQLiteDatabase,
  profile: {
    avatarData: string;
    backgroundData: string;
    bio: string;
    cardContentColor: string;
    displayName: string;
    textStrokeColor: string;
    textStrokeWidth: number;
  },
): Promise<void> {
  await db.runAsync(
    `INSERT INTO user_profile (
       id,
       display_name,
       bio,
       avatar_data,
       background_data,
       card_content_color,
       text_stroke_color,
       text_stroke_width,
       updated_at
     )
     VALUES (
       1,
       $displayName,
       $bio,
       $avatarData,
       $backgroundData,
       $cardContentColor,
       $textStrokeColor,
       $textStrokeWidth,
       $updatedAt
     )
     ON CONFLICT(id) DO UPDATE SET
       display_name = excluded.display_name,
       bio = excluded.bio,
       avatar_data = excluded.avatar_data,
       background_data = excluded.background_data,
       card_content_color = excluded.card_content_color,
       text_stroke_color = excluded.text_stroke_color,
       text_stroke_width = excluded.text_stroke_width,
       updated_at = excluded.updated_at`,
    {
      $avatarData: profile.avatarData,
      $backgroundData: profile.backgroundData,
      $bio: profile.bio.trim(),
      $cardContentColor:
        profile.cardContentColor || DEFAULT_PROFILE_CARD_CONTENT_COLOR,
      $displayName: profile.displayName
        .trim()
        .slice(0, PROFILE_USERNAME_MAX_LENGTH),
      $textStrokeColor:
        profile.textStrokeColor || DEFAULT_PROFILE_TEXT_STROKE_COLOR,
      $textStrokeWidth: Math.max(
        0,
        Math.min(
          PROFILE_TEXT_STROKE_MAX_WIDTH,
          profile.textStrokeWidth ?? DEFAULT_PROFILE_TEXT_STROKE_WIDTH,
        ),
      ),
      $updatedAt: new Date().toISOString(),
    },
  );
}
