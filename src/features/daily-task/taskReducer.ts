import {
  DEFAULT_DAILY_TASK_SETTINGS,
  type DailyTaskSettings,
} from '@/database/settingsRepository';
import type { TaskWord } from '@/domain/word/taskWord';

import type {
  DailyTaskMode,
  ListeningAnswerMap,
} from './types';

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
  listeningAnswers: ListeningAnswerMap;
  listeningMistakeWordIds: Set<number>;
  listeningWords: TaskWord[];
  listeningWrongWordIds: Set<number>;
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
  | { answer: string; type: 'SET_LISTENING_ANSWER'; wordId: number }
  | { type: 'ADD_FILL_MISTAKE_IDS'; wordIds: number[] }
  | { type: 'SET_LISTENING_WRONG_IDS'; wordIds: number[] };

export function createInitialTaskState(): TaskState {
  return {
    durationSeconds: 0,
    fillMistakeWordIds: new Set(),
    fillWords: [],
    listeningAnswers: {},
    listeningMistakeWordIds: new Set(),
    listeningWords: [],
    listeningWrongWordIds: new Set(),
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
    case 'SET_LISTENING_ANSWER': {
      const listeningAnswers = { ...state.listeningAnswers };
      if (action.answer) {
        listeningAnswers[action.wordId] = action.answer;
      } else {
        delete listeningAnswers[action.wordId];
      }
      const listeningWrongWordIds = new Set(state.listeningWrongWordIds);
      listeningWrongWordIds.delete(action.wordId);
      return { ...state, listeningAnswers, listeningWrongWordIds };
    }
    case 'ADD_FILL_MISTAKE_IDS':
      return {
        ...state,
        fillMistakeWordIds: new Set([
          ...state.fillMistakeWordIds,
          ...action.wordIds,
        ]),
      };
    case 'SET_LISTENING_WRONG_IDS':
      return {
        ...state,
        listeningMistakeWordIds:
          action.wordIds.length > 0
            ? new Set([
                ...state.listeningMistakeWordIds,
                ...action.wordIds,
              ])
            : state.listeningMistakeWordIds,
        listeningWrongWordIds: new Set(action.wordIds),
      };
    default:
      return state;
  }
}
