import assert from 'node:assert/strict';
import test from 'node:test';

import { formatStudyDate } from '../src/utils/date';

test('keeps the previous study date before 5am', () => {
  assert.equal(formatStudyDate(new Date(2026, 9, 22, 4, 59)), '2026-10-21');
});

test('switches to the new study date at 5am', () => {
  assert.equal(formatStudyDate(new Date(2026, 9, 22, 5, 0)), '2026-10-22');
});

test('switches study date across month and year boundaries', () => {
  assert.equal(formatStudyDate(new Date(2026, 10, 1, 4, 30)), '2026-10-31');
  assert.equal(formatStudyDate(new Date(2027, 0, 1, 4, 30)), '2026-12-31');
});
