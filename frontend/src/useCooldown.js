import { useRef, useCallback } from 'react';

/**
 * Returns fire(fn).
 * Executes fn immediately then silently drops calls for `ms` milliseconds.
 * No visual state change — rapid clicks just don't fire.
 */
export function useCooldown(ms = 800) {
  const timer = useRef(null);

  return useCallback((fn) => {
    if (timer.current) return;
    fn();
    timer.current = setTimeout(() => {
      timer.current = null;
    }, ms);
  }, [ms]);
}
