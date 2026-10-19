import type { SQLiteDatabase } from 'expo-sqlite';

import {
  DEFAULT_PROFILE_CARD_CONTENT_COLOR,
  DEFAULT_PROFILE_TEXT_STROKE_COLOR,
  DEFAULT_PROFILE_TEXT_STROKE_WIDTH,
} from '@/constants/profile';
import {
  DEFAULT_THEME_PRIMARY_COLOR,
  DEFAULT_THEME_MODE,
} from '@/constants/theme';
import { DATABASE_VERSION } from '@/database/database';
import {
  ARCHIVE_INSERT_ORDER as INSERT_ORDER,
  ARCHIVE_TABLE_DEFINITIONS as ARCHIVE_TABLES,
} from '@/database/schema';

const ARCHIVE_FORMAT = 'english-vocabulary-app-archive';
const ARCHIVE_VERSION = 1;
const LEGACY_DATABASE_VERSIONS = [10, 12, 13, 14, 15, 16];

type ArchiveValue = number | string | null;
type ArchiveRow = Record<string, ArchiveValue>;

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
        const legacyDefault = getLegacyColumnDefault(table.name, column);
        const value =
          source[column] === undefined &&
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

function getLegacyColumnDefault(
  tableName: string,
  column: string,
): ArchiveValue | undefined {
  if (tableName === 'app_settings') {
    if (column === 'theme_mode') {
      return DEFAULT_THEME_MODE;
    }
    if (column === 'theme_primary_color') {
      return DEFAULT_THEME_PRIMARY_COLOR;
    }
  }

  if (
    tableName === 'user_profile' &&
    ['bio', 'avatar_data', 'background_data'].includes(column)
  ) {
    return '';
  }
  if (
    tableName === 'user_profile' &&
    column === 'card_content_color'
  ) {
    return DEFAULT_PROFILE_CARD_CONTENT_COLOR;
  }
  if (
    tableName === 'user_profile' &&
    column === 'text_stroke_color'
  ) {
    return DEFAULT_PROFILE_TEXT_STROKE_COLOR;
  }
  if (
    tableName === 'user_profile' &&
    column === 'text_stroke_width'
  ) {
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
