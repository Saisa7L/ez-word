import { APP_NAME } from '@/constants/appInfo';

import {
  normalizeAppError,
  type AppError,
  type AppErrorCode,
} from './appError';

type LogContext = Record<string, unknown>;
type LogLevel = 'error' | 'info' | 'warn';

const SENSITIVE_KEY_PATTERN =
  /api[-_]?key|authorization|password|secret|token/i;
const REDACTED = '[REDACTED]';

function isDevelopment(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__;
}

export function redactSensitiveText(value: string): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, `Bearer ${REDACTED}`)
    .replace(
      /(api[-_]?key|authorization|password|secret|token)\s*[:=]\s*["']?[^"'\s,;]+/gi,
      `$1=${REDACTED}`,
    );
}

function sanitizeValue(
  value: unknown,
  key: string,
  depth: number,
  seen: WeakSet<object>,
): unknown {
  if (SENSITIVE_KEY_PATTERN.test(key)) {
    return REDACTED;
  }
  if (value === null || typeof value !== 'object') {
    return typeof value === 'string' ? redactSensitiveText(value) : value;
  }
  if (depth >= 4) {
    return '[Max depth]';
  }
  if (seen.has(value)) {
    return '[Circular]';
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, key, depth + 1, seen));
  }
  if (value instanceof Error) {
    return {
      message: redactSensitiveText(value.message),
      name: value.name,
      stack: value.stack ? redactSensitiveText(value.stack) : undefined,
    };
  }

  return Object.fromEntries(
    Object.entries(value).map(([entryKey, entryValue]) => [
      entryKey,
      sanitizeValue(entryValue, entryKey, depth + 1, seen),
    ]),
  );
}

export function sanitizeLogContext(context: LogContext): LogContext {
  return sanitizeValue(context, '', 0, new WeakSet()) as LogContext;
}

function emit(
  level: LogLevel,
  event: string,
  error: unknown,
  context: LogContext = {},
): AppError {
  const normalized = normalizeAppError(error);
  const safeContext = sanitizeLogContext({
    ...context,
    code: normalized.code,
  });
  const line = `[${APP_NAME}][${level}] ${event}`;

  if (level === 'error') {
    console.error(line, normalized.message, safeContext);
  } else if (level === 'warn') {
    console.warn(line, normalized.message, safeContext);
  } else if (isDevelopment()) {
    console.info(line, normalized.message, safeContext);
  }

  return normalized;
}

export const logger = {
  error(event: string, error: unknown, context?: LogContext): AppError {
    return emit('error', event, error, context);
  },
  info(event: string, error: unknown, context?: LogContext): AppError {
    return emit('info', event, error, context);
  },
  warn(event: string, error: unknown, context?: LogContext): AppError {
    return emit('warn', event, error, context);
  },
};

export function buildDiagnosticReport(
  error: unknown,
  context: LogContext = {},
): string {
  const normalized = normalizeAppError(error);
  return JSON.stringify(
    {
      app: APP_NAME,
      error: {
        code: normalized.code,
        message: redactSensitiveText(normalized.message),
        stack:
          isDevelopment() && normalized.stack
            ? redactSensitiveText(normalized.stack)
            : undefined,
      },
      timestamp: new Date().toISOString(),
      context: sanitizeLogContext(context),
    },
    null,
    2,
  );
}

export type { AppErrorCode };
