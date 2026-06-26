import 'server-only';

import { calculateBirthChart } from '@/lib/engine';
import { calculateBirthChart as calculateBirthChartFallback } from '@/lib/engine-fallback';
import { computeProfectionFromBirth } from '@/lib/astrology/profections';
import { resolveBodyLongitude } from '@/lib/astrology/returns-ephemeris.server';
import type { SolarReturnBriefing } from '@/lib/astrology/returns-types';
import {
  daysBetween,
  findReturnMomentInWindow,
} from '@/lib/astrology/returns-utils';
import type { BirthChartData, PlanetPosition } from '@/types/astrology';

export type { SolarReturnBriefing } from '@/lib/astrology/returns-types';

const BIRTHDAY_WINDOW_DAYS = 30;

function buildSolarReturnHighlights(positions: PlanetPosition[]): string[] {
  const sun = positions.find((planet) => planet.name === 'Sun');
  const moon = positions.find((planet) => planet.name === 'Moon');
  const venus = positions.find((planet) => planet.name === 'Venus');
  const saturn = positions.find((planet) => planet.name === 'Saturn');

  const highlights: string[] = [];
  if (sun) highlights.push(`Solar return Sun in ${sun.sign}`);
  if (moon) highlights.push(`Emotional tone set by Moon in ${moon.sign}`);
  if (venus) highlights.push(`Relational emphasis via Venus in ${venus.sign}`);
  if (saturn) highlights.push(`Structural lessons through Saturn in ${saturn.sign}`);
  return highlights.slice(0, 4);
}

function buildAnnualTheme(ascendantSign: string, moonSign: string, profectionTheme: string): string {
  return `Your ${ascendantSign} rising solar return frames the year around ${moonSign} emotional weather. ${profectionTheme}`;
}

export function findSolarReturnMoment(options: {
  natalSunLongitude: number;
  birthDate: string;
  birthTime: string;
  targetYear?: number;
}): { date: string; time: string; orb: number } | null {
  const birth = new Date(`${options.birthDate}T12:00:00`);
  if (Number.isNaN(birth.getTime())) return null;

  const targetYear = options.targetYear ?? new Date().getFullYear();
  const windowStart = new Date(targetYear, birth.getMonth(), birth.getDate() - 2, 12, 0, 0);
  const windowEnd = new Date(targetYear, birth.getMonth(), birth.getDate() + 2, 12, 0, 0);

  return findReturnMomentInWindow({
    natalLongitude: options.natalSunLongitude,
    startDate: windowStart,
    endDate: windowEnd,
    time: options.birthTime || '12:00',
    resolveLongitude: resolveBodyLongitude('Sun'),
    stepHours: 6,
  });
}

export function computeSolarReturnBriefing(options: {
  birthDate: string;
  birthTime: string;
  lat: number;
  lon: number;
  natalSunLongitude: number;
  ascendantSign: string;
  referenceDate?: Date;
}): SolarReturnBriefing | null {
  const referenceDate = options.referenceDate ?? new Date();
  const currentYear = referenceDate.getFullYear();
  const birth = new Date(`${options.birthDate}T12:00:00`);
  if (Number.isNaN(birth.getTime())) return null;

  const thisYearMoment = findSolarReturnMoment({
    natalSunLongitude: options.natalSunLongitude,
    birthDate: options.birthDate,
    birthTime: options.birthTime,
    targetYear: currentYear,
  });

  const nextYearMoment =
    thisYearMoment &&
    new Date(`${thisYearMoment.date}T${thisYearMoment.time}`) < referenceDate
      ? findSolarReturnMoment({
          natalSunLongitude: options.natalSunLongitude,
          birthDate: options.birthDate,
          birthTime: options.birthTime,
          targetYear: currentYear + 1,
        })
      : null;

  const activeMoment = (() => {
    if (!thisYearMoment) return nextYearMoment;
    const momentDate = new Date(`${thisYearMoment.date}T${thisYearMoment.time}`);
    if (momentDate < referenceDate && nextYearMoment) return nextYearMoment;
    return thisYearMoment;
  })();

  if (!activeMoment) return null;

  let chart: BirthChartData;
  try {
    chart = calculateBirthChart(activeMoment.date, activeMoment.time, options.lat, options.lon) as BirthChartData;
  } catch {
    chart = calculateBirthChartFallback(
      activeMoment.date,
      activeMoment.time,
      options.lat,
      options.lon
    ) as BirthChartData;
  }

  const positions = chart.positions || chart.planets || [];
  const sun = positions.find((planet) => planet.name === 'Sun');
  const moon = positions.find((planet) => planet.name === 'Moon');
  const ascendantSign = chart.ascendant?.sign || options.ascendantSign || 'Unknown';
  const moonSign = moon?.sign || 'Unknown';
  const profection = computeProfectionFromBirth(options.ascendantSign, options.birthDate, referenceDate);
  const returnDateObj = new Date(`${activeMoment.date}T${activeMoment.time}`);
  const isUpcoming = returnDateObj >= referenceDate;
  const daysToReturn = isUpcoming ? daysBetween(referenceDate, returnDateObj) : 0;
  const daysSinceReturn = isUpcoming ? 0 : daysBetween(returnDateObj, referenceDate);
  const windowDistance = isUpcoming ? daysToReturn : daysSinceReturn;

  return {
    returnDate: activeMoment.date,
    returnTime: activeMoment.time,
    returnYear: returnDateObj.getFullYear(),
    daysToReturn,
    daysSinceReturn,
    isBirthdayWindow: windowDistance <= BIRTHDAY_WINDOW_DAYS,
    ascendantSign,
    sunSign: sun?.sign || 'Unknown',
    moonSign,
    highlights: buildSolarReturnHighlights(positions),
    annualTheme: buildAnnualTheme(ascendantSign, moonSign, profection.themeOfYear),
    profectionTheme: profection.themeOfYear,
    chart: {
      positions,
      ascendant: chart.ascendant,
      mc: chart.mc,
      houses: chart.houses,
    },
  };
}