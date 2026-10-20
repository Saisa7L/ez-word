import {
  DEFAULT_DAILY_TASK_SETTINGS,
  type DailyTaskSettings,
} from '@/database/settingsRepository';
import type { TaskWord } from '@/domain/word/taskWord';

import type { DailyTaskMode } from './types';

export type TaskPhase =
  | 'idle'
  | 'learning'
  | 'filling'
  | 'listening'
  | 'completed';

export type TaskState = {
  durationSeconds: number;
  fillMistakeWordIds: Set<number>;
  fillWords: TaskWord[];
  listeningMistakeWordIds: Set<number>;
  listeningWords: TaskWord[];
  phase: TaskPhase;
  startedAt: number | null;
  taskMode: DailyTaskMode;
  taskSettings: DailyTaskSettings;
  wordBank: TaskWord[];
  words: TaskWord[];
};

export type TaskAction =
  | {
      payload: {
        fillWords: TaskWord[];
        listeningWords: TaskWord[];
        mode: DailyTaskMode;
        settings: DailyTaskSettings;
        startedAt: number;
        wordBank: TaskWord[];
        words: TaskWord[];
      };
      type: 'START_TASK';
    }
  | { type: 'RESET_TASK' }
  | { phase: TaskPhase; type: 'ENTER_PHASE' }
  | { durationSeconds: number; type: 'FINISH_TASK' }
  | { type: 'ADD_FILL_MISTAKE_IDS'; wordIds: number[] }
  | { type: 'ADD_LISTENING_MISTAKE_IDS'; wordIds: number[] };

export function createInitialTaskState(): TaskState {
  return {
    durationSeconds: 0,
    fillMistakeWordIds: new Set(),
    fillWords: [],
    listeningMistakeWordIds: new Set(),
    listeningWords: [],
    phase: 'idle',
    startedAt: null,
    taskMode: 'daily',
    taskSettings: { ...DEFAULT_DAILY_TASK_SETTINGS },
    wordBank: [],
    words: [],
  };
}

export function taskReducer(
  state: TaskState,
  action: TaskAction,
): TaskState {
  switch (action.type) {
    case 'START_TASK': {
      const { mode, settings, ...taskPayload } = action.payload;
      return {
        ...createInitialTaskState(),
        ...taskPayload,
        phase: mode === 'wordReview' ? 'filling' : 'learning',
        taskMode: mode,
        taskSettings: settings,
      };
    }
    case 'RESET_TASK':
      return createInitialTaskState();
    case 'ENTER_PHASE':
      return { ...state, phase: action.phase };
    case 'FINISH_TASK':
      return {
        ...state,
        durationSeconds: Math.max(0, action.durationSeconds),
      };
    case 'ADD_FILL_MISTAKE_IDS':
      return {
        ...state,
        fillMistakeWordIds: new Set([
          ...state.fillMistakeWordIds,
          ...action.wordIds,
        ]),
      };
    case 'ADD_LISTENING_MISTAKE_IDS':
      return {
        ...state,
        listeningMistakeWordIds: new Set([
          ...state.listeningMistakeWordIds,
          ...action.wordIds,
        ]),
      };
    default:
      return state;
  }
}
