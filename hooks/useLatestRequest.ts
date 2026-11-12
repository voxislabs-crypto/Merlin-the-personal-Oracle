'use client';

import { useCallback, useRef } from 'react';

/** Drop a slower response after a newer call for the same hook has started. */
export function useLatestRequest() {
  const current = useRef(0);

  const begin = useCallback(() => {
    current.current += 1;
    const id = current.current;
    return () => id === current.current;
  }, []);

  const invalidate = useCallback(() => {
    current.current += 1;
  }, []);

  return { begin, invalidate };
}
