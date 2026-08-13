import { useState, useRef, useEffect, useCallback } from 'react';

const HOLD_DELAY = 500;

/**
 * Recreates the original spacebar hold-to-start timer:
 *  - hold Space -> "holding" (red) for HOLD_DELAY ms -> "ready" (green)
 *  - release while ready -> timer starts running
 *  - press Space while running -> timer stops, onComplete(elapsedMs) fires
 *
 * `seconds`/`decimals` only update when their displayed value actually changes,
 * same optimization as the original tick() function, to avoid re-rendering
 * on every animation frame unnecessarily.
 */
export function useTimer(onComplete, precision = 2) {
  const [seconds, setSeconds] = useState('00');
  const [decimals, setDecimals] = useState('00');
  const [phase, setPhase] = useState('idle'); // 'idle' | 'holding' | 'ready' | 'running'

  const runningRef = useRef(false);
  const startTimeRef = useRef(null);
  const rafRef = useRef(null);
  const lastSecsRef = useRef(-1);
  const lastDecimalsRef = useRef(-1);
  const precisionRef = useRef(precision);
  useEffect(() => {
    precisionRef.current = precision;
  }, [precision]);
  const holdTimerRef = useRef(null);
  const spaceDownRef = useRef(false);
  const isReadyRef = useRef(false);

  // Keep the latest onComplete without needing to re-bind listeners on
  // every render (currentEvent/solves changing shouldn't reset the timer).
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const formatTwo = (n) => (n < 10 ? '0' + n : '' + n);

  const tick = useCallback((ts) => {
    const elapsed = ts - startTimeRef.current;
    const secs = Math.floor(elapsed / 1000);
    const ms = Math.floor(elapsed % 1000);
    if (secs !== lastSecsRef.current) {
      setSeconds(formatTwo(secs));
      lastSecsRef.current = secs;
    }
    const digits =
      precisionRef.current >= 3
        ? String(ms).padStart(3, '0')
        : formatTwo(Math.floor(ms / 10));
    if (digits !== lastDecimalsRef.current) {
      setDecimals(digits);
      lastDecimalsRef.current = digits;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const resetDisplay = useCallback(() => {
    setSeconds('00');
    setDecimals('00');
    lastSecsRef.current = -1;
    lastDecimalsRef.current = -1;
  }, []);

  const startTimer = useCallback(() => {
    if (runningRef.current) return;
    resetDisplay();
    startTimeRef.current = performance.now();
    runningRef.current = true;
    setPhase('running');
    rafRef.current = requestAnimationFrame(tick);
  }, [resetDisplay, tick]);

  const stopTimer = useCallback(() => {
    if (!runningRef.current) return;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    runningRef.current = false;
    setPhase('idle');
    const elapsed = Math.round(performance.now() - startTimeRef.current);
    onCompleteRef.current(elapsed);
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.code !== 'Space') return;
      e.preventDefault();
      if (spaceDownRef.current) return;
      spaceDownRef.current = true;

      if (runningRef.current) {
        stopTimer();
        return;
      }

      resetDisplay();
      isReadyRef.current = false;
      setPhase('holding');

      holdTimerRef.current = setTimeout(() => {
        isReadyRef.current = true;
        setPhase('ready');
      }, HOLD_DELAY);
    }

    function handleKeyUp(e) {
      if (e.code !== 'Space') return;
      e.preventDefault();
      spaceDownRef.current = false;
      clearTimeout(holdTimerRef.current);

      if (isReadyRef.current) {
        setPhase('idle');
        startTimer();
      } else {
        setPhase('idle');
      }
      isReadyRef.current = false;
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(rafRef.current);
      clearTimeout(holdTimerRef.current);
    };
  }, [startTimer, stopTimer, resetDisplay]);

  return { seconds, decimals, phase };
}
