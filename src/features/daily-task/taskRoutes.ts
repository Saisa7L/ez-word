import type { TaskPhase } from './taskReducer';

export type DailyTaskRoute =
  | '/daily-task'
  | '/daily-task/complete'
  | '/daily-task/fill-blank'
  | '/daily-task/learn'
  | '/daily-task/listening';

export function getTaskPhaseRoute(phase: TaskPhase): DailyTaskRoute {
  switch (phase) {
    case 'learning':
      return '/daily-task/learn';
    case 'filling':
      return '/daily-task/fill-blank';
    case 'listening':
      return '/daily-task/listening';
    case 'completed':
      return '/daily-task/complete';
    case 'idle':
    default:
      return '/daily-task';
  }
}
