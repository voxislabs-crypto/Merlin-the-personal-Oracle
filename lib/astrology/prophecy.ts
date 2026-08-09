import prophecyTemplates from '@/data/prophecy-templates.json';
import type { BirthChartData } from '@/types/astrology';

export type ProphecyStyle = 'omen' | 'sonnet';
export type ProphecyEra = 'babylonian' | 'hermetic' | 'psalmic' | 'stoic';

export interface MeterInfo {
  score: number;
  averageSyllables: number;
  lineScores: Array<{ line: string; syllables: number; target: number }>;
}

export interface ProphecyResult {
  style: ProphecyStyle;
  era: ProphecyEra;
  title: string;
  prophecy: string;
  meter?: MeterInfo;
  signals: {
    blessingPlanet: string;
    blessingSign: string;
    challengePlanet: string;
    challengeSign: string;
  };
}

type PlanetLike = {
  name: string;
  sign?: string;
  house?: number;
};

type TemplateSet = {
  deities: Record<string, string>;
  blessing: string[];
  challenge: string[];
  action: string[];
  timing: string[];
  closing: string[];
  sonnetRhymes: Record<string, string[]>;
};

const TEMPLATES = prophecyTemplates as TemplateSet;

const ERA_STYLES: Record<ProphecyEra, {
  titlePrefix: string;
  opening: string;
  close: string;
  deityMap: Record<string, string>;
}> = {
  babylonian: {
    titlePrefix: 'Tablet Omen',
    opening: 'By the tablets of heaven, this sign is read:',
    close: 'Thus the omen stands, if your conduct stays aligned.',
    deityMap: {
      Sun: 'Shamash',
      Moon: 'Sin',
      Mercury: 'Nabu',
      Venus: 'Ishtar',
      Mars: 'Nergal',
      Jupiter: 'Marduk',
      Saturn: 'Ninurta',
    },
  },
  hermetic: {
    titlePrefix: 'Hermetic Verse',
    opening: 'As above, so within your making:',
    close: 'The work is alchemical: transmute the hour into gold.',
    deityMap: {
      Sun: 'Sol',
      Moon: 'Luna',
      Mercury: 'Mercurius',
      Venus: 'Venus',
      Mars: 'Ares',
      Jupiter: 'Zeus',
      Saturn: 'Cronus',
    },
  },
  psalmic: {
    titlePrefix: 'Psalmic Oracle',
    opening: 'In the watch of the heavens, this word is given:',
    close: 'Walk uprightly, and the appointed good will meet you.',
    deityMap: {
      Sun: 'the Light-Bearer',
      Moon: 'the Night-Keeper',
      Mercury: 'the Scribe',
      Venus: 'the Comforter',
      Mars: 'the Defender',
      Jupiter: 'the King-Maker',
      Saturn: 'the Elder Judge',
    },
  },
  stoic: {
    titlePrefix: 'Stoic Dispatch',
    opening: 'The sky describes conditions, not excuses:',
    close: 'Hold to virtue, and let outcomes follow as they will.',
    deityMap: {
      Sun: 'Reason',
      Moon: 'Perception',
      Mercury: 'Discernment',
      Venus: 'Temperance',
      Mars: 'Courage',
      Jupiter: 'Wisdom',
      Saturn: 'Discipline',
    },
  },
};

/**
 * FNV-1a style hash — plain char-sum was broken for regenerate:
 * template arrays of length 3 meant any salt whose char-sum differed by 3k
 * produced the *exact same* omen (seed+1…seed+5 all shifted by a multiple of 3).
 */
function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mix seed with a lane so each template slot diverges independently. */
function pick<T>(items: T[], seed: number, lane = 0): T {
  if (!items.length) {
    throw new Error('Cannot pick from empty template list');
  }
  const mixed = Math.imul(seed ^ Math.imul(lane + 1, 0x9e3779b9), 0x85ebca6b) >>> 0;
  return items[mixed % items.length];
}

function pickPlanet(chart: BirthChartData | undefined, candidates: string[], fallback: string): PlanetLike {
  const planets = chart?.planets || [];
  for (const candidate of candidates) {
    const found = planets.find((planet) => planet.name === candidate);
    if (found) return found;
  }
  return planets[0] || { name: fallback, sign: 'Aries', house: 1 };
}

function deityFor(planetName: string, era: ProphecyEra): string {
  return ERA_STYLES[era].deityMap[planetName] || TEMPLATES.deities[planetName] || 'the Watchers';
}

function compileTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] || 'the heavens');
}

function createOmen(seed: number, values: Record<string, string>, era: ProphecyEra): string {
  const lines = [
    ERA_STYLES[era].opening,
    compileTemplate(pick(TEMPLATES.timing, seed, 1), values),
    compileTemplate(pick(TEMPLATES.blessing, seed, 2), values),
    compileTemplate(pick(TEMPLATES.challenge, seed, 3), values),
    pick(TEMPLATES.action, seed, 4),
    pick(TEMPLATES.closing, seed, 5),
    ERA_STYLES[era].close,
  ];
  return lines.join(' ');
}

function buildSonnet(seed: number, values: Record<string, string>, strictMeter: boolean): string {
  if (strictMeter) {
    return buildStrictSonnet(values, seed);
  }

  const rA = pick(TEMPLATES.sonnetRhymes.A, seed, 1);
  const rB = pick(TEMPLATES.sonnetRhymes.B, seed, 2);
  const rC = pick(TEMPLATES.sonnetRhymes.C, seed, 3);
  const rD = pick(TEMPLATES.sonnetRhymes.D, seed, 4);
  const rE = pick(TEMPLATES.sonnetRhymes.E, seed, 5);
  const rF = pick(TEMPLATES.sonnetRhymes.F, seed, 6);
  const rG = pick(TEMPLATES.sonnetRhymes.G, seed, 7);

  const lines = [
    `When ${values.deity} marks your ${values.planet} with waking ${rA},`,
    `And ${values.planet} in ${values.sign} declares its ancient ${rB},`,
    `A gate of earned ascent appears in mortal ${rA},`,
    `Yet only disciplined hearts may keep that sacred ${rB},`,

    `For ${values.shadowDeity} waits beside the turning ${rC},`,
    `To test your vow where noise and hunger carve their ${rD},`,
    `If pride outruns your craft, you drift against the ${rC},`,
    `But patient hands will shape a future deeply ${rD},`,

    `So rise at dawn and tend one laboring ${rE},`,
    `Let witness name your work; let focus be your ${rF},`,
    `Through small true acts, your chart becomes a living ${rE},`,
    `And what was once foreseen now turns to chosen ${rF},`,

    `Greatness is written, yes, but written to be ${rG},`,
    `Keep faith with your own oath, and heaven will ${rG}.`,
  ];

  return lines.join('\n');
}

function buildStrictSonnet(values: Record<string, string>, seed = 0): string {
  // Seeded alternates so regenerate still produces a new reading under strict meter.
  const l1 = pick(
    [
      `When ${values.deity} names your ${values.planet}, rise with light,`,
      `When ${values.deity} calls your ${values.planet}, stand in light,`,
      `As ${values.deity} marks your ${values.planet}, take to light,`,
      `Where ${values.deity} crowns your ${values.planet}, claim the light,`,
    ],
    seed,
    11
  );
  const l5 = pick(
    [
      `Yet ${values.shadowDeity} waits where pride begins to guide,`,
      `But ${values.shadowDeity} stands where haste begins to guide,`,
      `Still ${values.shadowDeity} waits where ego pulls the guide,`,
      `And ${values.shadowDeity} tests where comfort starts to guide,`,
    ],
    seed,
    12
  );
  const l9 = pick(
    [
      `At dawn, keep oath with one deliberate, useful fire,`,
      `At dawn, keep faith with one deliberate, useful fire,`,
      `At dawn, keep pace with one deliberate, chosen fire,`,
      `At dawn, keep watch with one deliberate, honest fire,`,
    ],
    seed,
    13
  );
  const l13 = pick(
    [
      `Greatness is not a storm that strikes the passive soul,`,
      `Greatness is not a gift that finds the idle soul,`,
      `Greatness is not a wind that crowns the drifting soul,`,
      `Greatness is not a crown for hands that never hold,`,
    ],
    seed,
    14
  );

  const lines = [
    l1,
    `In ${values.sign}'s house your labor asks for form and flame,`,
    `A gate appears for those who practice before night,`,
    `And crowns are worn by those who can sustain their name,`,

    l5,
    `One rushed decision bends a season out of line,`,
    `Stand still one breath, then choose the path you can abide,`,
    `For patient craft can turn a warning into sign,`,

    l9,
    `At dusk, record what fear attempted to decree,`,
    `By acts repeated, fate becomes a trained desire,`,
    `And what was read above grows lived in destiny,`,

    l13,
    `It crowns the one whose practiced virtues hold control.`,
  ];

  return lines.join('\n');
}

function estimateSyllables(input: string): number {
  const word = input.toLowerCase().replace(/[^a-z]/g, '');
  if (!word) return 0;
  const matches = word.match(/[aeiouy]+/g);
  let syllables = matches ? matches.length : 1;
  if (word.endsWith('e') && syllables > 1) syllables -= 1;
  return Math.max(1, syllables);
}

function scoreIambicApproximation(poem: string): MeterInfo {
  const lines = poem.split('\n').filter((line) => line.trim().length > 0);
  const lineScores = lines.map((line) => {
    const words = line.split(/\s+/).filter(Boolean);
    const syllables = words.reduce((sum, word) => sum + estimateSyllables(word), 0);
    return { line, syllables, target: 10 };
  });

  const averageSyllables = lineScores.length
    ? lineScores.reduce((sum, entry) => sum + entry.syllables, 0) / lineScores.length
    : 0;

  const normalized = lineScores.length
    ? lineScores.reduce((sum, entry) => {
        const delta = Math.abs(entry.syllables - entry.target);
        return sum + Math.max(0, 1 - delta / entry.target);
      }, 0) / lineScores.length
    : 0;

  return {
    score: Math.round(normalized * 100),
    averageSyllables: Number(averageSyllables.toFixed(2)),
    lineScores,
  };
}

export function generateProphecy(params: {
  birthChart: BirthChartData;
  style?: ProphecyStyle;
  era?: ProphecyEra;
  strictMeter?: boolean;
  /**
   * Extra entropy so Regenerate produces a new reading.
   * Without this, the same chart always yields the same omen/sonnet.
   */
  seedSalt?: string | number;
}): ProphecyResult {
  const {
    birthChart,
    style = 'omen',
    era = 'babylonian',
    strictMeter = false,
    seedSalt = '',
  } = params;

  const blessingPlanet = pickPlanet(birthChart, ['Jupiter', 'Sun', 'Venus', 'Moon'], 'Jupiter');
  const challengePlanet = pickPlanet(birthChart, ['Saturn', 'Mars', 'Moon'], 'Saturn');

  const sign = blessingPlanet.sign || 'Aries';
  const challengeSign = challengePlanet.sign || 'Capricorn';

  const seedInput = `${blessingPlanet.name}:${sign}:${challengePlanet.name}:${challengeSign}:${birthChart.jd || 0}:${style}:${era}:${seedSalt}`;
  const seed = hashSeed(seedInput);

  const values = {
    deity: deityFor(blessingPlanet.name, era),
    shadowDeity: deityFor(challengePlanet.name, era),
    planet: blessingPlanet.name,
    sign,
    shadowPlanet: challengePlanet.name,
    shadowSign: challengeSign,
  };

  const prophecy = style === 'sonnet'
    ? buildSonnet(seed, values, strictMeter)
    : createOmen(seed, values, era);

  const meter = style === 'sonnet' ? scoreIambicApproximation(prophecy) : undefined;
  const refinedProphecy =
    style === 'sonnet' && strictMeter && meter && meter.score < 70
      ? buildStrictSonnet(values, seed + 99)
      : prophecy;
  const refinedMeter = style === 'sonnet' ? scoreIambicApproximation(refinedProphecy) : undefined;

  const titlePrefix = ERA_STYLES[era].titlePrefix;
  return {
    style,
    era,
    title: `${titlePrefix}: ${values.planet} in ${values.sign}`,
    prophecy: refinedProphecy,
    meter: refinedMeter,
    signals: {
      blessingPlanet: values.planet,
      blessingSign: values.sign,
      challengePlanet: values.shadowPlanet,
      challengeSign: values.shadowSign,
    },
  };
}
