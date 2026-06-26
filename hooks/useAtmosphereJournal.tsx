'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  getJournalEntry,
  isJournalOptInEnabled,
  setJournalEntry,
  setJournalOptIn,
} from '@/lib/atmosphere/journal-store';

export function useAtmosphereJournal(date?: string) {
  const [optIn, setOptIn] = useState(false);
  const [text, setText] = useState('');

  useEffect(() => {
    setOptIn(isJournalOptInEnabled());
    if (date) {
      setText(getJournalEntry(date));
    }
  }, [date]);

  const updateOptIn = useCallback((enabled: boolean) => {
    setJournalOptIn(enabled);
    setOptIn(enabled);
    if (!enabled && date) {
      setJournalEntry(date, '');
      setText('');
    }
  }, [date]);

  const updateText = useCallback(
    (nextText: string) => {
      const trimmed = nextText.slice(0, 280);
      setText(trimmed);
      if (date) {
        setJournalEntry(date, trimmed);
      }
    },
    [date]
  );

  return {
    optIn,
    text,
    setOptIn: updateOptIn,
    setText: updateText,
  };
}