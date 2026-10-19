import type { DailyTaskMode } from './types';

const TASK_TITLES: Record<DailyTaskMode, string> = {
  daily: '每日任务',
  wordReview: '单词再练',
  wrongReview: '错题回顾',
};

export function getTaskTitle(mode: DailyTaskMode): string {
  return TASK_TITLES[mode];
}

export function formatListeningRate(
  rate: number,
  fixedInteger = false,
): string {
  return fixedInteger && Number.isInteger(rate)
    ? `${rate.toFixed(1)}x`
    : `${rate}x`;
}
