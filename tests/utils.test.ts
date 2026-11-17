import assert from 'node:assert/strict';
import test from 'node:test';

import { formatBytes } from '../src/utils/formatBytes';
import { getLastPageIndex, getPageCount } from '../src/utils/pagination';
import { shuffle } from '../src/utils/shuffle';

test('keeps at least one page for empty collections', () => {
  assert.equal(getPageCount(0, 10), 1);
  assert.equal(getLastPageIndex(0, 10), 0);
});

test('rounds page counts up', () => {
  assert.equal(getPageCount(10, 10), 1);
  assert.equal(getPageCount(11, 10), 2);
  assert.equal(getPageCount(1, 10), 1);
  assert.equal(getLastPageIndex(11, 10), 1);
});

test('shuffles without mutating the input', () => {
  const source = ['a', 'b', 'c', 'd'];
  const result = shuffle(source);

  assert.deepEqual(source, ['a', 'b', 'c', 'd']);
  assert.deepEqual([...result].sort(), ['a', 'b', 'c', 'd']);
  assert.notEqual(result, source);
});

test('returns an empty list when shuffling an empty list', () => {
  assert.deepEqual(shuffle([]), []);
  assert.deepEqual(shuffle(['only']), ['only']);
});

test('describes unknown byte sizes', () => {
  assert.equal(formatBytes(undefined), '大小未知');
  assert.equal(formatBytes(-1), '大小未知');
});

test('formats bytes, kilobytes and megabytes', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(1023), '1023 B');
  assert.equal(formatBytes(1024), '1 KB');
  assert.equal(formatBytes(1536), '2 KB');
  assert.equal(formatBytes(1024 * 1024 - 1), '1024 KB');
  assert.equal(formatBytes(1024 * 1024), '1.0 MB');
  assert.equal(formatBytes(3.5 * 1024 * 1024), '3.5 MB');
});
