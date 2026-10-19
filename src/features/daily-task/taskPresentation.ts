import type { DailyTaskMode } from './types';

const TASK_TITLES: Record<DailyTaskMode, string> = {
  daily: '每日任务',
  wordReview: '单词再练',
  wrongReview: '错题回顾',
};

export function getTaskTitle(mode: DailyTaskMode): string {
  return TASK_TITLES[mode];
}
