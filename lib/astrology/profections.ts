import { ZODIAC_SIGNS, type ZodiacSignName } from '@/lib/astrology/zodiac';

const SIGN_NAMES = ZODIAC_SIGNS.map((sign) => sign.name);

/** Traditional time lords for annual profections. */
const TIME_LORD_BY_SIGN: Record<ZodiacSignName, string> = {
  Aries: 'Mars',
  Taurus: 'Venus',
  Gemini: 'Mercury',
  Cancer: 'Moon',
  Leo: 'Sun',
  Virgo: 'Mercury',
  Libra: 'Venus',
  Scorpio: 'Mars',
  Sagittarius: 'Jupiter',
  Capricorn: 'Saturn',
  Aquarius: 'Saturn',
  Pisces: 'Jupiter',
};

const TIME_LORD_THEMES: Record<string, string> = {
  Sun: 'visibility, vitality, and leadership themes take center stage',
  Moon: 'home, emotional security, and body rhythms dominate the year',
  Mercury: 'communication, learning, and local decisions carry extra weight',
  Venus: 'relationships, values, and creative magnetism shape the annual plot',
  Mars: 'drive, conflict, and decisive action become harder to ignore',
  Jupiter: 'growth, opportunity, and expansion themes open wider doors',
  Saturn: 'structure, accountability, and long-horizon discipline define the year',
};

export interface AnnualProfection {
  age: number;
  profectedHouse: number;
  profectedSign: ZodiacSignName;
  timeLord: string;
  themeOfYear: string;
}

function normalizeSignName(sign: string): ZodiacSignName | null {
  const match = SIGN_NAMES.find((name) => name.toLowerCase() === sign.trim().toLowerCase());
  return match ?? null;
}

export function getSignAtOffset(ascendantSign: string, offset: number): ZodiacSignName {
  const normalizedAsc = normalizeSignName(ascendantSign);
  if (!normalizedAsc) {
    throw new Error(`Unknown ascendant sign: ${ascendantSign}`);
  }

  const ascIndex = SIGN_NAMES.indexOf(normalizedAsc);
  const targetIndex = ((ascIndex + offset) % 12 + 12) % 12;
  return SIGN_NAMES[targetIndex];
}

export function getTimeLordForSign(sign: ZodiacSignName): string {
  return TIME_LORD_BY_SIGN[sign];
}

export function computeAnnualProfection(ascendantSign: string, age: number): AnnualProfection {
  const safeAge = Math.max(0, Math.floor(age));
  const houseOffset = safeAge % 12;
  const profectedSign = getSignAtOffset(ascendantSign, houseOffset);
  const timeLord = getTimeLordForSign(profectedSign);

  return {
    age: safeAge,
    profectedHouse: houseOffset + 1,
    profectedSign,
    timeLord,
    themeOfYear: buildThemeOfYear(safeAge, profectedSign, timeLord),
  };
}

export function buildThemeOfYear(age: number, profectedSign: ZodiacSignName, timeLord: string): string {
  const theme = TIME_LORD_THEMES[timeLord] || 'a focused annual chapter in your chart story';
  return `Age ${age}: ${profectedSign} profection year with ${timeLord} as time lord — ${theme}.`;
}

export function computeAgeYears(birthDate: string, referenceDate: Date = new Date()): number {
  const birth = new Date(birthDate.includes('T') ? birthDate : `${birthDate}T12:00:00`);
  if (Number.isNaN(birth.getTime())) {
    return 0;
  }

  const diffMs = referenceDate.getTime() - birth.getTime();
  return Math.max(0, diffMs / (365.25 * 24 * 60 * 60 * 1000));
}

export function computeProfectionFromBirth(
  ascendantSign: string,
  birthDate: string,
  referenceDate: Date = new Date()
): AnnualProfection {
  return computeAnnualProfection(ascendantSign, computeAgeYears(birthDate, referenceDate));
}