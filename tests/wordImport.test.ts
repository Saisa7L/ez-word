import assert from 'node:assert/strict';
import test from 'node:test';

import { parseWordCsv } from '../src/features/word-import/csv';
import { importWordCsv } from '../src/features/word-import/importWordCsv';
import { CsvValidationError } from '../src/features/word-import/types';
import { asDatabase, createMigratedAdapter } from './helpers/nodeSqlite';

test('parses a CSV with English headers', () => {
  const preview = parseWordCsv(
    'word,meaning,phonetic,example\nalpha,阿尔法,/ˈælfə/,Alpha is first.\n',
  );

  assert.deepEqual(preview.columns, {
    example: 'example',
    meaning: 'meaning',
    phonetic: 'phonetic',
    word: 'word',
  });
  assert.equal(preview.totalRows, 1);
  assert.deepEqual(preview.rejectedRows, []);
  assert.deepEqual(preview.validRows, [
    {
      example_sentence: 'Alpha is first.',
      meaning: '阿尔法',
      phonetic: '/ˈælfə/',
      word: 'alpha',
    },
  ]);
});

test('accepts Chinese headers, BOM and padded casing', () => {
  const preview = parseWordCsv(
    '\uFEFF  Word , MEANING ,音标, 例句 \nalpha,阿尔法,/ˈælfə/,Alpha wins.\n',
  );

  assert.deepEqual(preview.columns, {
    example: '例句',
    meaning: 'meaning',
    phonetic: '音标',
    word: 'word',
  });
  assert.equal(preview.validRows.length, 1);
  assert.equal(preview.validRows[0]?.example_sentence, 'Alpha wins.');
});

test('treats the example column as optional', () => {
  const preview = parseWordCsv('word,meaning,phonetic\nalpha,阿尔法,/ˈælfə/');

  assert.equal(preview.columns.example, undefined);
  assert.equal(preview.validRows[0]?.example_sentence, '');
});

test('rejects a CSV that misses required columns', () => {
  assert.throws(
    () => parseWordCsv('word,meaning\nalpha,阿尔法'),
    (error: unknown) =>
      error instanceof CsvValidationError &&
      error.message === 'CSV 缺少必要列：phonetic',
  );
  assert.throws(
    () => parseWordCsv('word,phonetic\nalpha,/a/'),
    (error: unknown) =>
      error instanceof CsvValidationError &&
      error.message === 'CSV 缺少必要列：meaning',
  );
});

test('reports a delimiter error before the missing-column check on one-column files', () => {
  assert.throws(
    () => parseWordCsv('word\nalpha'),
    (error: unknown) =>
      error instanceof CsvValidationError &&
      /^CSV 格式错误：Unable to auto-detect delimiting character/.test(
        error.message,
      ),
  );
});

test('reports syntax errors with the offending row number', () => {
  assert.throws(
    () => parseWordCsv('word,meaning,phonetic\nalpha,阿尔法,"/ˈælfə/'),
    (error: unknown) =>
      error instanceof CsvValidationError &&
      /^CSV 格式错误，第 2 行：/.test(error.message),
  );
});

test('reports syntax errors without a row number when the row is unknown', () => {
  assert.throws(
    () => parseWordCsv('word,meaning,phonetic\nalpha,阿尔法,"/ˈælfə/'),
    /CSV 格式错误/,
  );
});

test('rejects rows without a word or meaning', () => {
  const preview = parseWordCsv(
    'word,meaning,phonetic\n,阿尔法,/a/\nalpha,,/b/\nbeta,贝塔,/c/',
  );

  assert.deepEqual(preview.rejectedRows, [
    { reason: '缺少单词', rowNumber: 2 },
    { reason: '缺少释义', rowNumber: 3 },
  ]);
  assert.deepEqual(
    preview.validRows.map((row) => row.word),
    ['beta'],
  );
  assert.equal(preview.totalRows, 3);
});

test('skips rows whose three core cells are all empty', () => {
  const preview = parseWordCsv(
    'word,meaning,phonetic,example\n,,,only example survives\nalpha,阿尔法,/a/,Alpha runs.',
  );

  assert.equal(preview.totalRows, 2);
  assert.deepEqual(preview.rejectedRows, []);
  assert.deepEqual(
    preview.validRows.map((row) => row.word),
    ['alpha'],
  );
});

test('rejects duplicated words case-insensitively', () => {
  const preview = parseWordCsv(
    'word,meaning,phonetic\nalpha,阿尔法,/a/\nALPHA,阿尔法,/b/',
  );

  assert.deepEqual(preview.rejectedRows, [
    { reason: '单词重复：ALPHA', rowNumber: 3 },
  ]);
  assert.deepEqual(
    preview.validRows.map((row) => row.word),
    ['alpha'],
  );
});

test('trims cells and ignores field-count mismatches', () => {
  const preview = parseWordCsv(
    'word,meaning,phonetic\n  alpha  ,  阿尔法  ,  /a/  ,extra',
  );

  assert.equal(preview.validRows.length, 1);
  assert.deepEqual(preview.validRows[0], {
    example_sentence: '',
    meaning: '阿尔法',
    phonetic: '/a/',
    word: 'alpha',
  });
});

test('imports CSV rows into the database', async () => {
  const adapter = await createMigratedAdapter();
  const db = asDatabase(adapter);

  const summary = await importWordCsv(
    db,
    'word,meaning,phonetic,example\nalpha,阿尔法,/ˈælfə/,Alpha runs.\n,,,/only/',
  );

  assert.deepEqual(summary, {
    inserted: 1,
    rejectedRows: [],
    totalRows: 2,
    updated: 0,
  });

  const rows = adapter.db
    .prepare(
      `SELECT word, meaning, phonetic, example_sentence, example_source
       FROM words`,
    )
    .all() as {
    example_sentence: string;
    example_source: string;
    meaning: string;
    phonetic: string;
    word: string;
  }[];
  assert.deepEqual(
    rows.map((row) => ({ ...row })),
    [
      {
        example_sentence: 'Alpha runs.',
        example_source: 'csv',
        meaning: '阿尔法',
        phonetic: '/ˈælfə/',
        word: 'alpha',
      },
    ],
  );
});

test('re-importing updates rows and keeps earlier examples', async () => {
  const adapter = await createMigratedAdapter();
  const db = asDatabase(adapter);

  await importWordCsv(
    db,
    'word,meaning,phonetic,example\nalpha,阿尔法,/a/,Alpha runs.\nbeta,贝塔,/b/,',
  );
  adapter.db.exec("UPDATE words SET is_active = 0 WHERE word = 'alpha'");

  const summary = await importWordCsv(
    db,
    'word,meaning,phonetic\nalpha,阿尔法二号,/a2/\nbeta,贝塔二号,/b2/',
  );

  assert.deepEqual(summary, {
    inserted: 0,
    rejectedRows: [],
    totalRows: 2,
    updated: 2,
  });

  const rows = adapter.db
    .prepare(
      `SELECT word, meaning, phonetic, example_sentence, is_active
       FROM words
       ORDER BY word`,
    )
    .all() as {
    example_sentence: string;
    is_active: number;
    meaning: string;
    phonetic: string;
    word: string;
  }[];
  assert.deepEqual(
    rows.map((row) => ({ ...row })),
    [
      {
        example_sentence: 'Alpha runs.',
        is_active: 1,
        meaning: '阿尔法二号',
        phonetic: '/a2/',
        word: 'alpha',
      },
      {
        example_sentence: '',
        is_active: 1,
        meaning: '贝塔二号',
        phonetic: '/b2/',
        word: 'beta',
      },
    ],
  );
});

test('propagates rejected rows from the import summary', async () => {
  const adapter = await createMigratedAdapter();

  const summary = await importWordCsv(
    asDatabase(adapter),
    'word,meaning,phonetic\nalpha,阿尔法,/a/\nalpha,阿尔法,/b/',
  );

  assert.equal(summary.inserted, 1);
  assert.deepEqual(summary.rejectedRows, [
    { reason: '单词重复：alpha', rowNumber: 3 },
  ]);
});
