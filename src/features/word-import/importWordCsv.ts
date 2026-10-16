import * as DocumentPicker from 'expo-document-picker';
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
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
    type: CSV_MIME_TYPES,
  });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  if (!asset.name.toLocaleLowerCase('en-US').endsWith('.csv')) {
    throw new CsvValidationError('请选择扩展名为 .csv 的文件');
  }

  const file = new File(asset.uri);
  const content = await file.text();

  return {
    content,
    name: asset.name,
    size: asset.size,
    uri: asset.uri,
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
