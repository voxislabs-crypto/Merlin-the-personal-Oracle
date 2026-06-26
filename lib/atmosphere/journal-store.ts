const JOURNAL_PREFIX = 'merlin_atmosphere_journal_';
const JOURNAL_OPT_IN_KEY = 'merlin_atmosphere_journal_opt_in';

export function isJournalOptInEnabled(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    return localStorage.getItem(JOURNAL_OPT_IN_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setJournalOptIn(enabled: boolean): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(JOURNAL_OPT_IN_KEY, enabled ? 'true' : 'false');
  } catch {
    // localStorage failures should never block the dashboard
  }
}

export function getJournalEntry(date: string): string {
  if (typeof window === 'undefined' || !date) return '';

  try {
    return localStorage.getItem(`${JOURNAL_PREFIX}${date}`) || '';
  } catch {
    return '';
  }
}

export function setJournalEntry(date: string, text: string): void {
  if (typeof window === 'undefined' || !date) return;

  try {
    const trimmed = text.slice(0, 280);
    if (!trimmed) {
      localStorage.removeItem(`${JOURNAL_PREFIX}${date}`);
      return;
    }
    localStorage.setItem(`${JOURNAL_PREFIX}${date}`, trimmed);
  } catch {
    // localStorage failures should never block the dashboard
  }
}