import { useCallback, useEffect, useRef } from 'react';

const HOLD_REPEAT_DELAY_MS = 450;
const HOLD_REPEAT_INTERVAL_MS = 72;

export function useLongPressStep(onStep: () => void, enabled: boolean) {
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const enabledRef = useRef(enabled);

  const stop = useCallback(() => {
    if (delayTimerRef.current) {
      clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
    if (repeatTimerRef.current) {
      clearInterval(repeatTimerRef.current);
      repeatTimerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (!enabledRef.current) {
      return;
    }

    stop();
    onStep();
    delayTimerRef.current = setTimeout(() => {
      repeatTimerRef.current = setInterval(() => {
        if (!enabledRef.current) {
          stop();
          return;
        }
        onStep();
      }, HOLD_REPEAT_INTERVAL_MS);
    }, HOLD_REPEAT_DELAY_MS);
  }, [onStep, stop]);

  useEffect(() => {
    enabledRef.current = enabled;
    if (!enabled) {
      stop();
    }
  }, [enabled, stop]);

  useEffect(() => stop, [stop]);

  return { start, stop };
}
