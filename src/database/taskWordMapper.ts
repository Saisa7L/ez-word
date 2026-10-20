import type { TaskWord } from '@/domain/word/taskWord';

export type TaskWordRow = {
  example_sentence: string;
  id: number;
  meaning: string;
  phonetic: string;
  word: string;
};

export function mapTaskWordRow(row: TaskWordRow): TaskWord {
  return {
    exampleSentence: row.example_sentence,
    id: row.id,
    meaning: row.meaning,
    phonetic: row.phonetic,
    word: row.word,
  };
}
