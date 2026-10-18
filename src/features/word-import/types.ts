export type WordImportRow = {
  example_sentence?: string;
  word: string;
  meaning: string;
  phonetic: string;
};

export type RejectedImportRow = {
  rowNumber: number;
  reason: string;
};

export type CsvColumns = {
  example?: string;
  word: string;
  meaning: string;
  phonetic: string;
};

export type WordCsvPreview = {
  columns: CsvColumns;
  rejectedRows: RejectedImportRow[];
  totalRows: number;
  validRows: WordImportRow[];
};

export type WordImportSummary = {
  inserted: number;
  rejectedRows: RejectedImportRow[];
  totalRows: number;
  updated: number;
};

export type PickedCsvFile = {
  content: string;
  name: string;
  size: number | undefined;
  uri: string;
};

export class CsvValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CsvValidationError';
  }
}
