import { PlanetPosition } from '@/types/astrology';

const normalizeAngle = (deg: number): number => ((deg % 360) + 360) % 360;

export const getCurrentTransits = (natalPlanets: PlanetPosition[]): Array<{
  transitingPlanet: string;
  natalPlanet: string;
  aspect: string;
  orb: number;
  exact: boolean;
  tags?: string[];
}> => {
  const now = new Date();

  // Pure JS Julian Day calculation
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();
  // Julian Day calculation (UTC)
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  const jd = jdn + (hour - 12) / 24 + minute / 1440;


  // Fallback: just return natal positions as current (no real transit calculation)
  // To implement real transits, use ephemeris or API
  const currentPositions = natalPlanets.map(p => ({
    name: p.name,
    longitude: normalizeAngle(p.longitude),
  }));

  const aspects = [];
  const major = [
    { type: 'Conjunction', angle: 0, orb: 10 },
    { type: 'Sextile', angle: 60, orb: 6 },
    { type: 'Square', angle: 90, orb: 8 },
    { type: 'Trine', angle: 120, orb: 8 },
    { type: 'Opposition', angle: 180, orb: 10 },
  ];

  for (const trans of currentPositions) {
    for (const natal of natalPlanets) {
      let diff = Math.abs(trans.longitude - natal.longitude);
      if (diff > 180) diff = 360 - diff;

      for (const asp of major) {
        if (Math.abs(diff - asp.angle) <= asp.orb) {
          aspects.push({
            transitingPlanet: trans.name,
            natalPlanet: natal.name,
            aspect: asp.type,
            orb: Math.abs(diff - asp.angle),
            exact: Math.abs(diff - asp.angle) < 1,
          });
          break;
        }
      }
    }
  }

  return aspects;
};

// getPlanetId and constants removed (no sweph)
