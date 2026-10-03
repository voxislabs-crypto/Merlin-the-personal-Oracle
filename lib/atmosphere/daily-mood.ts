import { rewriteLayReason } from '@/lib/astrology/pressure-engine/lay-reason';

export type DailyMoodView = {
  word: string;
  line: string;
};

export type ComposeDailyMoodInput = {
  /** Lasting transit theme, held across days when it still applies. */
  themeLabel?: string | null;
  /** Dominant driver / chart reason for that transit. */
  transitReason?: string | null;
  /** Today's focus-area mood line from the daily forecast. */
  dailyMood?: string | null;
  /** Today's forecast summary — the astrology reading. */
  dailySummary?: string | null;
  moonSign?: string | null;
  dayRating?: string | null;
};

type DayFeel = 'open' | 'mixed' | 'heavy' | 'shifting';

const FEEL_WORD: Record<DayFeel, string> = {
  open: 'Open',
  mixed: 'Mixed',
  heavy: 'Heavy',
  shifting: 'Shifting',
};

function clean(value?: string | null): string {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function firstSentence(value?: string | null): string {
  const text = clean(value);
  if (!text) return '';
  const match = text.match(/^(.+?[.!?])(?:\s|$)/);
  return (match ? match[1] : text).trim();
}

function ensurePeriod(value: string): string {
  const text = clean(value);
  if (!text) return '';
  if (/[.!?]$/.test(text)) return text;
  return `${text}.`;
}

function stripEndPunct(value: string): string {
  return value.replace(/[.!?]+$/, '').trim();
}

function lowerFirst(value: string): string {
  if (!value) return value;
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function sameOpening(left: string, right: string): boolean {
  const a = left.toLowerCase().slice(0, 42);
  const b = right.toLowerCase().slice(0, 42);
  return Boolean(a) && a === b;
}

function dayFeel(dayRating?: string | null): DayFeel {
  const rating = (dayRating || '').trim().toLowerCase();
  if (rating === 'green' || rating === 'positive' || rating === 'very positive') return 'open';
  if (rating === 'red' || rating === 'challenging' || rating === 'very challenging') return 'heavy';
  if (rating === 'yellow' || rating === 'neutral') return 'mixed';
  return 'shifting';
}

function moodWord(feel: DayFeel, moonSign: string, theme: string): string {
  if (feel === 'shifting' && !moonSign && theme) return theme;
  const feelWord = FEEL_WORD[feel];
  return moonSign ? `${feelWord} · Moon in ${moonSign}` : feelWord;
}

function transitAnchor(theme: string, transitReason?: string | null): string {
  const raw = clean(transitReason);
  const reason = raw ? stripEndPunct(rewriteLayReason(raw)) : '';
  if (theme) {
    if (reason) return `Longer transit: ${theme} — ${lowerFirst(reason)}.`;
    return `Longer transit: ${theme}.`;
  }
  if (reason) return ensurePeriod(reason.charAt(0).toUpperCase() + reason.slice(1));
  return '';
}

/**
 * Mood box copy: today's feeling and the day's reading, then the lasting transit.
 * The word moves with the day rating and the Moon. The theme stays in the sentence.
 */
export function readForecastMood(focusAreas: unknown): string | null {
  if (!focusAreas || typeof focusAreas !== 'object') return null;
  const mood = (focusAreas as { mood?: unknown }).mood;
  return typeof mood === 'string' && mood.trim() ? mood.trim() : null;
}

export function composeDailyMood(input: ComposeDailyMoodInput): DailyMoodView {
  const theme = clean(input.themeLabel);
  const moonSign = clean(input.moonSign);
  const feel = dayFeel(input.dayRating);
  const word = moodWord(feel, moonSign, theme);

  const moodLine = firstSentence(input.dailyMood);
  const readingLine = firstSentence(input.dailySummary);
  const daily = [moodLine, readingLine]
    .filter((sentence, index, all) => sentence && !all.slice(0, index).some((earlier) => sameOpening(earlier, sentence)))
    .map((sentence) => ensurePeriod(sentence))
    .join(' ');
  const anchor = transitAnchor(theme, input.transitReason);
  const line = [daily, anchor].filter(Boolean).join(' ');

  if (line) return { word, line };
  return {
    word: word || 'Today',
    line: 'The day is still settling. The longer transit will show once the reading lands.',
  };
}
