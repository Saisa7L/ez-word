import { File } from 'expo-file-system';

import {
  CsvValidationError,
  type PickedCsvFile,
} from '@/features/word-import/types';

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
