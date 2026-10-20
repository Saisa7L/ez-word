import type { TaskWord } from '@/domain/word/taskWord';

export type DailyTaskQuestion = {
  sentence: string;
  word: TaskWord;
};

export type FillAnswerMap = Record<number, number>;

export type ListeningAnswerMap = Record<number, string>;

export type DailyTaskMode = 'daily' | 'wrongReview' | 'wordReview';
