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
import type {
  DailyTaskMode,
  ListeningAnswerMap,
} from './types';

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

type TaskAnswersContextValue = {
  fillMistakeWordIds: Set<number>;
  listeningAnswers: ListeningAnswerMap;
  listeningMistakeWordIds: Set<number>;
  listeningWrongWordIds: Set<number>;
  recordFillMistakes: (wordIds: number[]) => void;
  setListeningAnswer: (wordId: number, answer: string) => void;
  setListeningWrongWordIds: (wordIds: number[]) => void;
  wrongWordIds: Set<number>;
};

const TaskSessionContext = createContext<TaskSessionContextValue | null>(null);
const TaskAnswersContext = createContext<TaskAnswersContextValue | null>(null);

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

  const setListeningAnswer = useCallback((wordId: number, answer: string) => {
    dispatch({ answer, type: 'SET_LISTENING_ANSWER', wordId });
  }, []);

  const recordFillMistakes = useCallback((wordIds: number[]) => {
    dispatch({ type: 'ADD_FILL_MISTAKE_IDS', wordIds });
  }, []);

  const setListeningWrongWordIds = useCallback((wordIds: number[]) => {
    dispatch({ type: 'SET_LISTENING_WRONG_IDS', wordIds });
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

  const answersValue = useMemo<TaskAnswersContextValue>(
    () => ({
      fillMistakeWordIds: state.fillMistakeWordIds,
      listeningAnswers: state.listeningAnswers,
      listeningMistakeWordIds: state.listeningMistakeWordIds,
      listeningWrongWordIds: state.listeningWrongWordIds,
      recordFillMistakes,
      setListeningAnswer,
      setListeningWrongWordIds,
      wrongWordIds,
    }),
    [
      recordFillMistakes,
      setListeningAnswer,
      setListeningWrongWordIds,
      state.fillMistakeWordIds,
      state.listeningAnswers,
      state.listeningMistakeWordIds,
      state.listeningWrongWordIds,
      wrongWordIds,
    ],
  );

  return (
    <TaskSessionContext.Provider value={sessionValue}>
      <TaskAnswersContext.Provider value={answersValue}>
        {children}
      </TaskAnswersContext.Provider>
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

export function useDailyTaskAnswers(): TaskAnswersContextValue {
  const context = useContext(TaskAnswersContext);
  if (!context) {
    throw new Error('useDailyTaskAnswers must be used inside DailyTaskProvider');
  }
  return context;
}
