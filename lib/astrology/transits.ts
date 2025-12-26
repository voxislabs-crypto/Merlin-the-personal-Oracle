import { calc_ut, constants, utc_to_jd } from 'sweph';
import { PlanetPosition } from '@/types/astrology';

const normalizeAngle = (deg: number): number => ((deg % 360) + 360) % 360;

export const getCurrentTransits = (natalPlanets: PlanetPosition[]): Array<{
  transitingPlanet: string;
  natalPlanet: string;
  aspect: string;
  orb: number;
  exact: boolean;
}> => {
  const now = new Date();
  const jdResult = utc_to_jd(
    now.getUTCFullYear(),
    now.getUTCMonth() + 1,
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds(),
    constants.SE_GREG_CAL
  );
  const jd = jdResult.data[0];

  const currentPositions = natalPlanets.map(p => {
    const result = calc_ut(jd, getPlanetId(p.name), constants.SEFLG_SWIEPH);
    return {
      name: p.name,
      longitude: normalizeAngle(result.data[0]),
    };
  });

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

const getPlanetId = (name: string): number => {
  const map: Record<string, number> = {
    Sun: constants.SE_SUN,
    Moon: constants.SE_MOON,
    Mercury: constants.SE_MERCURY,
    Venus: constants.SE_VENUS,
    Mars: constants.SE_MARS,
    Jupiter: constants.SE_JUPITER,
    Saturn: constants.SE_SATURN,
    Uranus: constants.SE_URANUS,
    Neptune: constants.SE_NEPTUNE,
    Pluto: constants.SE_PLUTO,
    'North Node': constants.SE_MEAN_NODE,
  };
  return map[name] || constants.SE_SUN;
};
