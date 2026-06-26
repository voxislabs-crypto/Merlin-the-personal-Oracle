import type {
  AtmosphereActiveTransit,
  AtmospherePatternProfile,
  AtmospherePatternRecord,
  AtmospherePatternsContext,
  AtmospherePatternMatch,
  AtmosphereSensitivityTag,
} from '@/lib/atmosphere/pattern-types';

const KNOWN_PLANETS = [
  'Sun',
  'Moon',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto',
] as const;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function buildPlanetPatternKey(planet: string): string {
  return `planet:${planet}`;
}

export function buildTransitPatternKey(
  transitingPlanet: string,
  aspect: string,
  natalPlanet: string
): string {
  return `transit:${transitingPlanet}:${aspect}:${natalPlanet}`;
}

export function extractPlanetsFromText(value: string): string[] {
  const found: string[] = [];
  for (const planet of KNOWN_PLANETS) {
    if (value.includes(planet)) {
      found.push(planet);
    }
  }

  return found.sort((left, right) => value.indexOf(left) - value.indexOf(right));
}

export function parseAspectId(aspectId: string): {
  transitingPlanet?: string;
  natalPlanet?: string;
  aspect?: string;
} {
  const planets = extractPlanetsFromText(aspectId);
  const normalized = aspectId.replace(/[_-]+/g, ' ');

  const aspectMatch = normalized.match(
    /\b(conjunction|opposition|square|trine|sextile|quincunx)\b/i
  );

  if (planets.length >= 2) {
    return {
      transitingPlanet: planets[0],
      natalPlanet: planets[1],
      aspect: aspectMatch?.[1]
        ? aspectMatch[1].charAt(0).toUpperCase() + aspectMatch[1].slice(1).toLowerCase()
        : undefined,
    };
  }

  if (planets.length === 1) {
    return { transitingPlanet: planets[0] };
  }

  return {};
}

export function feedbackSignalToSensitivity(resonated: boolean, accuracyScore: number): number {
  const signed = resonated ? accuracyScore : -accuracyScore;
  return clamp(signed, -1, 1);
}

export function mergeSensitivityScores(
  existingScore: number,
  existingCount: number,
  incomingScore: number
): { score: number; count: number; confidence: number } {
  const nextCount = existingCount + 1;
  const score = (existingScore * existingCount + incomingScore) / nextCount;
  const confidence = clamp(Math.sqrt(nextCount / 6), 0.2, 1);
  return {
    score: Number(score.toFixed(3)),
    count: nextCount,
    confidence: Number(confidence.toFixed(3)),
  };
}

export function deriveSensitivityTags(
  patternKey: string,
  sensitivityScore: number,
  theme?: string
): AtmosphereSensitivityTag[] {
  const tags = new Set<AtmosphereSensitivityTag>();
  const normalizedTheme = (theme || '').toLowerCase();
  const normalizedKey = patternKey.toLowerCase();

  if (normalizedKey.includes('moon') || normalizedTheme.includes('emotion')) {
    tags.add('emotional_reactivity');
  }
  if (normalizedKey.includes('mars') || normalizedTheme.includes('pressure')) {
    tags.add('work_pressure');
  }
  if (normalizedKey.includes('saturn') || normalizedTheme.includes('limit')) {
    tags.add('stress_reactivity');
  }
  if (normalizedKey.includes('mercury') || normalizedTheme.includes('clarity')) {
    tags.add('clarity_boost');
  }
  if (sensitivityScore <= -0.35) {
    tags.add('energy_drain');
  }
  if (normalizedTheme.includes('validation')) {
    tags.add('validation_loop');
  }

  if (!tags.size) {
    tags.add(sensitivityScore >= 0 ? 'clarity_boost' : 'stress_reactivity');
  }

  return Array.from(tags);
}

export function deriveCheckinTags(stress: number, mood: number, energy: number): AtmosphereSensitivityTag[] {
  const tags = new Set<AtmosphereSensitivityTag>();
  if (stress >= 7) tags.add('stress_reactivity');
  if (mood <= 4) tags.add('emotional_reactivity');
  if (energy <= 4) tags.add('energy_drain');
  if (mood >= 7 && energy >= 7) tags.add('clarity_boost');
  return Array.from(tags);
}

export function sensitivityScoreToModifier(score: number, confidence: number): number {
  return clamp(1 + score * 0.18 * confidence, 0.85, 1.15);
}

export function resolvePatternMatches(
  profile: AtmospherePatternProfile | null | undefined,
  activeTransits: AtmosphereActiveTransit[] = []
): AtmospherePatternMatch[] {
  if (!profile?.patterns.length || !activeTransits.length) return [];

  const matches: AtmospherePatternMatch[] = [];

  for (const transit of activeTransits) {
    const transitingPlanet = transit.transitingPlanet;
    const natalPlanet = transit.natalPlanet;
    const aspect = transit.aspect;

    if (transitingPlanet && natalPlanet && aspect) {
      const transitKey = buildTransitPatternKey(transitingPlanet, aspect, natalPlanet);
      const transitPattern = profile.patterns.find((pattern) => pattern.patternKey === transitKey);
      if (transitPattern) {
        matches.push(toPatternMatch(transitPattern));
      }
    }

    for (const planet of [transitingPlanet, natalPlanet].filter(Boolean)) {
      const planetKey = buildPlanetPatternKey(planet as string);
      const planetPattern = profile.patterns.find((pattern) => pattern.patternKey === planetKey);
      if (planetPattern) {
        matches.push(toPatternMatch(planetPattern));
      }
    }
  }

  const deduped = new Map<string, AtmospherePatternMatch>();
  for (const match of matches) {
    const existing = deduped.get(match.patternKey);
    if (!existing || Math.abs(match.sensitivityScore) > Math.abs(existing.sensitivityScore)) {
      deduped.set(match.patternKey, match);
    }
  }

  return Array.from(deduped.values()).sort(
    (left, right) => Math.abs(right.sensitivityScore) - Math.abs(left.sensitivityScore)
  );
}

function toPatternMatch(record: AtmospherePatternRecord): AtmospherePatternMatch {
  return {
    patternKey: record.patternKey,
    patternType:
      record.patternType === 'transit'
        ? 'transit'
        : record.patternType === 'tag'
          ? 'tag'
          : 'planet',
    sensitivityScore: record.sensitivityScore,
    confidence: record.confidence,
    tags: record.tags,
  };
}

export function resolvePatternModifier(matches: AtmospherePatternMatch[]): number {
  if (!matches.length) return 1;

  let strongest = 1;
  for (const match of matches) {
    const candidate = sensitivityScoreToModifier(match.sensitivityScore, match.confidence);
    if (Math.abs(candidate - 1) > Math.abs(strongest - 1)) {
      strongest = candidate;
    }
  }

  return Number(strongest.toFixed(3));
}

export function resolveAtmospherePatternsContext(
  profile: AtmospherePatternProfile | null | undefined,
  activeTransits: AtmosphereActiveTransit[] = []
): AtmospherePatternsContext {
  const active = resolvePatternMatches(profile, activeTransits);
  const modifier = resolvePatternModifier(active);
  const tags = Array.from(new Set(active.flatMap((match) => match.tags)));
  const provenance: string[] = [];

  if (active.length) {
    provenance.push('pattern-store-active');
    provenance.push(...active.slice(0, 3).map((match) => `pattern-${match.patternKey}`));
  }

  return {
    active,
    modifier,
    tags,
    provenance,
  };
}