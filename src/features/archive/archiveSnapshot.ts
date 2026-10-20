import type { SQLiteDatabase } from 'expo-sqlite';

import {
  MAX_ARCHIVE_BYTES,
  MAX_ARCHIVE_IMAGE_LENGTH,
  MAX_ARCHIVE_ROWS_PER_TABLE,
  MAX_ARCHIVE_TEXT_LENGTH,
} from '@/constants/archive';
import {
  DEFAULT_PROFILE_CARD_CONTENT_COLOR,
  DEFAULT_PROFILE_TEXT_STROKE_COLOR,
  DEFAULT_PROFILE_TEXT_STROKE_WIDTH,
  PROFILE_USERNAME_MAX_LENGTH,
} from '@/constants/profile';
import {
  DEFAULT_THEME_MODE,
  DEFAULT_THEME_PRIMARY_COLOR,
  normalizeThemeColor,
} from '@/constants/theme';
import { ensureAppSettings } from '@/database/appSettings';
import { DATABASE_VERSION } from '@/database/database';
import {
  ARCHIVE_INSERT_ORDER as INSERT_ORDER,
  ARCHIVE_TABLE_DEFINITIONS as ARCHIVE_TABLES,
} from '@/database/schema';

const ARCHIVE_FORMAT = 'english-vocabulary-app-archive';
const ARCHIVE_VERSION = 1;
const LEGACY_DATABASE_VERSIONS = [10, 12, 13, 14, 15, 16, 17];
const MAX_ID = 1_000_000_000;

type ArchiveValue = number | string | null;
type ArchiveRow = Record<string, ArchiveValue>;

export type ArchiveSnapshot = {
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

const NULLABLE_COLUMNS = new Set(['words.example_generated_at']);

const INTEGER_RANGES: Record<string, readonly [number, number]> = {
  'app_settings.advance_on_mistakes': [0, 1],
  'app_settings.ai_overwrite_examples': [0, 1],
  'app_settings.auto_remove_correct_wrong_review': [0, 1],
  'app_settings.daily_word_limit': [5, 50],
  'app_settings.id': [1, 1],
  'app_settings.last_review_prompt_checkin': [0, MAX_ID],
  'app_settings.last_review_prompt_study_day': [0, MAX_ID],
  'app_settings.random_word_selection': [0, 1],
  'app_settings.review_reminder_enabled': [0, 1],
  'app_settings.review_reminder_interval_days': [1, 30],
  'app_settings.word_review_word_limit': [1, 100],
  'app_settings.wrong_review_random': [0, 1],
  'app_settings.wrong_review_word_limit': [1, 100],
  'study_sessions.id': [1, MAX_ID],
  'study_sessions.word_count': [0, MAX_ID],
  'study_sessions.wrong_count': [0, MAX_ID],
  'user_profile.id': [1, 1],
  'word_learning_state.learned_count': [0, MAX_ID],
  'word_learning_state.word_id': [1, MAX_ID],
  'words.id': [1, MAX_ID],
  'words.is_active': [0, 1],
  'wrong_book_words.word_id': [1, MAX_ID],
  'wrong_book_words.wrong_count': [0, MAX_ID],
};

const REAL_RANGES: Record<string, readonly [number, number]> = {
  'app_settings.listening_default_rate': [0.5, 2],
  'app_settings.listening_word_interval_seconds': [1, 10],
  'user_profile.text_stroke_width': [0, 5],
};

const NON_EMPTY_STRINGS = new Set([
  'study_sessions.completed_at',
  'study_sessions.study_date',
  'user_profile.display_name',
  'user_profile.updated_at',
  'word_learning_state.first_learned_at',
  'word_learning_state.last_learned_at',
  'words.created_at',
  'words.meaning',
  'words.updated_at',
  'words.word',
  'wrong_book_words.added_at',
  'wrong_book_words.last_wrong_at',
]);

const COLOR_COLUMNS = new Set([
  'app_settings.theme_primary_color',
  'user_profile.card_content_color',
  'user_profile.text_stroke_color',
]);

const IMAGE_COLUMNS = new Set([
  'user_profile.avatar_data',
  'user_profile.background_data',
]);

const PRIMARY_KEYS: Record<string, string> = {
  app_settings: 'id',
  study_sessions: 'id',
  user_profile: 'id',
  word_learning_state: 'word_id',
  words: 'id',
  wrong_book_words: 'word_id',
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

  await db.withTransactionAsync(async () => {
    for (const table of ARCHIVE_TABLES) {
      tables[table.name] = await db.getAllAsync<ArchiveRow>(
        `SELECT ${table.columns.join(', ')} FROM ${table.name}`,
      );
    }
  });

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
  if (content.length > MAX_ARCHIVE_BYTES) {
    throw new Error('存档文件超过 20 MB，已拒绝读取');
  }

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

  const databaseVersion = archive.databaseVersion;
  const tables: Record<string, ArchiveRow[]> = {};
  for (const table of ARCHIVE_TABLES) {
    const rows = (archive.tables as Record<string, unknown>)[table.name];
    if (!Array.isArray(rows)) {
      throw new Error(`存档缺少数据表：${table.name}`);
    }
    if (rows.length > MAX_ARCHIVE_ROWS_PER_TABLE) {
      throw new Error(
        `${table.name} 超过 ${MAX_ARCHIVE_ROWS_PER_TABLE} 行上限`,
      );
    }

    tables[table.name] = rows.map((row, rowIndex) => {
      if (!row || typeof row !== 'object') {
        throw new Error(`${table.name} 第 ${rowIndex + 1} 行格式错误`);
      }

      const source = row as Record<string, unknown>;
      const normalized: ArchiveRow = {};
      for (const column of table.columns) {
        const legacyDefault = getLegacyColumnDefault(
          table.name,
          column,
          source,
          databaseVersion,
        );
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

  validateArchiveTables(tables);

  return {
    createdAt:
      typeof archive.createdAt === 'string'
        ? archive.createdAt
        : new Date(0).toISOString(),
    databaseVersion,
    format: ARCHIVE_FORMAT,
    summary: buildSummary(tables),
    tables,
    version: ARCHIVE_VERSION,
  };
}

function getLegacyColumnDefault(
  tableName: string,
  column: string,
  source: Record<string, unknown>,
  databaseVersion: number,
): ArchiveValue | undefined {
  if (tableName === 'app_settings') {
    if (column === 'theme_mode' && databaseVersion < 15) {
      return DEFAULT_THEME_MODE;
    }
    if (column === 'theme_primary_color' && databaseVersion < 17) {
      if (source.theme_mode === 'custom') {
        const legacyColor =
          source.theme_surface_color ?? source.theme_accent_color;
        return typeof legacyColor === 'string'
          ? normalizeThemeColor(legacyColor, DEFAULT_THEME_PRIMARY_COLOR)
          : DEFAULT_THEME_PRIMARY_COLOR;
      }
      return DEFAULT_THEME_PRIMARY_COLOR;
    }
  }

  if (tableName === 'user_profile') {
    if (
      databaseVersion < 12 &&
      ['bio', 'avatar_data', 'background_data'].includes(column)
    ) {
      return '';
    }
    if (databaseVersion < 13 && column === 'card_content_color') {
      return DEFAULT_PROFILE_CARD_CONTENT_COLOR;
    }
    if (databaseVersion < 14 && column === 'text_stroke_color') {
      return DEFAULT_PROFILE_TEXT_STROKE_COLOR;
    }
    if (databaseVersion < 14 && column === 'text_stroke_width') {
      return DEFAULT_PROFILE_TEXT_STROKE_WIDTH;
    }
  }
  return undefined;
}

function validateArchiveTables(
  tables: Record<string, ArchiveRow[]>,
): void {
  for (const table of ARCHIVE_TABLES) {
    const rows = tables[table.name] ?? [];
    const primaryKey = PRIMARY_KEYS[table.name];
    const primaryValues = new Set<ArchiveValue>();

    rows.forEach((row, rowIndex) => {
      for (const column of table.columns) {
        validateArchiveValue(
          table.name,
          column,
          row[column],
          rowIndex,
        );
      }

      if (primaryKey) {
        const primaryValue = row[primaryKey];
        if (primaryValues.has(primaryValue)) {
          throw new Error(
            `${table.name} 第 ${rowIndex + 1} 行主键重复`,
          );
        }
        primaryValues.add(primaryValue);
      }
    });
  }

  if ((tables.app_settings?.length ?? 0) > 1) {
    throw new Error('app_settings 只能包含一行');
  }
  if ((tables.user_profile?.length ?? 0) > 1) {
    throw new Error('user_profile 只能包含一行');
  }

  const words = tables.words ?? [];
  const wordIds = new Set(words.map((row) => row.id));
  const wrongWordIds = new Set(
    (tables.wrong_book_words ?? []).map((row) => row.word_id),
  );

  for (const tableName of ['word_learning_state', 'wrong_book_words']) {
    for (const [rowIndex, row] of (tables[tableName] ?? []).entries()) {
      if (!wordIds.has(row.word_id)) {
        throw new Error(
          `${tableName} 第 ${rowIndex + 1} 行引用了不存在的单词`,
        );
      }
    }
  }

  for (const [rowIndex, word] of words.entries()) {
    if (
      word.learning_status === 'wrong' &&
      !wrongWordIds.has(word.id)
    ) {
      throw new Error(
        `words 第 ${rowIndex + 1} 行错题状态缺少错题记录`,
      );
    }
  }
}

function validateArchiveValue(
  tableName: string,
  column: string,
  value: ArchiveValue | undefined,
  rowIndex: number,
): void {
  const field = `${tableName}.${column}`;
  const rowLabel = `${tableName} 第 ${rowIndex + 1} 行字段 ${column}`;

  if (value === null) {
    if (!NULLABLE_COLUMNS.has(field)) {
      throw new Error(`${rowLabel} 不能为空`);
    }
    return;
  }
  if (value === undefined) {
    throw new Error(`${rowLabel} 缺失`);
  }

  const integerRange = INTEGER_RANGES[field];
  if (integerRange) {
    if (
      typeof value !== 'number' ||
      !Number.isInteger(value) ||
      value < integerRange[0] ||
      value > integerRange[1]
    ) {
      throw new Error(`${rowLabel} 不是有效整数`);
    }
    return;
  }

  const realRange = REAL_RANGES[field];
  if (realRange) {
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      value < realRange[0] ||
      value > realRange[1]
    ) {
      throw new Error(`${rowLabel} 不是有效数值`);
    }
    return;
  }

  if (typeof value !== 'string') {
    throw new Error(`${rowLabel} 必须是文本`);
  }

  if (NON_EMPTY_STRINGS.has(field) && value.trim().length === 0) {
    throw new Error(`${rowLabel} 不能为空`);
  }

  const maxLength = IMAGE_COLUMNS.has(field)
    ? MAX_ARCHIVE_IMAGE_LENGTH
    : MAX_ARCHIVE_TEXT_LENGTH;
  if (value.length > maxLength) {
    throw new Error(`${rowLabel} 超过长度上限`);
  }

  if (COLOR_COLUMNS.has(field) && !/^#[0-9A-F]{6}$/i.test(value)) {
    throw new Error(`${rowLabel} 不是有效颜色`);
  }
  if (
    field === 'app_settings.theme_mode' &&
    !['day', 'night', 'custom'].includes(value)
  ) {
    throw new Error(`${rowLabel} 不是有效主题模式`);
  }
  if (
    field === 'words.learning_status' &&
    !['unlearned', 'learned', 'wrong'].includes(value)
  ) {
    throw new Error(`${rowLabel} 不是有效学习状态`);
  }
  if (
    field === 'words.example_source' &&
    !['', 'csv', 'ai'].includes(value)
  ) {
    throw new Error(`${rowLabel} 不是有效例句来源`);
  }
  if (field === 'wrong_book_words.sources') {
    validateWrongBookSources(value, rowLabel);
  }
  if (
    field === 'user_profile.display_name' &&
    Array.from(value).length > PROFILE_USERNAME_MAX_LENGTH
  ) {
    throw new Error(`${rowLabel} 超过用户名长度上限`);
  }
  if (IMAGE_COLUMNS.has(field) && value !== '') {
    const imagePattern =
      /^data:image\/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/;
    if (!imagePattern.test(value)) {
      throw new Error(`${rowLabel} 不是受支持的本地图片`);
    }
  }
}

function validateWrongBookSources(value: string, rowLabel: string): void {
  if (value === '') {
    return;
  }

  const sources = value.split(',');
  const allowedSources = new Set(['fill', 'listening', 'manual']);
  if (
    sources.some((source) => !allowedSources.has(source)) ||
    new Set(sources).size !== sources.length
  ) {
    throw new Error(`${rowLabel} 包含无效来源`);
  }
}

export function stringifyArchive(snapshot: ArchiveSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}

export async function restoreArchiveSnapshot(
  db: SQLiteDatabase,
  snapshot: ArchiveSnapshot,
): Promise<void> {
  validateArchiveTables(snapshot.tables);

  await db.withTransactionAsync(async () => {
    await db.execAsync(`
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

        await db.runAsync(
          `INSERT INTO ${tableName} (${table.columns.join(', ')})
           VALUES (${placeholders.join(', ')})`,
          params,
        );
      }
    }

    await ensureAppSettings(db);
  });
}
