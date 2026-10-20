import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateFittedWordFontSize } from '../src/utils/fitWordText';

test('keeps short words at the maximum word font size', () => {
  assert.equal(calculateFittedWordFontSize(260, 4), 54);
});

test('scales long words to fit the available width', () => {
  assert.equal(calculateFittedWordFontSize(260, 11), 36.5);
});

test('enforces the minimum word font size and handles invalid width', () => {
  assert.equal(calculateFittedWordFontSize(260, 40), 16);
  assert.equal(calculateFittedWordFontSize(0, 11), 54);
});
