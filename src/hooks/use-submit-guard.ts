'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * Guards against double-submit and exposes a loading flag for form buttons.
 */
export function useSubmitGuard() {
  const [loading, setLoading] = useState(false);
  const inFlight = useRef(false);

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (inFlight.current) return undefined;
    inFlight.current = true;
    setLoading(true);
    try {
      return await fn();
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  return { loading, run };
}
