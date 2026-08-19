/**
 * Meaning synthesis — the layer above themes.
 *
 * Signals → Themes was necessary. Humans still do not live in
 * isolated themes. They live in a storyline:
 *
 *   Themes → Meta-theme → Tension → Developmental process → Question
 *
 * This module does not add techniques. It adds language:
 * hierarchy, interaction, tension (not narrative), stage, coherence,
 * archetype (for wording), visibility vs interiority, persistence,
 * and a question that comes from the tension.
 *
 * Nothing here is a prediction, timeline, outcome, or event.
 */

import type { LivedTheme, LivedThemePacket } from '@/lib/astrology/lived-themes';

export type MetaTheme =
  | 'maturation'
  | 'liberation'
  | 'expansion'
  | 'dissolution'
  | 'initiation'
  | 'repair';

export type DevelopmentalStage =
  | 'consolidation'
  | 'experimentation'
  | 'deep-restructuring'
  | 'expansion'
  | 'integration'
  | 'release';

export type Persistence = 'momentary' | 'short-term' | 'seasonal' | 'long-term';

export type SymbolicArchetype =
  | 'builder'
  | 'reformer'
  | 'explorer'
  | 'alchemist'
  | 'guardian'
  | 'seeker'
  | 'weaver';

export interface ThemeHierarchy {
  metaTheme: MetaTheme;
  theme: string;
  subThemes: string[];
}

export interface ThemeInteraction {
  themeA: string;
  themeB: string;
  interaction: string;
}

export interface ReflectionPacket {
  metaTheme: MetaTheme;
  coreTension: string;
  developmentalStage: DevelopmentalStage;
  archetype: SymbolicArchetype;
  meaningDensity: number;
  themeCoherence: number;
  signalStrength: number;
  interpretationConfidence: number;
  internalIntensity: number;
  externalVisibility: number;
  persistence: Persistence;
  hierarchy: ThemeHierarchy;
  interactions: ThemeInteraction[];
  subThemes: string[];
  reflectivePrompt: string;
  supportingThemes: Array<{ theme: string; meaningDensity: number }>;
  framing: 'reflection';
}

export type LivedMeaningPacket = LivedThemePacket & {
  reflection: ReflectionPacket | null;
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function norm(value: string | undefined): string {
  return (value || '').trim().toLowerCase();
}

function actorsOf(theme: LivedTheme): string[] {
  return theme.contributors
    .map((c) => norm(c.actor || c.label.split(/\s+/)[0]))
    .filter(Boolean);
}

function sourcesOf(theme: LivedTheme): string[] {
  return Array.from(new Set(theme.contributors.map((c) => c.source)));
}

function countActor(themes: LivedTheme[], planet: string): number {
  return themes.reduce(
    (sum, theme) => sum + actorsOf(theme).filter((actor) => actor === planet).length,
    0,
  );
}

const SUBTHEMES: Array<{ match: RegExp; subs: string[] }> = [
  {
    match: /identity restructuring|responsibility/,
    subs: ['responsibility', 'self-definition', 'authority'],
  },
  {
    match: /relationship recalibration/,
    subs: ['autonomy', 'boundaries', 'authenticity'],
  },
  {
    match: /career responsibility/,
    subs: ['duty', 'public role', 'competence'],
  },
  {
    match: /expansion under constraint/,
    subs: ['growth', 'limits', 'sequencing'],
  },
  {
    match: /visible identity disruption/,
    subs: ['authenticity', 'visibility', 'change'],
  },
  {
    match: /identity transformation/,
    subs: ['endings', 'self-definition', 'power'],
  },
  {
    match: /home and foundations/,
    subs: ['belonging', 'security', 'roots'],
  },
];

export function subThemesFor(themeName: string): string[] {
  const found = SUBTHEMES.find((entry) => entry.match.test(themeName));
  return found ? [...found.subs] : ['emphasis', 'attention', 'choice'];
}

export function classifyMetaTheme(themes: LivedTheme[]): MetaTheme {
  const saturn = countActor(themes, 'saturn');
  const pluto = countActor(themes, 'pluto');
  const uranus = countActor(themes, 'uranus');
  const jupiter = countActor(themes, 'jupiter');
  const neptune = countActor(themes, 'neptune');
  const names = themes.map((t) => t.theme).join(' ');

  if (/liberation|disruption|autonomy/.test(names) || uranus >= saturn && uranus > 0 && uranus >= pluto) {
    if (uranus > 0 && uranus >= Math.max(saturn, pluto, jupiter, neptune)) return 'liberation';
  }
  if (neptune >= 2 && neptune >= Math.max(saturn, pluto, uranus)) return 'dissolution';
  if (jupiter > saturn && jupiter > pluto && jupiter > uranus) return 'expansion';
  if (pluto >= saturn && pluto > 0 && pluto >= uranus) return 'maturation';
  if (saturn > 0) return 'maturation';
  if (uranus > 0) return 'liberation';
  if (jupiter > 0) return 'expansion';
  return 'initiation';
}

export function classifyStage(themes: LivedTheme[]): DevelopmentalStage {
  const saturn = countActor(themes, 'saturn');
  const pluto = countActor(themes, 'pluto');
  const uranus = countActor(themes, 'uranus');
  const jupiter = countActor(themes, 'jupiter');
  const neptune = countActor(themes, 'neptune');

  if (saturn > 0 && jupiter > 0 && Math.abs(saturn - jupiter) <= 1) return 'integration';
  if (pluto >= Math.max(saturn, uranus, jupiter, 1)) return 'deep-restructuring';
  if (uranus >= Math.max(saturn, pluto, jupiter, 1)) return 'experimentation';
  if (jupiter > saturn && jupiter > pluto) return 'expansion';
  if (neptune >= Math.max(saturn, pluto, 1) && neptune > 0) return 'release';
  if (saturn > 0) return 'consolidation';
  return 'integration';
}

export function classifyArchetype(
  meta: MetaTheme,
  stage: DevelopmentalStage,
  themes: LivedTheme[],
): SymbolicArchetype {
  if (stage === 'deep-restructuring' || meta === 'maturation' && countActor(themes, 'pluto') > 0) {
    if (countActor(themes, 'pluto') >= countActor(themes, 'saturn')) return 'alchemist';
  }
  if (meta === 'liberation' || stage === 'experimentation') return 'reformer';
  if (meta === 'expansion' || stage === 'expansion') return 'explorer';
  if (meta === 'dissolution' || stage === 'release') return 'seeker';
  if (stage === 'integration') return 'weaver';
  if (themes.some((t) => /career|responsibility/.test(t.theme))) return 'guardian';
  return 'builder';
}

export function themeCoherence(theme: LivedTheme, siblingCount: number): number {
  const sources = sourcesOf(theme);
  const domainKeys = Object.keys(theme.domains);
  const domainValues = Object.values(theme.domains) as number[];
  const topDomain = Math.max(0, ...domainValues);
  const domainSum = domainValues.reduce((a, b) => a + b, 0) || 1;
  const concentration = topDomain / domainSum;
  const techniqueBonus = Math.min(24, (sources.length - 1) * 10);
  const scatterPenalty = Math.max(0, domainKeys.length - 2) * 8;
  const siblingPenalty = Math.max(0, siblingCount - 2) * 4;
  const resonance = theme.natalResonance * 0.18;

  return clamp(
    42 + concentration * 32 + techniqueBonus + resonance - scatterPenalty - siblingPenalty,
  );
}

export function meaningDensity(theme: LivedTheme, siblingCount: number): number {
  const coherence = themeCoherence(theme, siblingCount);
  return clamp((theme.impact * coherence) / 100);
}

function persistenceFrom(themes: LivedTheme[]): Persistence {
  const actors = themes.flatMap(actorsOf);
  const sources = themes.flatMap(sourcesOf);
  if (actors.some((a) => ['saturn', 'pluto', 'neptune', 'uranus'].includes(a))) return 'long-term';
  if (sources.some((s) => s === 'progression' || s === 'solar-arc' || s === 'solar-return')) {
    return 'long-term';
  }
  if (actors.includes('jupiter')) return 'seasonal';
  if (actors.includes('mars')) return 'short-term';
  return 'momentary';
}

function splitVisibility(themes: LivedTheme[]): { internal: number; external: number } {
  if (themes.length === 0) return { internal: 40, external: 40 };
  const vis = themes.reduce((sum, t) => sum + t.visibility, 0) / themes.length;
  const pressure = themes.reduce((sum, t) => sum + t.pressure, 0) / themes.length;
  const actors = themes.flatMap(actorsOf);
  const targets = themes.flatMap((t) => t.contributors.map((c) => norm(c.natalPlanet)));

  let external = vis;
  let internal = clamp(pressure * 0.45 + (100 - vis) * 0.35);

  if (actors.includes('neptune') || targets.includes('moon')) {
    internal = clamp(internal + 22);
    external = clamp(external - 18);
  }
  if (
    actors.includes('pluto') &&
    targets.some((t) => ['ascendant', 'rising', 'midheaven', 'mc'].includes(t))
  ) {
    external = clamp(external + 24);
    internal = clamp(internal + 16);
  }
  if (actors.includes('uranus') && targets.some((t) => ['ascendant', 'rising'].includes(t))) {
    external = clamp(external + 20);
  }

  return { internal: clamp(internal), external: clamp(external) };
}

const INTERACTIONS: Array<{ a: RegExp; b: RegExp; interaction: string }> = [
  {
    a: /career|responsibility/,
    b: /relationship/,
    interaction: 'role conflict',
  },
  {
    a: /identity restructuring|identity transformation/,
    b: /career|responsibility/,
    interaction: 'old structure making room for a truer role',
  },
  {
    a: /identity/,
    b: /expansion|growth/,
    interaction: 'old structure making room for growth',
  },
  {
    a: /identity|responsibility/,
    b: /home|foundations/,
    interaction: 'public duty pulling against private ground',
  },
  {
    a: /liberation|disruption/,
    b: /relationship/,
    interaction: 'authenticity straining an existing bond',
  },
];

export function themeInteractions(themes: LivedTheme[]): ThemeInteraction[] {
  const pairs: ThemeInteraction[] = [];
  for (let i = 0; i < themes.length; i += 1) {
    for (let j = i + 1; j < themes.length; j += 1) {
      const a = themes[i].theme;
      const b = themes[j].theme;
      const match = INTERACTIONS.find(
        (rule) =>
          (rule.a.test(a) && rule.b.test(b)) || (rule.a.test(b) && rule.b.test(a)),
      );
      if (match) {
        pairs.push({ themeA: a, themeB: b, interaction: match.interaction });
      }
    }
  }
  if (pairs.length === 0 && themes.length >= 2) {
    pairs.push({
      themeA: themes[0].theme,
      themeB: themes[1].theme,
      interaction: 'two currents sharing the same season',
    });
  }
  return pairs.slice(0, 3);
}

function coreTension(lead: LivedTheme, interactions: ThemeInteraction[]): string {
  if (interactions[0]?.interaction === 'role conflict') {
    return 'the role you hold versus the relationship you are actually in';
  }
  if (interactions[0]?.interaction.includes('old structure')) {
    return 'maintaining existing responsibilities while redefining who you are';
  }
  if (/expansion under constraint/.test(lead.theme)) {
    return 'growing inside a limit rather than around it';
  }
  if (/relationship recalibration/.test(lead.theme)) {
    return 'staying connected without abandoning yourself';
  }
  if (/visible identity disruption|liberation/.test(lead.theme)) {
    return 'becoming more recognizable to yourself than to the room';
  }
  if (/identity/.test(lead.theme) && lead.pressure >= 55 && lead.growth >= 45) {
    return 'maintaining existing responsibilities while redefining who you are';
  }
  if (/home/.test(lead.theme)) {
    return 'what feels like home versus what has merely been familiar';
  }
  return `${lead.theme} held against the life that already exists`;
}

function questionFromTension(tension: string): string {
  if (/responsib/.test(tension) && /redefin|who you are/.test(tension)) {
    return 'Which commitments still reflect who you are becoming?';
  }
  if (/role you hold/.test(tension)) {
    return 'Where is the role asking you to perform a self that the relationship can no longer hold?';
  }
  if (/inside a limit/.test(tension)) {
    return 'Where is life asking you to grow *inside* a limit, rather than around it?';
  }
  if (/abandoning yourself/.test(tension)) {
    return 'What would honesty look like here if you did not have to leave to be true?';
  }
  if (/recognizable to yourself/.test(tension)) {
    return 'What change in how you show up is already underway — whether or not you have announced it?';
  }
  if (/home versus/.test(tension)) {
    return 'What in your base of operations needs to become more true, even if it is less comfortable?';
  }
  return 'What is asking to be taken seriously here — without requiring you to know the ending?';
}

export function synthesizeReflection(packet: LivedThemePacket): ReflectionPacket | null {
  if (!packet.themes.length) return null;

  const ranked = [...packet.themes].sort(
    (a, b) => meaningDensity(b, packet.themes.length) - meaningDensity(a, packet.themes.length),
  );
  const lead = ranked[0];
  const siblingCount = packet.themes.length;
  const coherence = themeCoherence(lead, siblingCount);
  const density = meaningDensity(lead, siblingCount);
  const metaTheme = classifyMetaTheme(ranked);
  const stage = classifyStage(ranked);
  const archetype = classifyArchetype(metaTheme, stage, ranked);
  const interactions = themeInteractions(ranked);
  const subThemes = subThemesFor(lead.theme);
  const tension = coreTension(lead, interactions);
  const vis = splitVisibility(ranked);

  return {
    metaTheme,
    coreTension: tension,
    developmentalStage: stage,
    archetype,
    meaningDensity: density,
    themeCoherence: coherence,
    signalStrength: lead.signalStrength,
    interpretationConfidence: lead.interpretationConfidence,
    internalIntensity: vis.internal,
    externalVisibility: vis.external,
    persistence: persistenceFrom(ranked),
    hierarchy: {
      metaTheme,
      theme: lead.theme,
      subThemes,
    },
    interactions,
    subThemes,
    reflectivePrompt: questionFromTension(tension),
    supportingThemes: ranked.slice(1, 4).map((theme) => ({
      theme: theme.theme,
      meaningDensity: meaningDensity(theme, siblingCount),
    })),
    framing: 'reflection',
  };
}

export function withReflection(packet: LivedThemePacket): LivedMeaningPacket {
  return {
    ...packet,
    reflection: synthesizeReflection(packet),
  };
}
