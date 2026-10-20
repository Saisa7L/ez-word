import assert from 'node:assert/strict';
import test from 'node:test';

import { DeepSeekError } from '../src/services/deepSeekService';
import {
  AppError,
  getErrorMessage,
  normalizeAppError,
} from '../src/utils/appError';
import {
  buildDiagnosticReport,
  redactSensitiveText,
  sanitizeLogContext,
} from '../src/utils/logger';

test('normalizes arbitrary errors into coded app errors', () => {
  const normalized = normalizeAppError(
    new Error('database unavailable'),
    'DATABASE',
  );

  assert.equal(normalized.code, 'DATABASE');
  assert.equal(normalized.message, 'database unavailable');
  assert.equal(getErrorMessage(normalized, 'fallback'), 'database unavailable');
});

test('preserves existing app error codes', () => {
  const error = new AppError('ARCHIVE', 'invalid archive');
  assert.equal(normalizeAppError(error, 'UNKNOWN').code, 'ARCHIVE');
});

test('redacts secrets from log text and context', () => {
  const text = redactSensitiveText(
    'Authorization: Bearer secret-token api_key=abc123',
  );
  const context = sanitizeLogContext({
    apiKey: 'top-secret',
    nested: { password: '123456', safe: 'visible' },
  });

  assert.equal(text.includes('secret-token'), false);
  assert.equal(text.includes('abc123'), false);
  assert.equal(context.apiKey, '[REDACTED]');
  assert.deepEqual(context.nested, {
    password: '[REDACTED]',
    safe: 'visible',
  });
});

test('builds diagnostics without API keys', () => {
  const report = buildDiagnosticReport(new DeepSeekError('request failed'), {
    apiKey: 'must-not-appear',
    operation: 'generate_word_data',
  });

  assert.equal(report.includes('must-not-appear'), false);
  assert.equal(report.includes('AI_SERVICE'), true);
  assert.equal(report.includes('generate_word_data'), true);
});
