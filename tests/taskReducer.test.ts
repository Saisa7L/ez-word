import assert from 'node:assert/strict';
import test from 'node:test';

import { DEFAULT_DAILY_TASK_SETTINGS } from '../src/database/settingsRepository';
import type { TaskWord } from '../src/domain/word/taskWord';
import {
  createInitialTaskState,
  taskReducer,
} from '../src/features/daily-task/taskReducer';
import { resolveListeningSpeed } from '../src/features/daily-task/taskPresentation';
import { getTaskPhaseRoute } from '../src/features/daily-task/taskRoutes';

const words: TaskWord[] = [
  {
    exampleSentence: 'Alpha appears here.',
    id: 1,
    meaning: '阿尔法',
    phonetic: '',
    word: 'alpha',
  },
  {
    exampleSentence: '',
    id: 2,
    meaning: '贝塔',
    phonetic: '',
    word: 'beta',
  },
];

function startTask(mode: 'daily' | 'wrongReview' | 'wordReview') {
  return taskReducer(createInitialTaskState(), {
    payload: {
      fillWords: [words[1]!, words[0]!],
      listeningWords: [words[0]!, words[1]!],
      mode,
      settings: {
        ...DEFAULT_DAILY_TASK_SETTINGS,
        listeningDefaultRate: 1.5,
      },
      startedAt: 1000,
      wordBank: [words[1]!, words[0]!],
      words,
    },
    type: 'START_TASK',
  });
}

test('starts daily and wrong-review tasks in the learning phase', () => {
  const daily = startTask('daily');
  const wrongReview = startTask('wrongReview');

  assert.equal(daily.phase, 'learning');
  assert.equal(daily.taskMode, 'daily');
  assert.equal(daily.taskSettings.listeningDefaultRate, 1.5);
  assert.equal(wrongReview.phase, 'learning');
  assert.equal(wrongReview.taskMode, 'wrongReview');
  assert.equal(wrongReview.taskSettings.listeningDefaultRate, 1.5);
});

test('starts word review in the filling phase', () => {
  const state = startTask('wordReview');
  assert.equal(state.phase, 'filling');
  assert.equal(state.taskMode, 'wordReview');
  assert.equal(state.taskSettings.listeningDefaultRate, 1.5);
});

test('tracks phase, answers, mistakes and duration', () => {
  let state = startTask('daily');
  state = taskReducer(state, { phase: 'filling', type: 'ENTER_PHASE' });
  state = taskReducer(state, {
    type: 'ADD_FILL_MISTAKE_IDS',
    wordIds: [1],
  });
  state = taskReducer(state, {
    type: 'ADD_LISTENING_MISTAKE_IDS',
    wordIds: [1, 2],
  });
  state = taskReducer(state, {
    durationSeconds: 42,
    type: 'FINISH_TASK',
  });

  assert.equal(state.phase, 'filling');
  assert.deepEqual([...state.fillMistakeWordIds], [1]);
  assert.deepEqual([...state.listeningMistakeWordIds], [1, 2]);
  assert.equal(state.durationSeconds, 42);
});

test('reset clears the full task state', () => {
  const state = taskReducer(startTask('daily'), { type: 'RESET_TASK' });
  assert.deepEqual(state, createInitialTaskState());
  assert.equal(state.phase, 'idle');
  assert.equal(state.words.length, 0);
});

test('uses the task setting until a speed override is made', () => {
  assert.equal(resolveListeningSpeed(1.5, 1000, null), 1.5);
  assert.equal(
    resolveListeningSpeed(1.5, 1000, { speed: 2, startedAt: 1000 }),
    2,
  );
  assert.equal(
    resolveListeningSpeed(1.5, 2000, { speed: 2, startedAt: 1000 }),
    1.5,
  );
});

test('maps each task phase to its route', () => {
  assert.equal(getTaskPhaseRoute('idle'), '/daily-task');
  assert.equal(getTaskPhaseRoute('learning'), '/daily-task/learn');
  assert.equal(getTaskPhaseRoute('filling'), '/daily-task/fill-blank');
  assert.equal(getTaskPhaseRoute('listening'), '/daily-task/listening');
  assert.equal(getTaskPhaseRoute('completed'), '/daily-task/complete');
});
