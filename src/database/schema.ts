import type { SQLiteDatabase } from 'expo-sqlite';

type DatabaseTableSchema = {
  archiveColumns: readonly string[];
  columns: readonly string[];
  name: string;
};

export const DATABASE_TABLE_SCHEMAS = [
  {
    archiveColumns: [
      'id',
      'word',
      'meaning',
      'phonetic',
      'created_at',
      'updated_at',
      'is_active',
      'learning_status',
      'example_sentence',
      'example_source',
      'example_generated_at',
    ],
    columns: [
      'id',
      'word',
      'meaning',
      'phonetic',
      'created_at',
      'updated_at',
      'is_active',
      'learning_status',
      'example_sentence',
      'example_source',
      'example_generated_at',
    ],
    name: 'words',
  },
  {
    archiveColumns: [
      'id',
      'daily_word_limit',
      'listening_default_rate',
      'advance_on_mistakes',
      'listening_word_interval_seconds',
      'random_word_selection',
    ],
    columns: [
      'id',
      'daily_word_limit',
      'listening_default_rate',
      'advance_on_mistakes',
      'listening_word_interval_seconds',
      'random_word_selection',
    ],
    name: 'task_settings',
  },
  {
    archiveColumns: [
      'id',
      'last_review_prompt_study_day',
      'wrong_review_random',
      'review_reminder_enabled',
      'review_reminder_interval_days',
      'word_review_word_limit',
      'wrong_review_word_limit',
      'auto_remove_correct_wrong_review',
    ],
    columns: [
      'id',
      'last_review_prompt_study_day',
      'wrong_review_random',
      'review_reminder_enabled',
      'review_reminder_interval_days',
      'word_review_word_limit',
      'wrong_review_word_limit',
      'auto_remove_correct_wrong_review',
    ],
    name: 'review_settings',
  },
  {
    archiveColumns: ['id', 'ai_overwrite_examples'],
    columns: ['id', 'ai_overwrite_examples'],
    name: 'ai_settings',
  },
  {
    archiveColumns: ['id', 'theme_mode', 'theme_primary_color'],
    columns: ['id', 'theme_mode', 'theme_primary_color'],
    name: 'theme_settings',
  },
  {
    archiveColumns: [
      'id',
      'display_name',
      'bio',
      'avatar_data',
      'background_data',
      'card_content_color',
      'text_stroke_color',
      'text_stroke_width',
      'updated_at',
    ],
    columns: [
      'id',
      'display_name',
      'updated_at',
      'bio',
      'avatar_data',
      'background_data',
      'card_content_color',
      'text_stroke_color',
      'text_stroke_width',
    ],
    name: 'user_profile',
  },
  {
    archiveColumns: [
      'word_id',
      'first_learned_at',
      'last_learned_at',
      'learned_count',
    ],
    columns: [
      'word_id',
      'first_learned_at',
      'last_learned_at',
      'learned_count',
    ],
    name: 'word_learning_state',
  },
  {
    archiveColumns: [
      'word_id',
      'added_at',
      'last_wrong_at',
      'wrong_count',
      'sources',
    ],
    columns: ['word_id', 'added_at', 'last_wrong_at', 'wrong_count', 'sources'],
    name: 'wrong_book_words',
  },
  {
    archiveColumns: [
      'id',
      'completed_at',
      'study_date',
      'word_count',
      'wrong_count',
    ],
    columns: ['id', 'completed_at', 'study_date', 'word_count', 'wrong_count'],
    name: 'study_sessions',
  },
] as const satisfies readonly DatabaseTableSchema[];

export const ARCHIVE_TABLE_DEFINITIONS = DATABASE_TABLE_SCHEMAS.map(
  (table) => ({
    columns: table.archiveColumns,
    name: table.name,
  }),
);

export const ARCHIVE_INSERT_ORDER = DATABASE_TABLE_SCHEMAS.map(
  (table) => table.name,
);

export async function validateDatabaseSchema(
  db: SQLiteDatabase,
): Promise<void> {
  for (const table of DATABASE_TABLE_SCHEMAS) {
    const rows = await db.getAllAsync<{ name: string }>(
      `PRAGMA table_info(${table.name})`,
    );
    const actualColumns = rows.map((row) => row.name);
    const matches =
      actualColumns.length === table.columns.length &&
      actualColumns.every((column, index) => column === table.columns[index]);

    if (!matches) {
      throw new Error(
        `数据库表 ${table.name} 结构不匹配，请检查迁移和 schema 定义`,
      );
    }
  }
}
