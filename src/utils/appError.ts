export type AppErrorCode =
  | 'AI_SERVICE'
  | 'ARCHIVE'
  | 'DATABASE'
  | 'FILE'
  | 'NAVIGATION'
  | 'UNKNOWN'
  | 'VALIDATION';

type AppErrorOptions = {
  cause?: unknown;
  context?: Record<string, unknown>;
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly context?: Record<string, unknown>;
  readonly cause?: unknown;

  constructor(
    code: AppErrorCode,
    message: string,
    { cause, context }: AppErrorOptions = {},
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.cause = cause;
    this.context = context;
  }
}

export function normalizeAppError(
  error: unknown,
  fallbackCode: AppErrorCode = 'UNKNOWN',
  fallbackMessage = '发生未知错误',
): AppError {
  if (error instanceof AppError) {
    return error;
  }
  if (error instanceof Error) {
    return new AppError(fallbackCode, error.message || fallbackMessage, {
      cause: error,
    });
  }
  return new AppError(fallbackCode, fallbackMessage, { cause: error });
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof AppError || error instanceof Error
    ? error.message
    : fallback;
}
