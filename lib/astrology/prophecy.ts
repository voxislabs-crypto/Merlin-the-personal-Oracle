import prophecyTemplates from '@/data/prophecy-templates.json';
import type { BirthChartData } from '@/types/astrology';

export type ProphecyStyle = 'omen' | 'sonnet';

export interface ProphecyResult {
  style: ProphecyStyle;
  title: string;
  prophecy: string;
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

function pick<T>(items: T[], seed: number): T {
  return items[Math.abs(seed) % items.length];
}

function sumCharCodes(input: string): number {
  let total = 0;
  for (let i = 0; i < input.length; i += 1) {
    total += input.charCodeAt(i);
  }
  return total;
}

function pickPlanet(chart: BirthChartData | undefined, candidates: string[], fallback: string): PlanetLike {
  const planets = chart?.planets || [];
  for (const candidate of candidates) {
    const found = planets.find((planet) => planet.name === candidate);
    if (found) return found;
  }
  return planets[0] || { name: fallback, sign: 'Aries', house: 1 };
}

function deityFor(planetName: string): string {
  return TEMPLATES.deities[planetName] || 'the Watchers';
}

function compileTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] || 'the heavens');
}

function createOmen(seed: number, values: Record<string, string>): string {
  const lines = [
    compileTemplate(pick(TEMPLATES.timing, seed + 1), values),
    compileTemplate(pick(TEMPLATES.blessing, seed + 2), values),
    compileTemplate(pick(TEMPLATES.challenge, seed + 3), values),
    pick(TEMPLATES.action, seed + 4),
    pick(TEMPLATES.closing, seed + 5),
  ];
  return lines.join(' ');
}

function buildSonnet(seed: number, values: Record<string, string>): string {
  const rA = pick(TEMPLATES.sonnetRhymes.A, seed + 1);
  const rB = pick(TEMPLATES.sonnetRhymes.B, seed + 2);
  const rC = pick(TEMPLATES.sonnetRhymes.C, seed + 3);
  const rD = pick(TEMPLATES.sonnetRhymes.D, seed + 4);
  const rE = pick(TEMPLATES.sonnetRhymes.E, seed + 5);
  const rF = pick(TEMPLATES.sonnetRhymes.F, seed + 6);
  const rG = pick(TEMPLATES.sonnetRhymes.G, seed + 7);

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

export function generateProphecy(params: {
  birthChart: BirthChartData;
  style?: ProphecyStyle;
  ancientLayer?: boolean;
}): ProphecyResult {
  const { birthChart, style = 'omen', ancientLayer = true } = params;

  const blessingPlanet = pickPlanet(birthChart, ['Jupiter', 'Sun', 'Venus', 'Moon'], 'Jupiter');
  const challengePlanet = pickPlanet(birthChart, ['Saturn', 'Mars', 'Moon'], 'Saturn');

  const sign = blessingPlanet.sign || 'Aries';
  const challengeSign = challengePlanet.sign || 'Capricorn';

  const seedInput = `${blessingPlanet.name}:${sign}:${challengePlanet.name}:${challengeSign}:${birthChart.jd || 0}`;
  const seed = sumCharCodes(seedInput);

  const values = {
    deity: deityFor(blessingPlanet.name),
    shadowDeity: deityFor(challengePlanet.name),
    planet: blessingPlanet.name,
    sign,
    shadowPlanet: challengePlanet.name,
    shadowSign: challengeSign,
  };

  const prophecy = style === 'sonnet'
    ? buildSonnet(seed, values)
    : createOmen(seed, values);

  const titlePrefix = ancientLayer ? 'Tablet Omen' : 'Future Reading';
  return {
    style,
    title: `${titlePrefix}: ${values.planet} in ${values.sign}`,
    prophecy,
    signals: {
      blessingPlanet: values.planet,
      blessingSign: values.sign,
      challengePlanet: values.shadowPlanet,
      challengeSign: values.shadowSign,
    },
  };
}
