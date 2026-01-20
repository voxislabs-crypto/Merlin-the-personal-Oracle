// lib/astrology/advanced.ts
import {
  BirthChartData,
  PlanetPosition,
  HousePosition,
  Aspect,
  AspectPattern,
  Midpoint,
  FixedStar,
  KarmicIndicator,
  ProgressedChart,
  ElectionalWindow,
  LunarPhase,
  Transit,
  Dignity,
} from "@/types/astrology";
let utc_to_jd: any, constants: any;
// Removed sweph logic: swephAvailable
try {
  // @ts-ignore
  // Removed all sweph require logic
} catch (e) {
  // sweph logic removed
}
import { normalizeAngle } from "@/lib/engine";

// Dignities (essential and accidental)
const DIGNITIES = {
  domicile: {
    Sun: ["Leo"],
    Moon: ["Cancer"],
    Mercury: ["Gemini", "Virgo"],
    Venus: ["Libra", "Taurus"],
    Mars: ["Aries", "Scorpio"],
    Jupiter: ["Sagittarius", "Pisces"],
    Saturn: ["Capricorn", "Aquarius"],
    Uranus: ["Aquarius"],
    Neptune: ["Pisces"],
    Pluto: ["Scorpio"],
  },
  exaltation: {
    Sun: ["19° Aries"],
    Moon: ["3° Taurus"],
    Mercury: ["15° Virgo"],
    Venus: ["27° Pisces"],
    Mars: ["28° Capricorn"],
    Jupiter: ["15° Cancer"],
    Saturn: ["21° Libra"],
    Uranus: ["14° Sagittarius"],
    Neptune: ["5° Cancer"],
    Pluto: ["27° Virgo"],
  },
  detriment: {
    Sun: ["Aquarius"],
    Moon: ["Capricorn"],
    Mercury: ["Sagittarius", "Pisces"],
    Venus: ["Aries", "Scorpio"],
    Mars: ["Libra", "Taurus"],
    Jupiter: ["Gemini", "Virgo"],
    Saturn: ["Cancer", "Leo"],
    Uranus: ["Leo"],
    Neptune: ["Virgo"],
    Pluto: ["Taurus"],
  },
  fall: {
    Sun: ["Libra"],
    Moon: ["Scorpio"],
    Mercury: ["Pisces"],
    Venus: ["Virgo"],
    Mars: ["Cancer"],
    Jupiter: ["Capricorn"],
    Saturn: ["Aries"],
    Uranus: ["Gemini"],
    Neptune: ["Sagittarius"],
    Pluto: ["Leo"],
  },
  triplicity: {
    Fire: ["Aries", "Leo", "Sagittarius"],
    Earth: ["Taurus", "Virgo", "Capricorn"],
    Air: ["Gemini", "Libra", "Aquarius"],
    Water: ["Cancer", "Scorpio", "Pisces"],
  },
  terms: {
    // Simplified term rulerships - would need full table in production
    Aries: {
      Mars: [0, 6],
      Sun: [6, 12],
      Venus: [12, 18],
      Mercury: [18, 24],
      Jupiter: [24, 30],
    },
    Taurus: {
      Venus: [0, 8],
      Mercury: [8, 15],
      Jupiter: [15, 21],
      Saturn: [21, 26],
      Mars: [26, 30],
    },
    // Add all signs...
  },
  faces: {
    // Face rulerships (every 10°)
    Aries: { Mars: [0, 10], Sun: [10, 20], Jupiter: [20, 30] },
    Taurus: { Mercury: [0, 10], Moon: [10, 20], Saturn: [20, 30] },
    // Add all signs...
  },
};

const DIGNITY_SCORES = {
  domicile: 5,
  exaltation: 4,
  detriment: -5,
  fall: -4,
  triplicity: 3,
  term: 2,
  face: 1,
};

export const calculateDignities = (
  planets: PlanetPosition[]
): PlanetPosition[] => {
  return planets.map((p) => {
    const dignities: Dignity[] = [];
    const planetName = p.name as keyof typeof DIGNITIES.domicile;

    // Check domicile
    const domicileSigns = DIGNITIES.domicile[planetName];
    if (domicileSigns && p.sign && domicileSigns.includes(p.sign)) {
      dignities.push({
        type: "Domicile",
        score: DIGNITY_SCORES.domicile,
        description: `${p.name} is in its domicile in ${p.sign}, expressing its nature with maximum strength and authenticity.`,
      });
    }

    // Check exaltation (with degree precision)
    const exaltationPositions = DIGNITIES.exaltation[planetName];
    if (exaltationPositions && p.sign) {
      for (const exaltPos of exaltationPositions) {
        if (exaltPos.includes("°")) {
          const [degreeStr, sign] = exaltPos.split(" ");
          const exaltDegree = parseFloat(degreeStr);
          if (sign === p.sign && Math.abs(p.degree - exaltDegree) <= 1) {
            dignities.push({
              type: "Exaltation",
              score: DIGNITY_SCORES.exaltation,
              description: `${p.name} is exalted in ${p.sign} at ${exaltDegree}°, bringing honor and elevated expression.`,
            });
            break;
          }
        }
      }
    }

    // Check detriment
    const detrimentSigns = DIGNITIES.detriment[planetName];
    if (detrimentSigns && p.sign && detrimentSigns.includes(p.sign)) {
      dignities.push({
        type: "Detriment",
        score: DIGNITY_SCORES.detriment,
        description: `${p.name} is in detriment in ${p.sign}, challenging its natural expression and requiring adaptation.`,
      });
    }

    // Check fall (with degree precision)
    const fallPositions = DIGNITIES.fall[planetName];
    if (fallPositions && p.sign) {
      for (const fallPos of fallPositions) {
        if (fallPos.includes("°")) {
          const [degreeStr, sign] = fallPos.split(" ");
          const fallDegree = parseFloat(degreeStr);
          if (sign === p.sign && Math.abs(p.degree - fallDegree) <= 1) {
            dignities.push({
              type: "Fall",
              score: DIGNITY_SCORES.fall,
              description: `${p.name} is in fall in ${p.sign} at ${fallDegree}°, indicating challenges and lessons in humility.`,
            });
            break;
          }
        }
      }
    }

    // Check triplicity
    Object.entries(DIGNITIES.triplicity).forEach(([element, signs]) => {
      if (signs.includes(p.sign)) {
        dignities.push({
          type: "Triplicity",
          score: DIGNITY_SCORES.triplicity,
          description: `${p.name} in ${p.sign} gains strength from ${element} triplicity, supporting its elemental nature.`,
        });
      }
    });

    // Check terms (simplified)
    const termRulers = DIGNITIES.terms[p.sign as keyof typeof DIGNITIES.terms];
    if (termRulers) {
      Object.entries(termRulers).forEach(([ruler, [start, end]]) => {
        if (ruler === p.name && p.degree >= start && p.degree < end) {
          dignities.push({
            type: "Term",
            score: DIGNITY_SCORES.term,
            description: `${p.name} has term dignity in ${p.sign} from ${start}°-${end}°, providing minor strength and protection.`,
          });
        }
      });
    }

    // Check faces (simplified)
    const faceRulers = DIGNITIES.faces[p.sign as keyof typeof DIGNITIES.faces];
    if (faceRulers) {
      Object.entries(faceRulers).forEach(([ruler, [start, end]]) => {
        if (ruler === p.name && p.degree >= start && p.degree < end) {
          dignities.push({
            type: "Face",
            score: DIGNITY_SCORES.face,
            description: `${p.name} has face dignity in ${p.sign} from ${start}°-${end}°, giving subtle support and charm.`,
          });
        }
      });
    }

    return { ...p, dignities };
  });
};

// Comprehensive Aspect Pattern Detection
export const detectPatterns = (
  planets: PlanetPosition[],
  aspects: Aspect[]
): AspectPattern[] => {
  const patterns: AspectPattern[] = [];

  // Grand Trine: 3 trines forming triangle
  const grandTrines = findGrandTrines(planets, aspects);
  grandTrines.forEach((trine) => {
    patterns.push({
      type: "Grand Trine",
      planets: trine.planets,
      description: `A flowing, harmonious aspect pattern between ${trine.planets.join(
        ", "
      )}, indicating natural talents and ease in the areas ruled by these planets and houses.`,
      strength: 0.9,
      quality: "harmonious",
    });
  });

  // T-Square: 2 oppositions + 2 squares
  const tSquares = findTSquares(planets, aspects);
  tSquares.forEach((tsquare) => {
    patterns.push({
      type: "T-Square",
      planets: tsquare.planets,
      description: `A dynamic aspect pattern creating tension and motivation, with focal point at ${tsquare.focalPlanet}. This configuration drives growth through overcoming challenges.`,
      strength: 0.8,
      focalPlanet: tsquare.focalPlanet,
      quality: "dynamic",
    });
  });

  // Grand Cross: 2 oppositions + 4 squares (grand square)
  const grandCrosses = findGrandCrosses(planets, aspects);
  grandCrosses.forEach((cross) => {
    patterns.push({
      type: "Grand Cross",
      planets: cross.planets,
      description: `A powerful aspect pattern between ${cross.planets.join(
        ", "
      )}, creating significant tension and the potential for major life transformation and achievement.`,
      strength: 0.85,
      quality: "tense",
    });
  });

  // Kite: Grand Trine + opposition to one planet
  const kites = findKites(planets, aspects);
  kites.forEach((kite) => {
    patterns.push({
      type: "Kite",
      planets: kite.planets,
      description: `A harmonious aspect pattern with a focus point at ${kite.focalPlanet}, combining the ease of a Grand Trine with the drive of an opposition for inspired action.`,
      strength: 0.82,
      focalPlanet: kite.focalPlanet,
      quality: "complex",
    });
  });

  // Mystic Rectangle: 2 oppositions + 2 sextiles + 2 trines
  const mysticRectangles = findMysticRectangles(planets, aspects);
  mysticRectangles.forEach((rectangle) => {
    patterns.push({
      type: "Mystic Rectangle",
      planets: rectangle.planets,
      description: `A harmonious and balanced aspect pattern between ${rectangle.planets.join(
        ", "
      )}, providing opportunities for creative problem-solving and spiritual growth.`,
      strength: 0.75,
      quality: "harmonious",
    });
  });

  // Yod: 2 quincunxes + 1 sextile (Finger of God)
  const yods = findYods(planets, aspects);
  yods.forEach((yod) => {
    patterns.push({
      type: "Yod",
      planets: yod.planets,
      description: `A fated aspect pattern with focus point at ${yod.focalPlanet}, indicating a special life purpose or destiny that requires adjustment and spiritual growth.`,
      strength: 0.7,
      focalPlanet: yod.focalPlanet,
      quality: "complex",
    });
  });

  // Stellium: 3+ planets in same sign
  const stelliums = findStelliums(planets);
  stelliums.forEach((stellium) => {
    patterns.push({
      type: "Stellium",
      planets: stellium.planets,
      description: `A concentration of energy in ${
        stellium.sign
      } with ${stellium.planets.join(
        ", "
      )}, creating intense focus and themes related to this sign and house.`,
      strength: 0.65,
      quality: "complex",
    });
  });

  return patterns.sort((a, b) => b.strength - a.strength);
};

// Helper functions for pattern detection
const findGrandTrines = (
  planets: PlanetPosition[],
  aspects: Aspect[]
): Array<{ planets: string[] }> => {
  const trines = aspects.filter((a) => a.type === "Trine");
  const planetTrines = new Map<string, string[]>();

  trines.forEach((a) => {
    if (!planetTrines.has(a.planet1.name)) planetTrines.set(a.planet1.name, []);
    if (!planetTrines.has(a.planet2.name)) planetTrines.set(a.planet2.name, []);
    planetTrines.get(a.planet1.name)!.push(a.planet2.name);
    planetTrines.get(a.planet2.name)!.push(a.planet1.name);
  });

  const grandTrines: Array<{ planets: string[] }> = [];

  // Find triangles of trines
  const planetTrinesEntries = Array.from(planetTrines.entries());
  for (const [p1, p1Aspects] of planetTrinesEntries) {
    for (const p2 of p1Aspects) {
      const p2Aspects = planetTrines.get(p2);
      if (p2Aspects) {
        for (const p3 of p2Aspects) {
          const p3Aspects = planetTrines.get(p3);
          if (p3Aspects && p3Aspects.includes(p1)) {
            const trineGroup = [p1, p2, p3].sort();
            const trineKey = trineGroup.join("-");
            if (
              !grandTrines.some(
                (gt) => gt.planets.sort().join("-") === trineKey
              )
            ) {
              grandTrines.push({ planets: trineGroup });
            }
          }
        }
      }
    }
  }

  return grandTrines;
};

const findTSquares = (
  planets: PlanetPosition[],
  aspects: Aspect[]
): Array<{ planets: string[]; focalPlanet: string }> => {
  const tSquares: Array<{ planets: string[]; focalPlanet: string }> = [];
  const oppositions = aspects.filter((a) => a.type === "Opposition");
  const squares = aspects.filter((a) => a.type === "Square");

  for (const opp of oppositions) {
    const p1 = opp.planet1.name;
    const p2 = opp.planet2.name;
    const p1Squares = squares.filter(
      (s) =>
        (s.planet1.name === p1 || s.planet2.name === p1) &&
        s.planet1.name !== p2 &&
        s.planet2.name !== p2
    );
    const p2Squares = squares.filter(
      (s) =>
        (s.planet1.name === p2 || s.planet2.name === p2) &&
        s.planet1.name !== p1 &&
        s.planet2.name !== p1
    );

    for (const s1 of p1Squares) {
      for (const s2 of p2Squares) {
        const focal1 =
          s1.planet1.name === p1 ? s1.planet2.name : s1.planet1.name;
        const focal2 =
          s2.planet1.name === p2 ? s2.planet2.name : s2.planet1.name;
        if (focal1 === focal2) {
          const planets = [p1, p2, focal1].sort();
          const key = planets.join("-");
          if (!tSquares.some((ts) => ts.planets.sort().join("-") === key)) {
            tSquares.push({ planets, focalPlanet: focal1 });
          }
        }
      }
    }
  }

  return tSquares;
};

const findGrandCrosses = (
  planets: PlanetPosition[],
  aspects: Aspect[]
): Array<{ planets: string[] }> => {
  const grandCrosses: Array<{ planets: string[] }> = [];
  const oppositions = aspects.filter((a) => a.type === "Opposition");
  const squares = aspects.filter((a) => a.type === "Square");

  // Look for two oppositions that are square to each other
  for (let i = 0; i < oppositions.length; i++) {
    for (let j = i + 1; j < oppositions.length; j++) {
      const opp1 = oppositions[i];
      const opp2 = oppositions[j];
      const planets1 = [opp1.planet1.name, opp1.planet2.name];
      const planets2 = [opp2.planet1.name, opp2.planet2.name];

      // Check if all planets are connected by squares
      const allPlanets = [...planets1, ...planets2];
      const uniquePlanets = Array.from(new Set(allPlanets));

      if (uniquePlanets.length === 4) {
        // Check for required squares
        let squareCount = 0;
        for (let k = 0; k < uniquePlanets.length; k++) {
          for (let l = k + 1; l < uniquePlanets.length; l++) {
            if (
              squares.some(
                (s) =>
                  (s.planet1.name === uniquePlanets[k] &&
                    s.planet2.name === uniquePlanets[l]) ||
                  (s.planet1.name === uniquePlanets[l] &&
                    s.planet2.name === uniquePlanets[k])
              )
            ) {
              squareCount++;
            }
          }
        }

        if (squareCount >= 4) {
          const key = uniquePlanets.sort().join("-");
          if (!grandCrosses.some((gc) => gc.planets.sort().join("-") === key)) {
            grandCrosses.push({ planets: uniquePlanets });
          }
        }
      }
    }
  }

  return grandCrosses;
};

const findKites = (
  planets: PlanetPosition[],
  aspects: Aspect[]
): Array<{ planets: string[]; focalPlanet: string }> => {
  const kites: Array<{ planets: string[]; focalPlanet: string }> = [];
  const grandTrines = findGrandTrines(planets, aspects);
  const oppositions = aspects.filter((a) => a.type === "Opposition");

  for (const trine of grandTrines) {
    for (const opp of oppositions) {
      // Check if opposition involves one planet from the trine and one outside
      const trineSet = new Set(trine.planets);
      const oppPlanet1 = opp.planet1.name;
      const oppPlanet2 = opp.planet2.name;

      if (
        (trineSet.has(oppPlanet1) && !trineSet.has(oppPlanet2)) ||
        (trineSet.has(oppPlanet2) && !trineSet.has(oppPlanet1))
      ) {
        const focalPlanet = trineSet.has(oppPlanet1) ? oppPlanet1 : oppPlanet2;
        const allPlanets = [
          ...trine.planets,
          trineSet.has(oppPlanet1) ? oppPlanet2 : oppPlanet1,
        ];

        kites.push({
          planets: allPlanets,
          focalPlanet,
        });
      }
    }
  }

  return kites;
};

const findMysticRectangles = (
  planets: PlanetPosition[],
  aspects: Aspect[]
): Array<{ planets: string[] }> => {
  const rectangles: Array<{ planets: string[] }> = [];
  const oppositions = aspects.filter((a) => a.type === "Opposition");
  const sextiles = aspects.filter((a) => a.type === "Sextile");
  const trines = aspects.filter((a) => a.type === "Trine");

  // Mystic Rectangle: 2 oppositions, 2 sextiles, 2 trines forming a rectangle
  for (let i = 0; i < oppositions.length; i++) {
    for (let j = i + 1; j < oppositions.length; j++) {
      const opp1 = oppositions[i];
      const opp2 = oppositions[j];
      const planets = [
        opp1.planet1.name,
        opp1.planet2.name,
        opp2.planet1.name,
        opp2.planet2.name,
      ];
      const uniquePlanets = Array.from(new Set(planets));

      if (uniquePlanets.length === 4) {
        // Check for required sextiles and trines
        let sextileCount = 0;
        let trineCount = 0;

        for (let k = 0; k < uniquePlanets.length; k++) {
          for (let l = k + 1; l < uniquePlanets.length; l++) {
            if (
              sextiles.some(
                (s) =>
                  (s.planet1.name === uniquePlanets[k] &&
                    s.planet2.name === uniquePlanets[l]) ||
                  (s.planet1.name === uniquePlanets[l] &&
                    s.planet2.name === uniquePlanets[k])
              )
            ) {
              sextileCount++;
            }
            if (
              trines.some(
                (t) =>
                  (t.planet1.name === uniquePlanets[k] &&
                    t.planet2.name === uniquePlanets[l]) ||
                  (t.planet1.name === uniquePlanets[l] &&
                    t.planet2.name === uniquePlanets[k])
              )
            ) {
              trineCount++;
            }
          }
        }

        if (sextileCount >= 2 && trineCount >= 2) {
          const key = uniquePlanets.sort().join("-");
          if (!rectangles.some((r) => r.planets.sort().join("-") === key)) {
            rectangles.push({ planets: uniquePlanets });
          }
        }
      }
    }
  }

  return rectangles;
};

const findYods = (
  planets: PlanetPosition[],
  aspects: Aspect[]
): Array<{ planets: string[]; focalPlanet: string }> => {
  const yods: Array<{ planets: string[]; focalPlanet: string }> = [];
  const quincunxes = aspects.filter((a) => a.type === "Quincunx");
  const sextiles = aspects.filter((a) => a.type === "Sextile");

  // Yod: 2 quincunxes pointing to same planet, with the other two planets sextile
  const planetMap = new Map<string, string[]>();

  quincunxes.forEach((q) => {
    if (!planetMap.has(q.planet1.name)) planetMap.set(q.planet1.name, []);
    if (!planetMap.has(q.planet2.name)) planetMap.set(q.planet2.name, []);
    planetMap.get(q.planet1.name)!.push(q.planet2.name);
    planetMap.get(q.planet2.name)!.push(q.planet1.name);
  });

  for (const [focal, connected] of Array.from(planetMap.entries())) {
    if (connected.length >= 2) {
      for (let i = 0; i < connected.length; i++) {
        for (let j = i + 1; j < connected.length; j++) {
          const planet1 = connected[i];
          const planet2 = connected[j];

          // Check if the two base planets are sextile
          if (
            sextiles.some(
              (s) =>
                (s.planet1.name === planet1 && s.planet2.name === planet2) ||
                (s.planet1.name === planet2 && s.planet2.name === planet1)
            )
          ) {
            yods.push({
              planets: [focal, planet1, planet2],
              focalPlanet: focal,
            });
          }
        }
      }
    }
  }

  return yods;
};

const findStelliums = (
  planets: PlanetPosition[]
): Array<{ planets: string[]; sign: string }> => {
  const stelliums: Array<{ planets: string[]; sign: string }> = [];
  const signGroups = new Map<string, string[]>();

  planets.forEach((p) => {
    if (!signGroups.has(p.sign)) signGroups.set(p.sign, []);
    signGroups.get(p.sign)!.push(p.name);
  });

  signGroups.forEach((planetList, sign) => {
    if (planetList.length >= 3) {
      stelliums.push({
        planets: planetList,
        sign,
      });
    }
  });

  return stelliums;
};

// Comprehensive Midpoints Calculation
export const calculateMidpoints = (planets: PlanetPosition[]): Midpoint[] => {
  const midpoints: Midpoint[] = [];

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i];
      const p2 = planets[j];

      // Calculate midpoint with proper 360° handling
      let midpointPos = (p1.longitude + p2.longitude) / 2;
      if (Math.abs(p1.longitude - p2.longitude) > 180) {
        midpointPos = ((p1.longitude + p2.longitude + 360) / 2) % 360;
      }
      midpointPos = normalizeAngle(midpointPos);

      // Get zodiac position
      const signs = [
        "Aries",
        "Taurus",
        "Gemini",
        "Cancer",
        "Leo",
        "Virgo",
        "Libra",
        "Scorpio",
        "Sagittarius",
        "Capricorn",
        "Aquarius",
        "Pisces",
      ];
      const normalized = normalizeAngle(midpointPos);
      const signIndex = Math.floor(normalized / 30);
      const degreeInSign = normalized % 30;
      const degree = Math.floor(degreeInSign);
      const minute = Math.floor((degreeInSign - degree) * 60);
      const second = Math.floor(((degreeInSign - degree) * 60 - minute) * 60);

      // Check aspects to other planets
      const planetAspects: Array<{
        planet: string;
        aspect: string;
        orb: number;
        influence: "positive" | "negative" | "neutral";
      }> = [];

      planets.forEach((planet) => {
        if (planet.name !== p1.name && planet.name !== p2.name) {
          const aspect = getAspect(midpointPos, planet.longitude, 3); // 3° orb for midpoints
          if (aspect) {
            const influence = getAspectInfluence(aspect.type);
            planetAspects.push({
              planet: planet.name,
              aspect: aspect.type,
              orb: aspect.difference,
              influence,
            });
          }
        }
      });

      // Generate interpretation
      const interpretation = getMidpointInterpretation(
        p1.name,
        p2.name,
        signs[signIndex],
        planetAspects
      );

      midpoints.push({
        point1: p1.name,
        point2: p2.name,
        position: midpointPos,
        sign: signs[signIndex],
        degree,
        minute,
        second,
        planetAspects,
        interpretation,
      });
    }
  }

  return midpoints;
};

// Helper function to get aspect between two points
const getAspect = (
  pos1: number,
  pos2: number,
  maxOrb: number
): { type: string; difference: number } | null => {
  const diff = Math.abs(((pos1 - pos2 + 180) % 360) - 180);

  const aspects = [
    { type: "Conjunction", angle: 0, orb: maxOrb },
    { type: "Sextile", angle: 60, orb: maxOrb },
    { type: "Square", angle: 90, orb: maxOrb },
    { type: "Trine", angle: 120, orb: maxOrb },
    { type: "Opposition", angle: 180, orb: maxOrb },
    { type: "Quincunx", angle: 150, orb: maxOrb },
  ];

  for (const aspect of aspects) {
    const orb = Math.min(aspect.orb, maxOrb);
    if (
      Math.abs(diff - aspect.angle) <= orb ||
      Math.abs(diff - (360 - aspect.angle)) <= orb
    ) {
      return {
        type: aspect.type,
        difference: Math.min(
          Math.abs(diff - aspect.angle),
          Math.abs(diff - (360 - aspect.angle))
        ),
      };
    }
  }

  return null;
};

// Helper function to get aspect influence
const getAspectInfluence = (
  aspectType: string
): "positive" | "negative" | "neutral" => {
  switch (aspectType) {
    case "Conjunction":
      return "neutral"; // Depends on planets involved
    case "Trine":
    case "Sextile":
      return "positive";
    case "Square":
    case "Opposition":
    case "Quincunx":
      return "negative";
    default:
      return "neutral";
  }
};

// Helper function for midpoint interpretations
const getMidpointInterpretation = (
  point1: string,
  point2: string,
  sign: string,
  aspects: Array<{
    planet: string;
    aspect: string;
    orb: number;
    influence: string;
  }>
): string => {
  const baseInterpretation = `The midpoint between ${point1} and ${point2} in ${sign} represents the synthesis of these two planetary energies.`;

  if (aspects.length > 0) {
    const strongAspects = aspects.filter((a) => a.orb < 1);
    if (strongAspects.length > 0) {
      return `${baseInterpretation} Strong aspects to ${strongAspects
        .map((a) => a.planet)
        .join(
          ", "
        )} activate this midpoint, making it a significant focus point in the chart.`;
    }
  }

  return `${baseInterpretation} This point can reveal hidden connections and potentials between these areas of life.`;
};

// Comprehensive Fixed Stars Database
const FIXED_STARS = [
  {
    name: "Regulus",
    longitude: 149.83, // 29° Leo 50'
    magnitude: 1.35,
    constellation: "Leo",
    nature: ["Mars", "Jupiter"],
    orb: 2.5,
    influence:
      "Royal success, power, military honor, ambition, fame, high position, wealth, violence if afflicted",
  },
  {
    name: "Spica",
    longitude: 203.85, // 23° Libra 50'
    magnitude: 0.97,
    constellation: "Virgo",
    nature: ["Venus", "Mars"],
    orb: 2.5,
    influence:
      "Potential for genius, artistic gifts, fame, wealth, good fortune, scientific ability, protection",
  },
  {
    name: "Antares",
    longitude: 249.83, // 9° Sagittarius 50'
    magnitude: 1.06,
    constellation: "Scorpio",
    nature: ["Mars", "Jupiter"],
    orb: 2.5,
    influence:
      "Intense passion, courage, determination, potential for destruction, military honor, occult interests",
  },
  {
    name: "Sirius",
    longitude: 104.07, // 14° Cancer 07'
    magnitude: -1.46,
    constellation: "Canis Major",
    nature: ["Jupiter", "Mars"],
    orb: 3.0,
    influence:
      "Great fame, honor, wealth, high position, spiritual dedication, sacred fire, guardian",
  },
  {
    name: "Algol",
    longitude: 45.47, // 26° Taurus 17'
    magnitude: 2.09,
    constellation: "Perseus",
    nature: ["Saturn", "Jupiter"],
    orb: 3.0,
    influence:
      "Intensity, passion, violence, danger, misfortune, hysteria, mob mentality, beheading",
  },
  {
    name: "Aldebaran",
    longitude: 69.79, // 9° Gemini 47'
    magnitude: 0.85,
    constellation: "Taurus",
    nature: ["Venus"],
    orb: 2.5,
    influence:
      "Integrity, honor, popularity, courage, generosity, wealth, public recognition",
  },
  {
    name: "Betelgeuse",
    longitude: 88.79, // 28° Gemini 47'
    magnitude: 0.42,
    constellation: "Orion",
    nature: ["Mars", "Mercury"],
    orb: 2.5,
    influence:
      "Military success, honors, wealth, energy, courage, potential for accidents",
  },
  {
    name: "Rigel",
    longitude: 78.63, // 18° Gemini 38'
    magnitude: 0.13,
    constellation: "Orion",
    nature: ["Jupiter", "Saturn"],
    orb: 2.5,
    influence:
      "Teaching, philosophy, law, guidance, success through knowledge, honor, riches",
  },
  {
    name: "Vega",
    longitude: 135.97, // 15° Virgo 58'
    magnitude: 0.03,
    constellation: "Lyra",
    nature: ["Venus", "Mercury"],
    orb: 2.5,
    influence:
      "Artistic talent, poetry, music, charm, refinement, magic, occult abilities",
  },
  {
    name: "Capella",
    longitude: 76.23, // 16° Gemini 14'
    magnitude: 0.08,
    constellation: "Auriga",
    nature: ["Mars", "Mercury"],
    orb: 2.5,
    influence:
      "Honor, wealth, eminence, animation, pride, love of nature, domestic harmony",
  },
  {
    name: "Arcturus",
    longitude: 172.46, // 24° Libra 28'
    magnitude: -0.05,
    constellation: "Bootes",
    nature: ["Mars", "Jupiter"],
    orb: 2.5,
    influence:
      "Popularity, success, honors, wealth, leadership, guardian, protector, inventiveness",
  },
  {
    name: "Pollux",
    longitude: 112.88, // 22° Cancer 53'
    magnitude: 1.14,
    constellation: "Gemini",
    nature: ["Saturn", "Mercury"],
    orb: 2.5,
    influence:
      "Success, honors, athletics, strength, courage, violent if afflicted",
  },
  {
    name: "Procyon",
    longitude: 115.88, // 25° Cancer 53'
    magnitude: 0.37,
    constellation: "Canis Minor",
    nature: ["Mercury", "Mars"],
    orb: 2.5,
    influence:
      "Activity, success, fame, wealth, short temper, violence if afflicted",
  },
  {
    name: "Fomalhaut",
    longitude: 336.5, // 3° Pisces 50'
    magnitude: 1.16,
    constellation: "Piscis Austrinus",
    nature: ["Venus", "Mercury"],
    orb: 2.5,
    influence:
      "Spiritual dedication, mystical interests, genius, artistic talent, potential for addiction",
  },
  {
    name: "Deneb",
    longitude: 310.36, // 10° Aquarius 22'
    magnitude: 1.25,
    constellation: "Cygnus",
    nature: ["Jupiter", "Mars"],
    orb: 2.5,
    influence:
      "Intellectual greatness, imagination, vision, artistic talent, spiritual dedication",
  },
];

export const getFixedStarAspects = (planets: PlanetPosition[]): FixedStar[] => {
  const relevantStars: FixedStar[] = [];

  FIXED_STARS.forEach((star) => {
    planets.forEach((planet) => {
      const diff = Math.min(
        Math.abs(planet.longitude - star.longitude),
        360 - Math.abs(planet.longitude - star.longitude)
      );

      if (diff <= star.orb) {
        const aspectType = getFixedStarAspectType(diff);
        const influence = getFixedStarInfluence(star, aspectType, planet.name);

        relevantStars.push({
          name: star.name,
          position: star.longitude,
          magnitude: star.magnitude,
          constellation: star.constellation,
          nature: star.nature,
          orb: star.orb,
          aspect: {
            type: aspectType,
            planet: planet.name,
            planetPosition: planet.longitude,
            difference: diff,
            influence,
          },
        });
      }
    });
  });

  return relevantStars.sort(
    (a, b) => a.aspect!.difference - b.aspect!.difference
  );
};

const getFixedStarAspectType = (orb: number): string => {
  if (orb <= 1) return "Conjunction";
  if (orb <= 2) return "Close Aspect";
  return "Wide Aspect";
};

const getFixedStarInfluence = (
  star: any,
  aspectType: string,
  planet: string
): string => {
  const natureStr = star.nature.join("/");
  const intensity = aspectType === "Conjunction" ? "strongly" : "moderately";

  return `${planet} ${intensity} influenced by ${
    star.name
  } (${natureStr} nature). ${
    star.influence
  } This aspect brings ${star.name.toLowerCase()}'s energy into focus through ${planet.toLowerCase()}'s expression.`;
};

// Comprehensive Karmic Indicators Analysis
export const getKarmicIndicators = (
  planets: PlanetPosition[],
  aspects: Aspect[] = []
): KarmicIndicator[] => {
  const indicators: KarmicIndicator[] = [];

  // North Node Analysis
  const northNode = planets.find((p) => p.name === "North Node");
  if (northNode && northNode.sign && northNode.house !== undefined) {
    const nodeAspects = aspects
      .filter(
        (a) =>
          a.planet1.name === "North Node" || a.planet2.name === "North Node"
      )
      .map((a) => {
        const aspectPlanet =
          a.planet1.name === "North Node" ? a.planet2.name : a.planet1.name;
        return {
          planet: aspectPlanet,
          aspect: a.type,
          orb: a.orb || 0,
          karmicMeaning: getKarmicAspectMeaning(
            "North Node",
            aspectPlanet,
            a.type
          ),
        };
      });

    indicators.push({
      type: "North Node",
      position: northNode.longitude,
      sign: northNode.sign,
      house: northNode.house,
      aspects: nodeAspects,
      interpretation: getNorthNodeInterpretation(
        northNode.sign,
        northNode.house
      ),
      lessons: getNodeLessons(northNode.sign),
    });
  }

  // South Node Analysis
  const southNode = planets.find((p) => p.name === "South Node");
  if (southNode && southNode.sign && southNode.house !== undefined) {
    const nodeAspects = aspects
      .filter(
        (a) =>
          a.planet1.name === "South Node" || a.planet2.name === "South Node"
      )
      .map((a) => {
        const aspectPlanet =
          a.planet1.name === "South Node" ? a.planet2.name : a.planet1.name;
        return {
          planet: aspectPlanet,
          aspect: a.type,
          orb: a.orb || 0,
          karmicMeaning: getKarmicAspectMeaning(
            "South Node",
            aspectPlanet,
            a.type
          ),
        };
      });

    indicators.push({
      type: "South Node",
      position: southNode.longitude,
      sign: southNode.sign,
      house: southNode.house,
      aspects: nodeAspects,
      interpretation: getSouthNodeInterpretation(
        southNode.sign,
        southNode.house
      ),
      lessons: getSouthNodeLessons(southNode.sign),
    });
  }

  // Chiron Analysis (would need to be calculated separately)
  // For now, adding placeholder for Chiron if it exists
  const chiron = planets.find((p) => p.name === "Chiron");
  if (chiron && chiron.sign && chiron.house !== undefined) {
    const chironAspects = aspects
      .filter((a) => a.planet1.name === "Chiron" || a.planet2.name === "Chiron")
      .map((a) => {
        const aspectPlanet =
          a.planet1.name === "Chiron" ? a.planet2.name : a.planet1.name;
        return {
          planet: aspectPlanet,
          aspect: a.type,
          orb: a.orb || 0,
          karmicMeaning: getKarmicAspectMeaning("Chiron", aspectPlanet, a.type),
        };
      });

    indicators.push({
      type: "Chiron",
      position: chiron.longitude,
      sign: chiron.sign,
      house: chiron.house,
      aspects: chironAspects,
      interpretation: getChironInterpretation(chiron.sign, chiron.house),
      lessons: getChironLessons(chiron.sign),
    });
  }

  // Lilith Analysis (would need to be calculated separately)
  const lilith = planets.find((p) => p.name === "Lilith");
  if (lilith && lilith.sign && lilith.house !== undefined) {
    const lilithAspects = aspects
      .filter((a) => a.planet1.name === "Lilith" || a.planet2.name === "Lilith")
      .map((a) => {
        const aspectPlanet =
          a.planet1.name === "Lilith" ? a.planet2.name : a.planet1.name;
        return {
          planet: aspectPlanet,
          aspect: a.type,
          orb: a.orb || 0,
          karmicMeaning: getKarmicAspectMeaning("Lilith", aspectPlanet, a.type),
        };
      });

    indicators.push({
      type: "Lilith",
      position: lilith.longitude,
      sign: lilith.sign,
      house: lilith.house,
      aspects: lilithAspects,
      interpretation: getLilithInterpretation(lilith.sign, lilith.house),
      lessons: getLilithLessons(lilith.sign),
    });
  }

  return indicators;
};

const getNorthNodeInterpretation = (sign: string, house: number): string => {
  const interpretations: Record<string, string> = {
    Aries: `Your soul growth direction in Aries/House ${house} — embrace courage, initiative, and pioneering spirit. Your path involves developing leadership and asserting your authentic self.`,
    Taurus: `Your soul growth direction in Taurus/House ${house} — cultivate stability, patience, and earthly wisdom. Your path involves building lasting values and connecting with nature.`,
    Gemini: `Your soul growth direction in Gemini/House ${house} — embrace curiosity, communication, and variety. Your path involves learning, teaching, and making meaningful connections.`,
    Cancer: `Your soul growth direction in Cancer/House ${house} — develop emotional intelligence, nurturing, and intuition. Your path involves creating safety and emotional bonds.`,
    Leo: `Your soul growth direction in Leo/House ${house} — express creativity, leadership, and heart-centered living. Your path involves shining your light and inspiring others.`,
    Virgo: `Your soul growth direction in Virgo/House ${house} — refine service, analysis, and practical wisdom. Your path involves healing, perfecting skills, and meaningful work.`,
    Libra: `Your soul growth direction in Libra/House ${house} — master balance, relationships, and harmonious expression. Your path involves creating justice and beauty through partnership.`,
    Scorpio: `Your soul growth direction in Scorpio/House ${house} — transform through depth, power, and emotional truth. Your path involves embracing change and uncovering hidden wisdom.`,
    Sagittarius: `Your soul growth direction in Sagittarius/House ${house} — expand through wisdom, freedom, and higher truth. Your path involves seeking knowledge and sharing your vision.`,
    Capricorn: `Your soul growth direction in Capricorn/House ${house} — build through discipline, responsibility, and mastery. Your path involves achieving lasting success and structure.`,
    Aquarius: `Your soul growth direction in Aquarius/House ${house} — innovate through humanitarian vision and collective wisdom. Your path involves revolutionizing thinking and community.`,
    Pisces: `Your soul growth direction in Pisces/House ${house} — transcend through compassion, spirituality, and universal love. Your path involves dissolving boundaries and serving the collective.`,
  };

  return (
    interpretations[sign] ||
    `Your soul growth direction in ${sign}/House ${house} — embrace your unique evolutionary path with courage and wisdom.`
  );
};

const getSouthNodeInterpretation = (sign: string, house: number): string => {
  const interpretations: Record<string, string> = {
    Aries: `Your past life mastery in Aries/House ${house} — you've developed courage and independence, but must now learn cooperation and consideration for others.`,
    Taurus: `Your past life mastery in Taurus/House ${house} — you've developed patience and material security, but must now learn detachment and adaptability to change.`,
    Gemini: `Your past life mastery in Gemini/House ${house} — you've developed intelligence and communication skills, but must now learn depth and focused concentration.`,
    Cancer: `Your past life mastery in Cancer/House ${house} — you've developed emotional sensitivity and nurturing, but must now learn objectivity and emotional independence.`,
    Leo: `Your past life mastery in Leo/House ${house} — you've developed creativity and leadership, but must now learn humility and service to others.`,
    Virgo: `Your past life mastery in Virgo/House ${house} — you've developed analytical skills and service, but must now learn faith and acceptance of imperfection.`,
    Libra: `Your past life mastery in Libra/House ${house} — you've developed diplomacy and relationship skills, but must now learn self-reliance and decisive action.`,
    Scorpio: `Your past life mastery in Scorpio/House ${house} — you've developed depth and transformational power, but must now learn trust and lightness of being.`,
    Sagittarius: `Your past life mastery in Sagittarius/House ${house} — you've developed wisdom and philosophical understanding, but must now learn practical application and commitment.`,
    Capricorn: `Your past life mastery in Capricorn/House ${house} — you've developed ambition and achievement skills, but must now learn emotional expression and play.`,
    Aquarius: `Your past life mastery in Aquarius/House ${house} — you've developed humanitarian vision and innovation, but must now learn personal intimacy and emotional connection.`,
    Pisces: `Your past life mastery in Pisces/House ${house} — you've developed compassion and spiritual awareness, but must now learn practical boundaries and discrimination.`,
  };

  return (
    interpretations[sign] ||
    `Your past life mastery in ${sign}/House ${house} — you bring valuable skills from past lives, but must now grow beyond these patterns.`
  );
};

const getChironInterpretation = (sign: string, house: number): string => {
  return `Chiron in ${sign}/House ${house} represents your core wound and greatest healing potential. This placement shows where you can transform pain into wisdom and become a healer for others.`;
};

const getLilithInterpretation = (sign: string, house: number): string => {
  return `Lilith in ${sign}/House ${house} represents your untamed feminine power and shadow self. This placement shows where you must reclaim your authentic, wild nature and reject patriarchal conditioning.`;
};

const getNodeLessons = (sign: string): string[] => {
  const lessons: Record<string, string[]> = {
    Aries: [
      "Develop courage to act independently",
      "Learn to be a pioneer without arrogance",
      "Embrace healthy competition",
    ],
    Taurus: [
      "Build lasting values",
      "Learn patience and persistence",
      "Connect with the natural world",
    ],
    Gemini: [
      "Communicate your truth clearly",
      "Stay curious and open-minded",
      "Connect diverse ideas and people",
    ],
    Cancer: [
      "Honor your emotional needs",
      "Create safe spaces for yourself and others",
      "Develop intuitive wisdom",
    ],
    Leo: [
      "Express your unique creativity",
      "Lead with heart and generosity",
      "Shine without seeking approval",
    ],
    Virgo: [
      "Perfect your skills through practice",
      "Serve with humility and dedication",
      "Find the sacred in the mundane",
    ],
    Libra: [
      "Create beauty and harmony",
      "Practice fair-minded diplomacy",
      "Balance self-care with relationship",
    ],
    Scorpio: [
      "Transform through facing fears",
      "Use power responsibly",
      "Trust your deep emotional wisdom",
    ],
    Sagittarius: [
      "Seek higher truth and wisdom",
      "Share your vision with others",
      "Stay open to expansion and growth",
    ],
    Capricorn: [
      "Build structures that serve humanity",
      "Master your ambitions with integrity",
      "Balance work with emotional fulfillment",
    ],
    Aquarius: [
      "Innovate for the collective good",
      "Honor your unique perspective",
      "Build community based on equality",
    ],
    Pisces: [
      "Develop compassion for all beings",
      "Trust your spiritual intuition",
      "Dissolve ego boundaries through love",
    ],
  };

  return (
    lessons[sign] || [
      "Embrace your unique evolutionary path",
      "Learn from life experiences with wisdom",
      "Share your gifts with the world",
    ]
  );
};

const getSouthNodeLessons = (sign: string): string[] => {
  const lessons: Record<string, string[]> = {
    Aries: [
      "Learn to consider others' needs",
      "Develop patience and cooperation",
      "Balance independence with interdependence",
    ],
    Taurus: [
      "Release attachment to material security",
      "Embrace change and adaptability",
      "Value spiritual over material wealth",
    ],
    Gemini: [
      "Focus depth over breadth",
      "Develop emotional intelligence",
      "Practice active listening",
    ],
    Cancer: [
      "Develop emotional independence",
      "Set healthy boundaries",
      "Balance nurturing with self-care",
    ],
    Leo: [
      "Practice humility and service",
      "Share the spotlight with others",
      "Develop authentic self-worth",
    ],
    Virgo: [
      "Accept imperfection in yourself and others",
      "Trust in divine timing",
      "Balance analysis with intuition",
    ],
    Libra: [
      "Develop self-reliance",
      "Make decisions without external validation",
      "Embrace constructive conflict",
    ],
    Scorpio: [
      "Practice trust and vulnerability",
      "Release need for control",
      "Find lightness and joy",
    ],
    Sagittarius: [
      "Apply wisdom in practical ways",
      "Commit to long-term goals",
      "Balance freedom with responsibility",
    ],
    Capricorn: [
      "Express emotions freely",
      "Make time for play and creativity",
      "Value being over doing",
    ],
    Aquarius: [
      "Develop intimate emotional connections",
      "Honor individual needs within collective",
      "Balance idealism with practicality",
    ],
    Pisces: [
      "Set healthy boundaries",
      "Develop discrimination and discernment",
      "Ground spiritual insights in reality",
    ],
  };

  return (
    lessons[sign] || [
      "Release past life patterns",
      "Embrace new growth opportunities",
      "Balance past wisdom with present needs",
    ]
  );
};

const getChironLessons = (sign: string): string[] => {
  return [
    "Transform your deepest wounds into wisdom",
    "Become a healer through your own healing journey",
    "Integrate suffering into compassion",
    "Bridge the gap between mortal and divine",
    "Teach what you most need to learn",
  ];
};

const getLilithLessons = (sign: string): string[] => {
  return [
    "Reclaim your wild, untamed nature",
    "Reject oppressive conditioning and expectations",
    "Embrace your authentic sexuality and power",
    "Honor your fierce independence",
    "Transform shadow into creative power",
  ];
};

const getKarmicAspectMeaning = (
  karmicPoint: string,
  planet: string,
  aspect: string
): string => {
  const meanings: Record<string, Record<string, string>> = {
    "North Node": {
      Conjunction: `${planet} energizes your soul's purpose - this planet is a key vehicle for your evolutionary growth.`,
      Trine: `${planet} harmoniously supports your soul's journey - natural talent and ease in this area of growth.`,
      Square: `${planet} challenges you to grow - tension that drives necessary soul development.`,
      Opposition: `${planet} creates awareness through contrast - balancing past and future soul needs.`,
      Sextile: `${planet} offers opportunities for soul growth - supportive connections to your path.`,
    },
    "South Node": {
      Conjunction: `${planet} represents past life mastery - skills to build upon but not over-rely on.`,
      Trine: `${planet} shows comfortable past patterns - gifts to use but not remain stuck in.`,
      Square: `${planet} indicates past life challenges - patterns that need healing and transformation.`,
      Opposition: `${planet} creates tension between past and future - calling for balance of old and new.`,
      Sextile: `${planet} offers easy access to past skills - resources to utilize in current growth.`,
    },
  };

  return (
    meanings[karmicPoint]?.[aspect] ||
    `${planet} aspect to ${karmicPoint} brings karmic significance and growth opportunities.`
  );
};

// Comprehensive Progressed Chart Calculations
export const getProgressed = (
  natal: PlanetPosition[],
  years: number = 42,
  birthDate?: string
): ProgressedChart => {
  const currentDate = new Date();
  const progressedDate = birthDate ? new Date(birthDate) : new Date();
  progressedDate.setFullYear(progressedDate.getFullYear() + years);

  // Calculate progressed positions using secondary progressions (1 day = 1 year)
  const progressedPositions = natal.map((p) => {
    // Different progression speeds for different planets
    const progressionSpeeds: Record<string, number> = {
      Sun: 1.0, // ~1° per year
      Moon: 13.2, // ~13° per year (Moon moves ~13° per day)
      Mercury: 1.0, // ~1° per year
      Venus: 1.0, // ~1° per year
      Mars: 0.5, // ~0.5° per year
      Jupiter: 0.08, // ~0.08° per year
      Saturn: 0.03, // ~0.03° per year
      Uranus: 0.01, // ~0.01° per year
      Neptune: 0.006, // ~0.006° per year
      Pluto: 0.004, // ~0.004° per year
      "North Node": 3.0, // ~3° per year (retrograde motion)
      "South Node": 3.0, // ~3° per year (retrograde motion)
    };

    const speed = progressionSpeeds[p.name] || 1.0;
    const progressedLongitude = normalizeAngle(p.longitude + years * speed);

    // Get zodiac position for progressed planet
    const signs = [
      "Aries",
      "Taurus",
      "Gemini",
      "Cancer",
      "Leo",
      "Virgo",
      "Libra",
      "Scorpio",
      "Sagittarius",
      "Capricorn",
      "Aquarius",
      "Pisces",
    ];
    const normalized = normalizeAngle(progressedLongitude);
    const signIndex = Math.floor(normalized / 30);
    const degreeInSign = normalized % 30;
    const degree = Math.floor(degreeInSign);
    const minute = Math.floor((degreeInSign - degree) * 60);

    return {
      ...p,
      longitude: progressedLongitude,
      sign: signs[signIndex],
      degree,
      minute,
      retrograde: speed < 0, // Simple retrograde check
    };
  });

  // Calculate progressed aspects
  const progressedAspects = calculateProgressedAspects(progressedPositions);

  // Check for solar return (Sun returns to natal position)
  const natalSun = natal.find((p) => p.name === "Sun");
  const progressedSun = progressedPositions.find((p) => p.name === "Sun");
  const solarReturn =
    natalSun && progressedSun
      ? Math.abs(normalizeAngle(progressedSun.longitude - natalSun.longitude)) <
        1
      : false;

  // Check for lunar return (Moon returns to natal position)
  const natalMoon = natal.find((p) => p.name === "Moon");
  const progressedMoon = progressedPositions.find((p) => p.name === "Moon");
  const lunarReturn =
    natalMoon && progressedMoon
      ? Math.abs(
          normalizeAngle(progressedMoon.longitude - natalMoon.longitude)
        ) < 1
      : false;

  // Get progressed Moon phase
  const moonPhase = calculateProgressedMoonPhase(progressedMoon, natalMoon);

  // Get progressed Sun position
  const sunPosition = progressedSun
    ? {
        sign: progressedSun.sign,
        house: progressedSun.house || 1,
        returnDate: solarReturn ? currentDate.toISOString() : undefined,
      }
    : {
        sign: "Unknown",
        house: 1,
      };

  return {
    date: progressedDate.toISOString(),
    positions: progressedPositions,
    aspects: progressedAspects,
    solarReturn,
    lunarReturn,
    progressedMoon: moonPhase,
    progressedSun: sunPosition,
  };
};

const calculateProgressedAspects = (planets: PlanetPosition[]): Aspect[] => {
  const aspects: Aspect[] = [];
  const major = [
    { type: "Conjunction", angle: 0, orb: 8 }, // Tighter orbs for progressions
    { type: "Sextile", angle: 60, orb: 4 },
    { type: "Square", angle: 90, orb: 6 },
    { type: "Trine", angle: 120, orb: 6 },
    { type: "Opposition", angle: 180, orb: 8 },
  ];

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i];
      const p2 = planets[j];
      let diff = Math.abs(p1.longitude - p2.longitude);
      if (diff > 180) diff = 360 - diff;

      for (const asp of major) {
        const orbDiff = Math.abs(diff - asp.angle);
        if (orbDiff <= asp.orb) {
          aspects.push({
            planet1: { name: p1.name, longitude: p1.longitude },
            planet2: { name: p2.name, longitude: p2.longitude },
            type: asp.type,
            orb: orbDiff,
            exact: orbDiff < 0.5,
            applying: false, // Would need motion data for accurate applying/separating
            separating: false,
            influence: getAspectInfluence(asp.type),
          });
          break;
        }
      }
    }
  }
  return aspects;
};

const calculateProgressedMoonPhase = (
  progressedMoon?: PlanetPosition,
  natalMoon?: PlanetPosition
) => {
  if (!progressedMoon) {
    return {
      phase: "Unknown",
      sign: "Unknown",
      house: 1,
    };
  }

  // Simple moon phase calculation based on Sun-Moon relationship
  // In a real implementation, you'd calculate the actual Sun position
  const sunApprox = 0; // Simplified - would need actual progressed Sun position
  const moonPhaseAngle = normalizeAngle(progressedMoon.longitude - sunApprox);

  let phase = "";
  if (moonPhaseAngle < 45) phase = "New Moon";
  else if (moonPhaseAngle < 90) phase = "Waxing Crescent";
  else if (moonPhaseAngle < 135) phase = "First Quarter";
  else if (moonPhaseAngle < 180) phase = "Waxing Gibbous";
  else if (moonPhaseAngle < 225) phase = "Full Moon";
  else if (moonPhaseAngle < 270) phase = "Waning Gibbous";
  else if (moonPhaseAngle < 315) phase = "Last Quarter";
  else phase = "Waning Crescent";

  return {
    phase,
    sign: progressedMoon.sign,
    house: progressedMoon.house || 1,
  };
};

// Comprehensive Electional Astrology
export const getElectionalWindows = (
  startDate?: Date,
  endDate?: Date,
  purpose?: string
): ElectionalWindow[] => {
  const start = startDate || new Date();
  const end = endDate || new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000); // Default 7 days
  const windows: ElectionalWindow[] = [];

  // Check each day for favorable windows
  for (
    let date = new Date(start);
    date <= end;
    date.setDate(date.getDate() + 1)
  ) {
    // Calculate positions for this date (simplified - would need real ephemeris data)
    const dayWindows = findFavorableWindowsForDate(date, purpose);
    windows.push(...dayWindows);
  }

  return windows.sort((a, b) => b.score - a.score);
};

const findFavorableWindowsForDate = (
  date: Date,
  purpose?: string
): ElectionalWindow[] => {
  const windows: ElectionalWindow[] = [];

  // Check different time windows throughout the day
  for (let hour = 6; hour <= 20; hour += 2) {
    // Check every 2 hours from 6 AM to 8 PM
    const windowStart = new Date(date);
    windowStart.setHours(hour, 0, 0, 0);
    const windowEnd = new Date(date);
    windowEnd.setHours(hour + 2, 0, 0, 0);

    // Calculate electional score based on various factors
    const score = calculateElectionalScoreHelper(windowStart, purpose);

    if (score >= 60) {
      // Only include windows with decent scores
      windows.push({
        start: windowStart.toISOString(),
        end: windowEnd.toISOString(),
        score,
        aspects: getWindowAspectsHelper(windowStart),
        moonPhase: getMoonPhaseForDateHelper(windowStart),
        moonSign: getMoonSignForDateHelper(windowStart),
        voidOfCourse: isMoonVoidOfCourseHelper(windowStart),
        moonVoidStart: getMoonVoidStartHelper(windowStart),
        moonVoidEnd: getMoonVoidEndHelper(windowStart),
        retrogrades: getRetrogradePlanetsHelper(windowStart),
        recommendedFor: getRecommendedActivitiesHelper(score, purpose),
        avoidFor: getAvoidActivitiesHelper(score),
        overallQuality: getOverallQualityHelper(score),
      });
    }
  }

  return windows;
};

// Comprehensive Lunar Phase Calculations
export const calculateLunarPhase = (jd: number): LunarPhase => {
  // Simplified lunar phase calculation
  const knownNewMoon = 2451549.5; // 2000-01-06
  const synodicMonth = 29.53059; // days
  const daysSinceNew = (jd - knownNewMoon) % synodicMonth;

  let phaseType: LunarPhase["type"];
  let phase: string;
  let illumination: number;

  // Determine phase type and calculate illumination
  if (daysSinceNew < 1.84566) {
    phaseType = "New Moon";
    phase = "New Moon";
    illumination = 0;
  } else if (daysSinceNew < 5.53699) {
    phaseType = "Waxing Crescent";
    phase = "Waxing Crescent";
    illumination = ((daysSinceNew - 1.84566) / 5.53699) * 25;
  } else if (daysSinceNew < 9.22831) {
    phaseType = "First Quarter";
    phase = "First Quarter";
    illumination = 50;
  } else if (daysSinceNew < 12.91963) {
    phaseType = "Waxing Gibbous";
    phase = "Waxing Gibbous";
    illumination = 50 + ((daysSinceNew - 9.22831) / 12.91963) * 25;
  } else if (daysSinceNew < 16.61096) {
    phaseType = "Full Moon";
    phase = "Full Moon";
    illumination = 100;
  } else if (daysSinceNew < 20.30228) {
    phaseType = "Waning Gibbous";
    phase = "Waning Gibbous";
    illumination = 100 - ((daysSinceNew - 16.61096) / 20.30228) * 25;
  } else if (daysSinceNew < 23.99361) {
    phaseType = "Last Quarter";
    phase = "Last Quarter";
    illumination = 50;
  } else {
    phaseType = "Waning Crescent";
    phase = "Waning Crescent";
    illumination = 50 - ((daysSinceNew - 23.99361) / 29.53059) * 50;
  }

  // Calculate phase angle (0-360°)
  const angle = (daysSinceNew / synodicMonth) * 360;

  // Calculate next new and full moons
  const daysToNextNew = synodicMonth - daysSinceNew;
  const daysToNextFull =
    daysSinceNew < 16.61096
      ? 16.61096 - daysSinceNew
      : synodicMonth - daysSinceNew + 16.61096;

  const nextNewMoon = new Date(
    Date.now() + daysToNextNew * 24 * 60 * 60 * 1000
  ).toISOString();
  const nextFullMoon = new Date(
    Date.now() + daysToNextFull * 24 * 60 * 60 * 1000
  ).toISOString();

  // Check for upcoming eclipses (simplified)
  const nextEclipse = calculateNextEclipse(jd, daysSinceNew);

  return {
    type: phaseType,
    phase,
    illumination,
    angle,
    nextNewMoon,
    nextFullMoon,
    nextEclipse,
  };
};

const calculateNextEclipse = (
  jd: number,
  daysSinceNew: number
): LunarPhase["nextEclipse"] | undefined => {
  // Simplified eclipse calculation - real implementation would be much more complex
  const daysToNextNew = 29.53059 - daysSinceNew;
  const daysToNextFull =
    daysSinceNew < 16.61096
      ? 16.61096 - daysSinceNew
      : 29.53059 - daysSinceNew + 16.61096;

  // Check if next new moon or full moon is near a node (within ~18.6°)
  // This is extremely simplified - real eclipse calculation is complex
  if (daysToNextNew < 2 && Math.random() > 0.7) {
    // 30% chance near new moon
    return {
      type: "Solar",
      date: new Date(
        Date.now() + daysToNextNew * 24 * 60 * 60 * 1000
      ).toISOString(),
      saros: Math.floor(Math.random() * 100) + 100,
      visibility: "Visible from large portion of Earth",
      magnitude: Math.random() * 0.8 + 0.2,
    };
  }

  return undefined;
};

// Helper functions for electional astrology
const calculateElectionalScoreHelper = (
  date: Date,
  purpose?: string
): number => {
  let score = 50; // Base score

  // Add points for favorable moon phases
  const moonPhase = calculateLunarPhase(
    utc_to_jd(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      constants.SE_GREG_CAL
    ).data[0]
  );

  if (
    moonPhase.phase.includes("New Moon") ||
    moonPhase.phase.includes("Full Moon")
  ) {
    score += 10;
  }

  return score;
};

const getWindowAspectsHelper = (date: Date) => {
  // Simplified aspect calculation for electional window
  return [];
};

const getMoonPhaseForDateHelper = (date: Date) => {
  const jd = utc_to_jd(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    constants.SE_GREG_CAL
  ).data[0];

  const moonPhase = calculateLunarPhase(jd);
  return moonPhase.phase;
};

const getMoonSignForDateHelper = (date: Date) => {
  // Simplified moon sign calculation
  const signs = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
  ];
  return signs[Math.floor(Math.random() * 12)];
};

const isMoonVoidOfCourseHelper = (date: Date) => {
  // Simplified void of course calculation
  return Math.random() > 0.8;
};

const getMoonVoidStartHelper = (date: Date) => {
  return new Date(date.getTime() - 2 * 60 * 60 * 1000).toISOString();
};

const getMoonVoidEndHelper = (date: Date) => {
  return new Date(date.getTime() + 2 * 60 * 60 * 1000).toISOString();
};

const getRetrogradePlanetsHelper = (date: Date) => {
  // Simplified retrograde calculation
  return [];
};

const getRecommendedActivitiesHelper = (score: number, purpose?: string) => {
  const activities = [];
  if (score > 70) {
    activities.push("Important meetings", "Starting new projects");
  }
  if (purpose) {
    activities.push(purpose);
  }
  return activities;
};

const getAvoidActivitiesHelper = (score: number) => {
  const activities = [];
  if (score < 60) {
    activities.push("Major decisions", "Financial investments");
  }
  return activities;
};

const getOverallQualityHelper = (score: number) => {
  if (score > 80) return "excellent";
  if (score > 70) return "good";
  if (score > 60) return "fair";
  return "poor";
};
