export type WeeklyCharacter = {
  title: string;
  strength: string;
  blindSpot: string;
};

export type WeeklyCharacterBase = WeeklyCharacter;

const POSTURES: WeeklyCharacter[] = [
  {
    title: 'The Early Reader',
    strength: 'naming what is already happening',
    blindSpot: 'studying it instead of moving',
  },
  {
    title: 'The Boundary Setter',
    strength: 'one limit that protects the rest of the week',
    blindSpot: 'absorbing everyone else’s urgency',
  },
  {
    title: 'The One Honest Line',
    strength: 'saying the true thing once, cleanly',
    blindSpot: 'editing it until it means nothing',
  },
  {
    title: 'The Quiet Closer',
    strength: 'finishing one open loop',
    blindSpot: 'opening a new plot to avoid the old one',
  },
  {
    title: 'The Signal Keeper',
    strength: 'trusting the signal you already have',
    blindSpot: 'waiting for one more confirmation',
  },
  {
    title: 'The Careful Spark',
    strength: 'a small start with a stop time',
    blindSpot: 'lighting three fires',
  },
  {
    title: 'The Map Maker',
    strength: 'turning the week into one route',
    blindSpot: 'redrawing the map instead of walking it',
  },
  {
    title: 'The Useful Pause',
    strength: 'a deliberate stop before the costly yes',
    blindSpot: 'calling avoidance rest',
  },
];

const SIGNS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
] as const;

/** ISO week number for a YYYY-MM-DD date. Same number all week, next number the next week. */
export function isoWeekNumber(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, (month || 1) - 1, day || 1));
  const weekday = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - weekday);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function dominantSign(whispers?: Array<{ whisper?: string | null }> | null): string | null {
  const counts = new Map<string, number>();
  for (const row of whispers || []) {
    const text = row.whisper || '';
    for (const sign of SIGNS) {
      const hits = text.match(new RegExp(`\\b${sign}\\b`, 'g'));
      if (hits?.length) counts.set(sign, (counts.get(sign) || 0) + hits.length);
    }
  }
  let best: string | null = null;
  let bestCount = 0;
  // Map iteration needs ES2015+ or downlevelIteration; this project targets ES5.
  counts.forEach((count, sign) => {
    if (count > bestCount) {
      best = sign;
      bestCount = count;
    }
  });
  return best;
}

function ensurePeriod(value: string): string {
  const text = value.replace(/\s+/g, ' ').trim();
  if (!text) return '';
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

/**
 * The core name (Pattern Witness, Quiet Knower) stays.
 * The headline rotates once per ISO week so "this week" is not last week's card.
 * The week's Moon, when the whispers name one, colors the strength line.
 */
export function composeWeeklyCharacter(input: {
  base?: WeeklyCharacterBase | null;
  weekOf?: string | null;
  whispers?: Array<{ whisper?: string | null }> | null;
}): (WeeklyCharacter & { coreTitle: string }) | null {
  const base = input.base;
  if (!base?.title) return null;
  const weekOf = input.weekOf && /^\d{4}-\d{2}-\d{2}$/.test(input.weekOf) ? input.weekOf : '2026-01-05';
  const posture = POSTURES[isoWeekNumber(weekOf) % POSTURES.length];
  const sign = dominantSign(input.whispers);
  const sky = sign ? ` The Moon's loudest sign in this window is ${sign}.` : '';
  return {
    title: posture.title,
    coreTitle: base.title,
    strength: `${ensurePeriod(base.strength)} This week that shows up as ${posture.strength}.${sky}`,
    blindSpot: `${ensurePeriod(base.blindSpot)} This week that gets louder if you slip into ${posture.blindSpot}.`,
  };
}
