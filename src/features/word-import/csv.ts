import Papa from 'papaparse';

import {
  CsvValidationError,
  type CsvColumns,
  type RejectedImportRow,
  type WordCsvPreview,
  type WordImportRow,
} from './types';

type RequiredColumn = 'word' | 'meaning' | 'phonetic';

const REQUIRED_COLUMNS: RequiredColumn[] = ['word', 'meaning', 'phonetic'];

const HEADER_ALIASES: Record<RequiredColumn, string[]> = {
  word: ['word', '单词'],
  meaning: ['meaning', '释义', '中文释义'],
  phonetic: ['phonetic', '音标'],
};

const EXAMPLE_HEADER_ALIASES = ['example', 'sentence', '例句'];

function normalizeHeader(header: string): string {
  return header.replace(/^\uFEFF/, '').trim().toLowerCase();
}

function cleanCell(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function resolveColumn(fields: string[], column: RequiredColumn): string | undefined {
  const aliases = HEADER_ALIASES[column];
  return fields.find((field) => aliases.includes(field));
}

export function parseWordCsv(content: string): WordCsvPreview {
  const parsed = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: normalizeHeader,
  });

  const syntaxError = parsed.errors.find((error) => error.type !== 'FieldMismatch');
  if (syntaxError) {
    const rowText = syntaxError.row === undefined ? '' : `，第 ${syntaxError.row + 1} 行`;
    throw new CsvValidationError(`CSV 格式错误${rowText}：${syntaxError.message}`);
  }

  const fields = parsed.meta.fields ?? [];
  const columns = {
    example: fields.find((field) =>
      EXAMPLE_HEADER_ALIASES.includes(field),
    ),
    word: resolveColumn(fields, 'word'),
    meaning: resolveColumn(fields, 'meaning'),
    phonetic: resolveColumn(fields, 'phonetic'),
  };

  const missingColumns = REQUIRED_COLUMNS.filter((column) => !columns[column]);
  if (missingColumns.length > 0) {
    const labels = missingColumns.map((column) => HEADER_ALIASES[column][0]).join('、');
    throw new CsvValidationError(`CSV 缺少必要列：${labels}`);
  }

  const resolvedColumns: CsvColumns = {
    example: columns.example,
    word: columns.word!,
    meaning: columns.meaning!,
    phonetic: columns.phonetic!,
  };

  const validRows: WordImportRow[] = [];
  const rejectedRows: RejectedImportRow[] = [];
  const seenWords = new Set<string>();

  parsed.data.forEach((row, index) => {
    const rowNumber = index + 2;
    const word = cleanCell(row[resolvedColumns.word]);
    const meaning = cleanCell(row[resolvedColumns.meaning]);
    const phonetic = cleanCell(row[resolvedColumns.phonetic]);
    const example = resolvedColumns.example
      ? cleanCell(row[resolvedColumns.example])
      : '';

    if (!word && !meaning && !phonetic) {
      return;
    }

    if (!word) {
      rejectedRows.push({ rowNumber, reason: '缺少单词' });
      return;
    }

    if (!meaning) {
      rejectedRows.push({ rowNumber, reason: '缺少释义' });
      return;
    }

    const normalizedWord = word.toLocaleLowerCase('en-US');
    if (seenWords.has(normalizedWord)) {
      rejectedRows.push({ rowNumber, reason: `单词重复：${word}` });
      return;
    }

    seenWords.add(normalizedWord);
    validRows.push({
      example_sentence: example,
      word,
      meaning,
      phonetic,
    });
  });

  return {
    columns: resolvedColumns,
    rejectedRows,
    totalRows: parsed.data.length,
    validRows,
  };
}
