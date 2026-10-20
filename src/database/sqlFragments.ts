const WORD_COLUMNS = [
  'id',
  'word',
  'meaning',
  'phonetic',
  'example_sentence',
  'example_source',
  'example_generated_at',
  'is_active',
  'learning_status',
  'created_at',
  'updated_at',
] as const;

const TASK_WORD_COLUMNS = [
  'id',
  'word',
  'meaning',
  'phonetic',
  'example_sentence',
] as const;

export function selectWordColumns(alias?: string): string {
  return WORD_COLUMNS.map((column) =>
    alias ? `${alias}.${column}` : column,
  ).join(', ');
}

export function selectTaskWordColumns(alias?: string): string {
  return TASK_WORD_COLUMNS.map((column) =>
    alias ? `${alias}.${column}` : column,
  ).join(', ');
}
