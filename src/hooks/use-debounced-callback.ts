'use client';

import { useEffect, useRef } from 'react';

/** Debounce a callback (e.g. search router.push) by `ms` milliseconds. */
export function useDebouncedCallback<T extends (...args: never[]) => void>(
  callback: T,
  ms: number
): T {
  const cbRef = useRef(callback);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    cbRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return ((...args: Parameters<T>) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      cbRef.current(...args);
    }, ms);
  }) as T;
}
