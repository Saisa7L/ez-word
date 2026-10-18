import type { SQLiteDatabase } from 'expo-sqlite';

import {
  DEFAULT_PROFILE_CARD_CONTENT_COLOR,
  DEFAULT_PROFILE_TEXT_STROKE_COLOR,
  DEFAULT_PROFILE_TEXT_STROKE_WIDTH,
} from '@/constants/profile';
import { DATABASE_VERSION } from '@/database/database';

const ARCHIVE_FORMAT = 'english-vocabulary-app-archive';
const ARCHIVE_VERSION = 1;
const LEGACY_DATABASE_VERSIONS = [12, 13];

type ArchiveValue = number | string | null;
type ArchiveRow = Record<string, ArchiveValue>;

type ArchiveTable = {
  columns: string[];
  name: string;
};

type ArchiveSnapshot = {
  createdAt: string;
  databaseVersion: number;
  format: typeof ARCHIVE_FORMAT;
  summary: ArchiveSummary;
  tables: Record<string, ArchiveRow[]>;
  version: typeof ARCHIVE_VERSION;
};

export type ArchiveSummary = {
  checkins: number;
  displayName: string;
  learnedWords: number;
  wrongWords: number;
  words: number;
};

const ARCHIVE_TABLES: ArchiveTable[] = [
  {
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
    columns: [
      'id',
      'daily_word_limit',
      'listening_default_rate',
      'advance_on_mistakes',
      'listening_word_interval_seconds',
      'random_word_selection',
      'last_review_prompt_checkin',
      'wrong_review_random',
      'review_reminder_enabled',
      'review_reminder_interval_days',
      'last_review_prompt_study_day',
      'word_review_word_limit',
      'wrong_review_word_limit',
      'auto_remove_correct_wrong_review',
      'ai_overwrite_examples',
    ],
    name: 'app_settings',
  },
  {
    columns: [
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
    name: 'user_profile',
  },
  {
    columns: [
      'word_id',
      'first_learned_at',
      'last_learned_at',
      'learned_count',
    ],
    name: 'word_learning_state',
  },
  {
    columns: [
      'word_id',
      'added_at',
      'last_wrong_at',
      'wrong_count',
      'sources',
    ],
    name: 'wrong_book_words',
  },
  {
    columns: ['id', 'completed_at', 'study_date', 'word_count', 'wrong_count'],
    name: 'study_sessions',
  },
];

const INSERT_ORDER = [
  'words',
  'app_settings',
  'user_profile',
  'word_learning_state',
  'wrong_book_words',
  'study_sessions',
];

function buildSummary(
  tables: Record<string, ArchiveRow[]>,
): ArchiveSummary {
  return {
    checkins: tables.study_sessions?.length ?? 0,
    displayName: String(tables.user_profile?.[0]?.display_name ?? 'User'),
    learnedWords: tables.word_learning_state?.length ?? 0,
    words: tables.words?.length ?? 0,
    wrongWords: tables.wrong_book_words?.length ?? 0,
  };
}

export async function createArchiveSnapshot(
  db: SQLiteDatabase,
): Promise<ArchiveSnapshot> {
  const tables: Record<string, ArchiveRow[]> = {};

  for (const table of ARCHIVE_TABLES) {
    tables[table.name] = await db.getAllAsync<ArchiveRow>(
      `SELECT ${table.columns.join(', ')} FROM ${table.name}`,
    );
  }

  return {
    createdAt: new Date().toISOString(),
    databaseVersion: DATABASE_VERSION,
    format: ARCHIVE_FORMAT,
    summary: buildSummary(tables),
    tables,
    version: ARCHIVE_VERSION,
  };
}

function isArchiveValue(value: unknown): value is ArchiveValue {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number'
  );
}

export function parseArchiveSnapshot(content: string): ArchiveSnapshot {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('存档文件不是有效的 JSON');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('存档文件格式不正确');
  }

  const archive = parsed as Partial<ArchiveSnapshot>;
  if (archive.format !== ARCHIVE_FORMAT) {
    throw new Error('不是本 App 的存档文件');
  }
  if (archive.version !== ARCHIVE_VERSION) {
    throw new Error('存档版本不受支持');
  }
  if (
    typeof archive.databaseVersion !== 'number' ||
    ![
      ...LEGACY_DATABASE_VERSIONS,
      DATABASE_VERSION,
    ].includes(archive.databaseVersion)
  ) {
    throw new Error('存档数据库版本与当前 App 不匹配');
  }
  if (!archive.tables || typeof archive.tables !== 'object') {
    throw new Error('存档缺少数据表');
  }

  const tables: Record<string, ArchiveRow[]> = {};
  for (const table of ARCHIVE_TABLES) {
    const rows = (archive.tables as Record<string, unknown>)[table.name];
    if (!Array.isArray(rows)) {
      throw new Error(`存档缺少数据表：${table.name}`);
    }

    tables[table.name] = rows.map((row, rowIndex) => {
      if (!row || typeof row !== 'object') {
        throw new Error(`${table.name} 第 ${rowIndex + 1} 行格式错误`);
      }

      const source = row as Record<string, unknown>;
      const normalized: ArchiveRow = {};
      for (const column of table.columns) {
        const legacyDefault = getLegacyProfileDefault(column);
        const value =
          source[column] === undefined &&
          table.name === 'user_profile' &&
          legacyDefault !== undefined
            ? legacyDefault
            : source[column];
        if (!isArchiveValue(value)) {
          throw new Error(
            `${table.name} 第 ${rowIndex + 1} 行缺少字段 ${column}`,
          );
        }
        normalized[column] = value;
      }
      return normalized;
    });
  }

  return {
    createdAt:
      typeof archive.createdAt === 'string'
        ? archive.createdAt
        : new Date(0).toISOString(),
    databaseVersion: archive.databaseVersion,
    format: ARCHIVE_FORMAT,
    summary: buildSummary(tables),
    tables,
    version: ARCHIVE_VERSION,
  };
}

function getLegacyProfileDefault(
  column: string,
): ArchiveValue | undefined {
  if (column === 'card_content_color') {
    return DEFAULT_PROFILE_CARD_CONTENT_COLOR;
  }
  if (column === 'text_stroke_color') {
    return DEFAULT_PROFILE_TEXT_STROKE_COLOR;
  }
  if (column === 'text_stroke_width') {
    return DEFAULT_PROFILE_TEXT_STROKE_WIDTH;
  }
  return undefined;
}

export function stringifyArchive(snapshot: ArchiveSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}

export async function restoreArchiveSnapshot(
  db: SQLiteDatabase,
  snapshot: ArchiveSnapshot,
): Promise<void> {
  await db.withExclusiveTransactionAsync(async (transaction) => {
    await transaction.execAsync(`
      DELETE FROM wrong_book_words;
      DELETE FROM word_learning_state;
      DELETE FROM study_sessions;
      DELETE FROM words;
      DELETE FROM app_settings;
      DELETE FROM user_profile;
      DELETE FROM sqlite_sequence
      WHERE name IN ('words', 'study_sessions');
    `);

    for (const tableName of INSERT_ORDER) {
      const table = ARCHIVE_TABLES.find((item) => item.name === tableName);
      if (!table) {
        continue;
      }

      for (const row of snapshot.tables[tableName] ?? []) {
        const placeholders = table.columns.map(
          (_, index) => `$value${index}`,
        );
        const params: Record<string, ArchiveValue> = {};
        table.columns.forEach((column, index) => {
          params[`$value${index}`] = row[column] ?? null;
        });

        await transaction.runAsync(
          `INSERT INTO ${tableName} (${table.columns.join(', ')})
           VALUES (${placeholders.join(', ')})`,
          params,
        );
      }
    }
  });
}
