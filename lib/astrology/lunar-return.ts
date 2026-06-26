import 'server-only';

import { calculateBirthChart } from '@/lib/engine';
import { calculateBirthChart as calculateBirthChartFallback } from '@/lib/engine-fallback';
import { resolveBodyLongitude } from '@/lib/astrology/returns-ephemeris.server';
import type { LunarEmotionalTone, LunarReturnWeather } from '@/lib/astrology/returns-types';
import {
  addDays,
  daysBetween,
  findReturnMomentInWindow,
  formatDateYmd,
} from '@/lib/astrology/returns-utils';
import type { BirthChartData, PlanetPosition } from '@/types/astrology';

export type { LunarEmotionalTone, LunarReturnWeather } from '@/lib/astrology/returns-types';

const LUNAR_CYCLE_DAYS = 27.321582;

const MOON_SIGN_TONE: Record<string, LunarEmotionalTone> = {
  Taurus: 'supportive',
  Cancer: 'supportive',
  Virgo: 'reflective',
  Capricorn: 'reflective',
  Pisces: 'open',
  Sagittarius: 'open',
  Gemini: 'volatile',
  Aries: 'volatile',
  Leo: 'open',
  Libra: 'supportive',
  Scorpio: 'volatile',
  Aquarius: 'reflective',
};

const TONE_COPY: Record<LunarEmotionalTone, { headline: string; guidance: string }> = {
  supportive: {
    headline: 'Nurturing lunar weather — stabilize routines and protect what feels good.',
    guidance: 'Use this cycle to reinforce habits, soften your nervous system, and invest in trusted people.',
  },
  volatile: {
    headline: 'Reactive lunar weather — feelings move faster than usual.',
    guidance: 'Pause before responding, reduce stimulation, and treat spikes as information rather than verdicts.',
  },
  reflective: {
    headline: 'Processing lunar weather — integration matters more than output.',
    guidance: 'Journal, rest, and edit commitments. Clarity arrives when you stop forcing momentum.',
  },
  open: {
    headline: 'Expansive lunar weather — curiosity and emotional honesty are available.',
    guidance: 'Say what you mean, explore one new angle, and let connection widen without overcommitting.',
  },
};

function resolveEmotionalTone(moonSign: string, positions: PlanetPosition[]): LunarEmotionalTone {
  const base = MOON_SIGN_TONE[moonSign] || 'reflective';
  const moon = positions.find((planet) => planet.name === 'Moon');
  const mars = positions.find((planet) => planet.name === 'Mars');
  const saturn = positions.find((planet) => planet.name === 'Saturn');

  if (!moon || !mars || !saturn) return base;

  const moonMarsDiff = Math.abs(((moon.longitude - mars.longitude) % 360) + 360) % 360;
  const moonSaturnDiff = Math.abs(((moon.longitude - saturn.longitude) % 360) + 360) % 360;

  if (moonMarsDiff <= 10 || moonMarsDiff >= 350) return 'volatile';
  if (moonSaturnDiff <= 12 || moonSaturnDiff >= 348) return 'reflective';
  return base;
}

function buildLunarHighlights(positions: PlanetPosition[]): string[] {
  const moon = positions.find((planet) => planet.name === 'Moon');
  const venus = positions.find((planet) => planet.name === 'Venus');
  const mercury = positions.find((planet) => planet.name === 'Mercury');

  const highlights: string[] = [];
  if (moon) highlights.push(`Lunar return Moon in ${moon.sign}`);
  if (venus) highlights.push(`Heart tone colored by Venus in ${venus.sign}`);
  if (mercury) highlights.push(`Mental weather via Mercury in ${mercury.sign}`);
  return highlights.slice(0, 3);
}

export function findLunarReturnMoment(options: {
  natalMoonLongitude: number;
  startDate: Date;
  endDate: Date;
  birthTime: string;
}): { date: string; time: string; orb: number } | null {
  return findReturnMomentInWindow({
    natalLongitude: options.natalMoonLongitude,
    startDate: options.startDate,
    endDate: options.endDate,
    time: options.birthTime || '12:00',
    resolveLongitude: resolveBodyLongitude('Moon'),
    stepHours: 3,
  });
}

export function computeLunarReturnWeather(options: {
  birthDate: string;
  birthTime: string;
  lat: number;
  lon: number;
  natalMoonLongitude: number;
  referenceDate?: Date;
}): LunarReturnWeather | null {
  const referenceDate = options.referenceDate ?? new Date();
  const searchStart = addDays(referenceDate, -16);
  const searchEnd = addDays(referenceDate, 16);

  const currentReturn = findLunarReturnMoment({
    natalMoonLongitude: options.natalMoonLongitude,
    startDate: searchStart,
    endDate: referenceDate,
    birthTime: options.birthTime,
  });

  const nextReturn = findLunarReturnMoment({
    natalMoonLongitude: options.natalMoonLongitude,
    startDate: addDays(referenceDate, 1),
    endDate: addDays(referenceDate, 30),
    birthTime: options.birthTime,
  });

  const activeReturn =
    currentReturn &&
    daysBetween(new Date(`${currentReturn.date}T12:00:00`), referenceDate) <= Math.ceil(LUNAR_CYCLE_DAYS)
      ? currentReturn
      : nextReturn;

  if (!activeReturn) return null;

  let chart: BirthChartData;
  try {
    chart = calculateBirthChart(activeReturn.date, activeReturn.time, options.lat, options.lon) as BirthChartData;
  } catch {
    chart = calculateBirthChartFallback(
      activeReturn.date,
      activeReturn.time,
      options.lat,
      options.lon
    ) as BirthChartData;
  }

  const positions = chart.positions || chart.planets || [];
  const moon = positions.find((planet) => planet.name === 'Moon');
  const moonSign = moon?.sign || 'Unknown';
  const ascendantSign = chart.ascendant?.sign || 'Unknown';
  const emotionalTone = resolveEmotionalTone(moonSign, positions);
  const toneCopy = TONE_COPY[emotionalTone];

  const returnDateObj = new Date(`${activeReturn.date}T12:00:00`);
  const nextReturnDate = nextReturn
    ? nextReturn.date
    : formatDateYmd(addDays(returnDateObj, Math.round(LUNAR_CYCLE_DAYS)));

  return {
    returnDate: activeReturn.date,
    returnTime: activeReturn.time,
    nextReturnDate,
    daysIntoCycle: Math.max(0, daysBetween(returnDateObj, referenceDate)),
    daysUntilNextReturn: Math.max(0, daysBetween(referenceDate, new Date(`${nextReturnDate}T12:00:00`))),
    moonSign,
    ascendantSign,
    emotionalTone,
    headline: toneCopy.headline,
    guidance: toneCopy.guidance,
    highlights: buildLunarHighlights(positions),
  };
}