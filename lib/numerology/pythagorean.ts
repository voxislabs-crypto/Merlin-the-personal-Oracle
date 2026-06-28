export type CoreNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 11 | 22 | 33;

const MASTER_NUMBERS = new Set([11, 22, 33]);

const PYTHAGOREAN_CHART: Record<string, number> = {
  a: 1,
  b: 2,
  c: 3,
  d: 4,
  e: 5,
  f: 6,
  g: 7,
  h: 8,
  i: 9,
  j: 1,
  k: 2,
  l: 3,
  m: 4,
  n: 5,
  o: 6,
  p: 7,
  q: 8,
  r: 9,
  s: 1,
  t: 2,
  u: 3,
  v: 4,
  w: 5,
  x: 6,
  y: 7,
  z: 8,
};

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

export function reduceNumber(value: number, keepMasters = true): CoreNumber {
  if (!Number.isFinite(value) || value <= 0) return 1;
  if (keepMasters && MASTER_NUMBERS.has(value)) return value as CoreNumber;

  let current = Math.abs(Math.trunc(value));
  while (current > 9) {
    if (keepMasters && MASTER_NUMBERS.has(current)) {
      return current as CoreNumber;
    }
    current = current
      .toString()
      .split('')
      .reduce((sum, digit) => sum + Number.parseInt(digit, 10), 0);
  }

  return current as CoreNumber;
}

export function letterValue(char: string): number {
  return PYTHAGOREAN_CHART[char.toLowerCase()] ?? 0;
}

export function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, '');
}

export function sumLetters(name: string, filter?: 'vowels' | 'consonants'): number {
  const normalized = normalizeName(name);
  if (!normalized) return 0;

  return normalized.split('').reduce((sum, char) => {
    if (filter === 'vowels' && !VOWELS.has(char)) return sum;
    if (filter === 'consonants' && VOWELS.has(char)) return sum;
    return sum + letterValue(char);
  }, 0);
}

export function parseBirthDate(date: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  if (!match) return null;

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

export function calculateLifePath(birthDate: string): CoreNumber | null {
  const parts = parseBirthDate(birthDate);
  if (!parts) return null;

  const total =
    reduceNumber(parts.year, false) +
    reduceNumber(parts.month, false) +
    reduceNumber(parts.day, false);

  return reduceNumber(total);
}

export function calculateDestiny(fullName: string): CoreNumber | null {
  const total = sumLetters(fullName);
  if (!total) return null;
  return reduceNumber(total);
}

export function calculateSoulUrge(fullName: string): CoreNumber | null {
  const total = sumLetters(fullName, 'vowels');
  if (!total) return null;
  return reduceNumber(total);
}

export function calculatePersonality(fullName: string): CoreNumber | null {
  const total = sumLetters(fullName, 'consonants');
  if (!total) return null;
  return reduceNumber(total);
}

export function calculatePersonalYear(birthDate: string, referenceDate = new Date()): CoreNumber | null {
  const parts = parseBirthDate(birthDate);
  if (!parts) return null;

  const monthDay = reduceNumber(parts.month, false) + reduceNumber(parts.day, false);
  const year = reduceNumber(referenceDate.getFullYear(), false);
  return reduceNumber(monthDay + year);
}

export function calculatePersonalMonth(
  birthDate: string,
  referenceDate = new Date()
): CoreNumber | null {
  const personalYear = calculatePersonalYear(birthDate, referenceDate);
  if (!personalYear) return null;

  const month = reduceNumber(referenceDate.getMonth() + 1, false);
  return reduceNumber(personalYear + month);
}

export function calculatePersonalDay(
  birthDate: string,
  referenceDate = new Date()
): CoreNumber | null {
  const personalMonth = calculatePersonalMonth(birthDate, referenceDate);
  if (!personalMonth) return null;

  const day = reduceNumber(referenceDate.getDate(), false);
  return reduceNumber(personalMonth + day);
}

export interface NumerologyBlueprint {
  birthDate: string;
  fullName: string;
  lifePath: CoreNumber | null;
  destiny: CoreNumber | null;
  soulUrge: CoreNumber | null;
  personality: CoreNumber | null;
  personalYear: CoreNumber | null;
  personalMonth: CoreNumber | null;
  personalDay: CoreNumber | null;
  referenceDate: string;
}

export function buildNumerologyBlueprint(
  birthDate: string,
  fullName: string,
  referenceDate = new Date()
): NumerologyBlueprint {
  return {
    birthDate,
    fullName,
    lifePath: calculateLifePath(birthDate),
    destiny: calculateDestiny(fullName),
    soulUrge: calculateSoulUrge(fullName),
    personality: calculatePersonality(fullName),
    personalYear: calculatePersonalYear(birthDate, referenceDate),
    personalMonth: calculatePersonalMonth(birthDate, referenceDate),
    personalDay: calculatePersonalDay(birthDate, referenceDate),
    referenceDate: referenceDate.toISOString().slice(0, 10),
  };
}