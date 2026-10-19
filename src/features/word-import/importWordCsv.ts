import type { SQLiteDatabase } from 'expo-sqlite';

import { upsertWords } from '@/database/wordsRepository';

import { parseWordCsv } from './csv';
import type { WordImportSummary } from './types';

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
