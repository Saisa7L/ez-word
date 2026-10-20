export const NAVIGATION_MIN_LOCK_MS = 300;
export const NAVIGATION_MAX_LOCK_MS = 500;

type NavigationLockState = {
  completed: boolean;
  fallbackTimer: ReturnType<typeof setTimeout> | null;
  lockedUntil: number;
  pending: boolean;
  startedAt: number;
};

function createUnlockedState(): NavigationLockState {
  return {
    completed: false,
    fallbackTimer: null,
    lockedUntil: 0,
    pending: false,
    startedAt: 0,
  };
}

let navigationLock = createUnlockedState();

function clearFallbackTimer() {
  if (navigationLock.fallbackTimer !== null) {
    clearTimeout(navigationLock.fallbackTimer);
    navigationLock.fallbackTimer = null;
  }
}

function scheduleLockRelease(delayMs: number) {
  clearFallbackTimer();
  navigationLock.fallbackTimer = setTimeout(() => {
    forceCompleteNavigationLock();
  }, Math.max(0, delayMs));
}

export function beginNavigationLock(now = Date.now()): boolean {
  if (isNavigationLocked(now)) {
    return false;
  }

  clearFallbackTimer();
  navigationLock = {
    completed: false,
    fallbackTimer: null,
    lockedUntil: now + NAVIGATION_MIN_LOCK_MS,
    pending: true,
    startedAt: now,
  };
  scheduleLockRelease(
    navigationLock.startedAt + NAVIGATION_MAX_LOCK_MS - now,
  );
  return true;
}

export function completeNavigationLock(now = Date.now()): void {
  if (!navigationLock.pending) {
    return;
  }

  navigationLock.completed = true;
  navigationLock.lockedUntil = Math.max(
    now,
    navigationLock.startedAt + NAVIGATION_MIN_LOCK_MS,
  );

  if (now >= navigationLock.lockedUntil) {
    forceCompleteNavigationLock();
    return;
  }

  scheduleLockRelease(navigationLock.lockedUntil - now);
}

export function forceCompleteNavigationLock(): void {
  clearFallbackTimer();
  navigationLock = createUnlockedState();
}

export function isNavigationLocked(now = Date.now()): boolean {
  if (!navigationLock.pending) {
    return false;
  }

  if (
    !navigationLock.completed &&
    now >= navigationLock.startedAt + NAVIGATION_MAX_LOCK_MS
  ) {
    forceCompleteNavigationLock();
    return false;
  }

  if (navigationLock.completed && now >= navigationLock.lockedUntil) {
    forceCompleteNavigationLock();
    return false;
  }

  return true;
}

export function runNavigationOnce(
  action: () => void,
  now = Date.now(),
): boolean {
  if (!beginNavigationLock(now)) {
    return false;
  }

  try {
    action();
    return true;
  } catch (error) {
    forceCompleteNavigationLock();
    throw error;
  }
}

export function resetNavigationLockForTests(): void {
  forceCompleteNavigationLock();
}
