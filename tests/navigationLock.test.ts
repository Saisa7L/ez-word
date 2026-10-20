import assert from 'node:assert/strict';
import test from 'node:test';

import {
  beginNavigationLock,
  completeNavigationLock,
  isNavigationLocked,
  resetNavigationLockForTests,
  runNavigationOnce,
} from '../src/utils/backNavigation';

test('allows the first navigation and rejects an immediate second one', () => {
  resetNavigationLockForTests();
  assert.equal(beginNavigationLock(1000), true);
  assert.equal(beginNavigationLock(1100), false);
  resetNavigationLockForTests();
});

test('does not execute an action when the navigation lock is held', () => {
  resetNavigationLockForTests();
  let actionCount = 0;
  const action = () => {
    actionCount += 1;
  };

  assert.equal(runNavigationOnce(action, 1000), true);
  assert.equal(runNavigationOnce(action, 1100), false);
  assert.equal(actionCount, 1);
  resetNavigationLockForTests();
});

test('keeps the minimum lock after the pathname changes', () => {
  resetNavigationLockForTests();
  assert.equal(beginNavigationLock(1000), true);
  completeNavigationLock(1100);

  assert.equal(isNavigationLocked(1299), true);
  assert.equal(isNavigationLocked(1300), false);
  assert.equal(beginNavigationLock(1300), true);
  resetNavigationLockForTests();
});

test('releases a pending navigation after the fallback timeout', () => {
  resetNavigationLockForTests();
  assert.equal(beginNavigationLock(1000), true);

  assert.equal(isNavigationLocked(1499), true);
  assert.equal(isNavigationLocked(1500), false);
  assert.equal(beginNavigationLock(1500), true);
  resetNavigationLockForTests();
});

test('executes a reset action only once', () => {
  resetNavigationLockForTests();
  let resetCount = 0;
  const reset = () => {
    resetCount += 1;
  };

  assert.equal(runNavigationOnce(reset, 1000), true);
  assert.equal(runNavigationOnce(reset, 1200), false);
  assert.equal(resetCount, 1);
  resetNavigationLockForTests();
});
