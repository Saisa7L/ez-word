import type { WordRecord } from '@/database/wordsRepository';

export type DailyTaskQuestion = {
  sentence: string;
  word: WordRecord;
};

export type FillAnswerMap = Record<number, number>;

export type ListeningAnswerMap = Record<number, string>;
