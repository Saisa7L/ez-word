import { File } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';

import { upsertWords } from '@/database/wordsRepository';

import { parseWordCsv } from './csv';
import {
  CsvValidationError,
  type PickedCsvFile,
  type WordImportSummary,
} from './types';

const CSV_MIME_TYPES = [
  'text/csv',
  'text/comma-separated-values',
  'application/csv',
  'application/vnd.ms-excel',
  'text/plain',
];

export async function pickWordCsvFile(): Promise<PickedCsvFile | null> {
  const result = await File.pickFileAsync({
    mimeTypes: CSV_MIME_TYPES,
  });

  if (result.canceled || !result.result) {
    return null;
  }

  const file = result.result;
  if (!file.name.toLocaleLowerCase('en-US').endsWith('.csv')) {
    throw new CsvValidationError('请选择扩展名为 .csv 的文件');
  }

  let content: string;
  try {
    content = await file.text();
  } catch {
    throw new CsvValidationError('无法读取所选文件，请重新选择该 CSV');
  }

  return {
    content,
    name: file.name,
    size: file.size,
    uri: file.uri,
  };
}

export async function importWordCsv(
  db: SQLiteDatabase,
  content: string,
): Promise<WordImportSummary> {
  const preview = parseWordCsv(content);
  const result = await upsertWords(db, preview.validRows);

  return {
    inserted: result.inserted,
    rejectedRows: preview.rejectedRows,
    totalRows: preview.totalRows,
    updated: result.updated,
  };
}
