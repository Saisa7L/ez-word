import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { WordRecord } from '@/database/wordsRepository';

import { buildDailyTaskQuestions } from './sentenceTemplates';
import type { FillAnswerMap, ListeningAnswerMap } from './types';

type DailyTaskContextValue = {
  clearFillAnswer: (questionWordId: number) => void;
  durationSeconds: number;
  fillAnswers: FillAnswerMap;
  finishTask: () => void;
  fillWrongWordIds: Set<number>;
  listeningAnswers: ListeningAnswerMap;
  listeningWrongWordIds: Set<number>;
  questions: ReturnType<typeof buildDailyTaskQuestions>;
  resetTask: () => void;
  setFillAnswer: (questionWordId: number, selectedWordId: number) => void;
  setFillWrongWordIds: (wordIds: number[]) => void;
  setListeningAnswer: (wordId: number, answer: string) => void;
  setListeningWrongWordIds: (wordIds: number[]) => void;
  startedAt: number | null;
  startTask: (words: WordRecord[]) => void;
  wordBank: WordRecord[];
  words: WordRecord[];
  wrongWordIds: Set<number>;
};

const DailyTaskContext = createContext<DailyTaskContextValue | null>(null);

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

type DailyTaskProviderProps = {
  children: ReactNode;
};

export function DailyTaskProvider({ children }: DailyTaskProviderProps) {
  const [words, setWords] = useState<WordRecord[]>([]);
  const [wordBank, setWordBank] = useState<WordRecord[]>([]);
  const [fillAnswers, setFillAnswers] = useState<FillAnswerMap>({});
  const [listeningAnswers, setListeningAnswers] = useState<ListeningAnswerMap>({});
  const [fillWrongWordIds, setFillWrongWordIdSet] = useState<Set<number>>(new Set());
  const [listeningWrongWordIds, setListeningWrongWordIdSet] = useState<Set<number>>(
    new Set(),
  );
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);

  const startTask = useCallback((nextWords: WordRecord[]) => {
    const limitedWords = [...nextWords];
    setWords(limitedWords);
    setWordBank(shuffle(limitedWords));
    setFillAnswers({});
    setListeningAnswers({});
    setFillWrongWordIdSet(new Set());
    setListeningWrongWordIdSet(new Set());
    setStartedAt(Date.now());
    setDurationSeconds(0);
  }, []);

  const finishTask = useCallback(() => {
    if (startedAt !== null) {
      setDurationSeconds(Math.max(0, Math.round((Date.now() - startedAt) / 1000)));
    }
  }, [startedAt]);

  const resetTask = useCallback(() => {
    setWords([]);
    setWordBank([]);
    setFillAnswers({});
    setListeningAnswers({});
    setFillWrongWordIdSet(new Set());
    setListeningWrongWordIdSet(new Set());
    setStartedAt(null);
    setDurationSeconds(0);
  }, []);

  const setFillAnswer = useCallback(
    (questionWordId: number, selectedWordId: number) => {
      setFillAnswers((current) => {
        const next = { ...current };
        for (const [wordId, answerWordId] of Object.entries(next)) {
          if (answerWordId === selectedWordId) {
            delete next[Number(wordId)];
          }
        }
        next[questionWordId] = selectedWordId;
        return next;
      });
      setFillWrongWordIdSet((current) => {
        const next = new Set(current);
        next.delete(questionWordId);
        return next;
      });
    },
    [],
  );

  const clearFillAnswer = useCallback((questionWordId: number) => {
    setFillAnswers((current) => {
      const next = { ...current };
      delete next[questionWordId];
      return next;
    });
    setFillWrongWordIdSet((current) => {
      const next = new Set(current);
      next.delete(questionWordId);
      return next;
    });
  }, []);

  const setListeningAnswer = useCallback((wordId: number, answer: string) => {
    setListeningAnswers((current) => {
      const next = { ...current };
      if (answer) {
        next[wordId] = answer;
      } else {
        delete next[wordId];
      }
      return next;
    });
    setListeningWrongWordIdSet((current) => {
      const next = new Set(current);
      next.delete(wordId);
      return next;
    });
  }, []);

  const setFillWrongWordIds = useCallback((wordIds: number[]) => {
    setFillWrongWordIdSet(new Set(wordIds));
  }, []);

  const setListeningWrongWordIds = useCallback((wordIds: number[]) => {
    setListeningWrongWordIdSet(new Set(wordIds));
  }, []);

  const questions = useMemo(() => buildDailyTaskQuestions(words), [words]);
  const wrongWordIds = useMemo(
    () => new Set([...fillWrongWordIds, ...listeningWrongWordIds]),
    [fillWrongWordIds, listeningWrongWordIds],
  );

  const value = useMemo<DailyTaskContextValue>(
    () => ({
      clearFillAnswer,
      durationSeconds,
      fillAnswers,
      finishTask,
      fillWrongWordIds,
      listeningAnswers,
      listeningWrongWordIds,
      questions,
      resetTask,
      setFillAnswer,
      setFillWrongWordIds,
      setListeningAnswer,
      setListeningWrongWordIds,
      startedAt,
      startTask,
      wordBank,
      words,
      wrongWordIds,
    }),
    [
      clearFillAnswer,
      durationSeconds,
      fillAnswers,
      finishTask,
      fillWrongWordIds,
      listeningAnswers,
      listeningWrongWordIds,
      questions,
      resetTask,
      setFillAnswer,
      setFillWrongWordIds,
      setListeningAnswer,
      setListeningWrongWordIds,
      startedAt,
      startTask,
      wordBank,
      words,
      wrongWordIds,
    ],
  );

  return <DailyTaskContext.Provider value={value}>{children}</DailyTaskContext.Provider>;
}

export function useDailyTask(): DailyTaskContextValue {
  const context = useContext(DailyTaskContext);
  if (!context) {
    throw new Error('useDailyTask must be used inside DailyTaskProvider');
  }
  return context;
}
