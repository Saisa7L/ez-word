import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';

import type { DailyTaskSettings } from '@/database/settingsRepository';
import type { TaskWord } from '@/domain/word/taskWord';
import { shuffle } from '@/utils/shuffle';

import { buildDailyTaskQuestions } from './sentenceTemplates';
import {
  createInitialTaskState,
  taskReducer,
  type TaskPhase,
} from './taskReducer';
import type { DailyTaskMode } from './types';

type TaskSessionContextValue = {
  durationSeconds: number;
  enterPhase: (phase: TaskPhase) => void;
  fillWords: TaskWord[];
  finishTask: () => void;
  listeningWords: TaskWord[];
  phase: TaskPhase;
  questions: ReturnType<typeof buildDailyTaskQuestions>;
  resetTask: () => void;
  startedAt: number | null;
  startTask: (
    words: TaskWord[],
    settings: DailyTaskSettings,
    mode?: DailyTaskMode,
  ) => void;
  taskMode: DailyTaskMode;
  taskSettings: DailyTaskSettings;
  wordBank: TaskWord[];
  words: TaskWord[];
};

type TaskMistakesContextValue = {
  fillMistakeWordIds: Set<number>;
  listeningMistakeWordIds: Set<number>;
  recordFillMistakes: (wordIds: number[]) => void;
  recordListeningMistakes: (wordIds: number[]) => void;
  wrongWordIds: Set<number>;
};

const TaskSessionContext = createContext<TaskSessionContextValue | null>(null);
const TaskMistakesContext = createContext<TaskMistakesContextValue | null>(null);

type DailyTaskProviderProps = {
  children: ReactNode;
};

export function DailyTaskProvider({ children }: DailyTaskProviderProps) {
  const [state, dispatch] = useReducer(
    taskReducer,
    undefined,
    createInitialTaskState,
  );

  const startTask = useCallback(
    (
      nextWords: TaskWord[],
      settings: DailyTaskSettings,
      mode: DailyTaskMode = 'daily',
    ) => {
      const words = [...nextWords];
      dispatch({
        payload: {
          fillWords: shuffle(words),
          listeningWords: shuffle(words),
          mode,
          settings,
          startedAt: Date.now(),
          wordBank: shuffle(words),
          words,
        },
        type: 'START_TASK',
      });
    },
    [],
  );

  const finishTask = useCallback(() => {
    if (state.startedAt !== null) {
      dispatch({
        durationSeconds: Math.max(
          0,
          Math.round((Date.now() - state.startedAt) / 1000),
        ),
        type: 'FINISH_TASK',
      });
    }
  }, [state.startedAt]);

  const resetTask = useCallback(() => {
    dispatch({ type: 'RESET_TASK' });
  }, []);

  const enterPhase = useCallback((phase: TaskPhase) => {
    dispatch({ phase, type: 'ENTER_PHASE' });
  }, []);

  const recordFillMistakes = useCallback((wordIds: number[]) => {
    dispatch({ type: 'ADD_FILL_MISTAKE_IDS', wordIds });
  }, []);

  const recordListeningMistakes = useCallback((wordIds: number[]) => {
    dispatch({ type: 'ADD_LISTENING_MISTAKE_IDS', wordIds });
  }, []);

  const questions = useMemo(
    () => buildDailyTaskQuestions(state.fillWords),
    [state.fillWords],
  );
  const wrongWordIds = useMemo(
    () =>
      new Set([
        ...state.fillMistakeWordIds,
        ...state.listeningMistakeWordIds,
      ]),
    [state.fillMistakeWordIds, state.listeningMistakeWordIds],
  );

  const sessionValue = useMemo<TaskSessionContextValue>(
    () => ({
      durationSeconds: state.durationSeconds,
      enterPhase,
      fillWords: state.fillWords,
      finishTask,
      listeningWords: state.listeningWords,
      phase: state.phase,
      questions,
      resetTask,
      startedAt: state.startedAt,
      startTask,
      taskMode: state.taskMode,
      taskSettings: state.taskSettings,
      wordBank: state.wordBank,
      words: state.words,
    }),
    [
      enterPhase,
      finishTask,
      questions,
      resetTask,
      startTask,
      state.durationSeconds,
      state.fillWords,
      state.listeningWords,
      state.phase,
      state.startedAt,
      state.taskMode,
      state.taskSettings,
      state.wordBank,
      state.words,
    ],
  );

  const mistakesValue = useMemo<TaskMistakesContextValue>(
    () => ({
      fillMistakeWordIds: state.fillMistakeWordIds,
      listeningMistakeWordIds: state.listeningMistakeWordIds,
      recordFillMistakes,
      recordListeningMistakes,
      wrongWordIds,
    }),
    [
      recordFillMistakes,
      recordListeningMistakes,
      state.fillMistakeWordIds,
      state.listeningMistakeWordIds,
      wrongWordIds,
    ],
  );

  return (
    <TaskSessionContext.Provider value={sessionValue}>
      <TaskMistakesContext.Provider value={mistakesValue}>
        {children}
      </TaskMistakesContext.Provider>
    </TaskSessionContext.Provider>
  );
}

export function useDailyTaskSession(): TaskSessionContextValue {
  const context = useContext(TaskSessionContext);
  if (!context) {
    throw new Error('useDailyTaskSession must be used inside DailyTaskProvider');
  }
  return context;
}

export function useDailyTaskMistakes(): TaskMistakesContextValue {
  const context = useContext(TaskMistakesContext);
  if (!context) {
    throw new Error('useDailyTaskMistakes must be used inside DailyTaskProvider');
  }
  return context;
}
