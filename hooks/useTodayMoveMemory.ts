'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  readTodayMoveMemory,
  writeTodayMoveMemory,
} from '@/lib/atmosphere/today-oracle';
import type { TodayMoveMemory } from '@/lib/atmosphere/today-oracle/types';

export function useTodayMoveMemory(userId?: string | null) {
  const [memory, setMemory] = useState<TodayMoveMemory | null>(null);

  useEffect(() => {
    setMemory(readTodayMoveMemory(userId));
  }, [userId]);

  const remember = useCallback(
    (next: TodayMoveMemory) => {
      const same =
        memory &&
        memory.date === next.date &&
        memory.themeId === next.themeId &&
        memory.move === next.move &&
        memory.factKey === next.factKey;
      if (same) return;
      writeTodayMoveMemory(next, userId);
      setMemory(next);
    },
    [memory, userId],
  );

  return { memory, remember };
}
