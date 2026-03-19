import "server-only";

import { PlanetPosition } from '@/types/astrology';
import { getTransitsForDate, TransitMatch } from '@/lib/astrology/transits';
import { resonanceDB } from '@/lib/resonance-database';
import { PersistentUserContextSnapshot } from '@/lib/user-context';

export interface LifeStageTag {
  id: string;
  label: string;
  active: boolean;
  windowStartAge: number;
  windowEndAge: number;
  note: string;
}

export interface PredictiveDomainImpact {
  name: 'love' | 'career' | 'money' | 'family' | 'health' | 'self';
  impact: number;
  valence: number;
}

export interface PredictiveMbtiLens {
  likelyPattern: string;
  blindSpot: string;
  bestMove24h: string;
  avoidNow: string;
}

export interface PredictiveNarrative {
  vibe: string;
  risk: string;
  opportunity: string;
  whisper: string;
}

export interface PredictiveTransitEvent {
  eventId: string;
  transit: TransitMatch & { orbNow: number; orbAtPeak: number };
  timing: {
    phase: 'building' | 'peaking' | 'releasing';
    startsAt: string;
    peakAt: string;
    endsAt: string;
    daysToPeak: number;
    hoursToPeak: number;
  };
  scores: {
    intensity: number;
    confidence: number;
    volatility: number;
    learnedAdjustment: number;
  };
  explanation: {
    aspectWeight: number;
    transitPlanetWeight: number;
    natalPointWeight: number;
    orbFactor: number;
    lifeStageBoost: number;
    mbtiModifier: number;
    contextMultiplier: number;
    learnedAdjustment: number;
    contextSignals: string[];
  };
  domains: PredictiveDomainImpact[];
  lifeStage: {
    tag: string;
    active: boolean;
    note: string;
  };
  mbtiLens: PredictiveMbtiLens;
  narrative: PredictiveNarrative;
}

export interface PredictiveTransitBundle {
  generatedAt: string;
  windowDays: number;
  lifeStages: LifeStageTag[];
  events: PredictiveTransitEvent[];
}

const ASPECT_ORB_MAX: Record<string, number> = {
  Conjunction: 10,
  Sextile: 6,
  Square: 8,
  Trine: 8,
  Opposition: 10,
};

const ASPECT_WEIGHT: Record<string, number> = {
  Conjunction: 1,
  Opposition: 0.92,
  Square: 0.88,
  Trine: 0.74,
  Sextile: 0.62,
};

const TRANSITING_PLANET_WEIGHT: Record<string, number> = {
  Pluto: 1,
  Neptune: 0.94,
  Uranus: 0.93,
  Saturn: 0.91,
  Jupiter: 0.76,
  Mars: 0.73,
  Venus: 0.6,
  Mercury: 0.57,
  Sun: 0.55,
  Moon: 0.45,
};

const NATAL_POINT_WEIGHT: Record<string, number> = {
  Sun: 1,
  Moon: 1,
  Ascendant: 1,
  Midheaven: 1,
  Mercury: 0.88,
  Venus: 0.88,
  Mars: 0.88,
  Jupiter: 0.88,
  Saturn: 0.88,
  Uranus: 0.7,
  Neptune: 0.7,
  Pluto: 0.7,
};

const NATAL_DOMAIN_MAP: Record<string, PredictiveDomainImpact['name'][]> = {
  Ascendant: ['self', 'health'],
  Midheaven: ['career', 'money'],
  Sun: ['career', 'health'],
  Moon: ['family', 'health'],
  Mercury: ['career', 'money'],
  Venus: ['love', 'money'],
  Mars: ['career', 'health'],
  Jupiter: ['career', 'money'],
  Saturn: ['career', 'health'],
  Uranus: ['career', 'family'],
  Neptune: ['love', 'health'],
  Pluto: ['career', 'family'],
};

interface ContextModifiers {
  multiplier: number;
  domainBoosts: Partial<Record<PredictiveDomainImpact['name'], number>>;
  signals: string[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function daysBetween(dateA: Date, dateB: Date): number {
  const a = Date.UTC(dateA.getUTCFullYear(), dateA.getUTCMonth(), dateA.getUTCDate());
  const b = Date.UTC(dateB.getUTCFullYear(), dateB.getUTCMonth(), dateB.getUTCDate());
  return Math.floor((b - a) / (1000 * 60 * 60 * 24));
}

function hoursBetween(dateA: Date, dateB: Date): number {
  return Math.round((dateB.getTime() - dateA.getTime()) / (1000 * 60 * 60));
}

function calculateAge(birthDate: string, atDate: Date): number {
  const [year, month, day] = birthDate.split('-').map(Number);
  const birth = new Date(Date.UTC(year, month - 1, day));
  let age = atDate.getUTCFullYear() - birth.getUTCFullYear();

  const hasHadBirthday =
    atDate.getUTCMonth() > birth.getUTCMonth() ||
    (atDate.getUTCMonth() === birth.getUTCMonth() && atDate.getUTCDate() >= birth.getUTCDate());

  if (!hasHadBirthday) age -= 1;
  return age;
}

function getLifeStages(birthDate: string, now: Date): LifeStageTag[] {
  const age = calculateAge(birthDate, now);
  const stages: Array<Omit<LifeStageTag, 'active'>> = [
    {
      id: 'saturn-return',
      label: 'Saturn Return',
      windowStartAge: 28,
      windowEndAge: 30,
      note: 'Identity restructuring, hard boundaries, and long-term commitments dominate this cycle.',
    },
    {
      id: 'uranus-opposition',
      label: 'Uranus Opposition',
      windowStartAge: 40,
      windowEndAge: 44,
      note: 'Breakthrough pressure rises: freedom, reinvention, and non-negotiable authenticity become central.',
    },
    {
      id: 'chiron-return',
      label: 'Chiron Return',
      windowStartAge: 49,
      windowEndAge: 52,
      note: 'Old pain patterns resurface for healing, integration, and emotional mastery.',
    },
  ];

  return stages.map((stage) => ({
    ...stage,
    active: age >= stage.windowStartAge && age <= stage.windowEndAge,
  }));
}

function getOrbFactor(orb: number, orbMax: number): number {
  const normalized = 1 - clamp(orb, 0, orbMax) / orbMax;
  return Math.pow(normalized, 1.7);
}

function getAspectValence(aspect: string): number {
  if (aspect === 'Square' || aspect === 'Opposition') return -0.35;
  if (aspect === 'Trine' || aspect === 'Sextile') return 0.3;
  return 0.05;
}

function buildContextModifiers(context?: PersistentUserContextSnapshot | null): ContextModifiers {
  if (!context) {
    return {
      multiplier: 1,
      domainBoosts: {},
      signals: [],
    };
  }

  const haystack = [
    context.situation,
    context.mood,
    context.lastFeedbackNotes,
    ...(context.goals || []),
  ]
    .join(' ')
    .toLowerCase();

  const domainBoosts: ContextModifiers['domainBoosts'] = {};
  const signals: string[] = [];
  let multiplier = 1;

  const includeSignal = (signal: string) => {
    if (!signals.includes(signal)) signals.push(signal);
  };

  if (/(homeless|evicted|shelter|couch surf|broke|unemployed|no money)/.test(haystack)) {
    multiplier += 0.18;
    domainBoosts.money = (domainBoosts.money || 0) + 0.35;
    domainBoosts.career = (domainBoosts.career || 0) + 0.3;
    domainBoosts.self = (domainBoosts.self || 0) + 0.12;
    includeSignal('survival pressure');
  }

  if (/(job|interview|resume|application|hiring|work|employment)/.test(haystack)) {
    multiplier += 0.1;
    domainBoosts.career = (domainBoosts.career || 0) + 0.3;
    domainBoosts.money = (domainBoosts.money || 0) + 0.18;
    includeSignal('job focus');
  }

  if (/(anxious|anxiety|scared|panic|overwhelmed|stress)/.test(haystack)) {
    multiplier += 0.08;
    domainBoosts.health = (domainBoosts.health || 0) + 0.2;
    domainBoosts.self = (domainBoosts.self || 0) + 0.2;
    includeSignal('heightened anxiety');
  }

  if (/(breakup|divorce|ghost|relationship|partner|heartbroken)/.test(haystack)) {
    multiplier += 0.08;
    domainBoosts.love = (domainBoosts.love || 0) + 0.3;
    domainBoosts.family = (domainBoosts.family || 0) + 0.12;
    includeSignal('relationship strain');
  }

  return {
    multiplier: clamp(Number(multiplier.toFixed(2)), 1, 1.45),
    domainBoosts,
    signals,
  };
}

function getMbtiModifier(mbtiType: string | undefined, natalPlanet: string): number {
  if (!mbtiType || mbtiType.length !== 4) return 1;

  const [energy, perception, decision, lifestyle] = mbtiType.split('');
  let modifier = 1;

  if (natalPlanet === 'Moon' && energy === 'I') modifier += 0.08;
  if (natalPlanet === 'Moon' && decision === 'F') modifier += 0.06;
  if (natalPlanet === 'Saturn' && lifestyle === 'J') modifier += 0.07;
  if (natalPlanet === 'Uranus' && lifestyle === 'P') modifier += 0.05;
  if (natalPlanet === 'Mercury' && decision === 'T') modifier += 0.04;

  return clamp(modifier, 0.9, 1.15);
}

function buildMbtiLens(mbtiType: string | undefined, event: TransitMatch): PredictiveMbtiLens {
  if (!mbtiType || mbtiType.length !== 4) {
    return {
      likelyPattern: 'You may swing between overthinking and emotional reaction while this transit builds.',
      blindSpot: 'Assuming urgency means certainty.',
      bestMove24h: 'Name one concrete action, then execute before over-analysis returns.',
      avoidNow: 'Major irreversible decisions made in an emotional spike.',
    };
  }

  const [energy, perception, decision, lifestyle] = mbtiType.split('');

  const likelyPattern =
    energy === 'I'
      ? 'You process internally first, then reveal conclusions once they feel complete.'
      : 'You process out loud, using dialogue to test and sharpen your direction.';

  const blindSpot =
    decision === 'T'
      ? 'Treating emotional signals as noise instead of data.'
      : 'Smoothing tension too quickly before naming the real issue.';

  const bestMove24h =
    lifestyle === 'J'
      ? 'Set one structured checkpoint today and make a deliberate call by then.'
      : 'Run a low-risk experiment today and use the result to decide your next move.';

  const avoidNow =
    perception === 'N'
      ? 'Escaping into future scenarios without finishing today’s hard conversation.'
      : `Assuming the immediate facts are the whole story around ${event.natalPlanet}.`;

  return { likelyPattern, blindSpot, bestMove24h, avoidNow };
}

function buildDomainImpacts(
  event: TransitMatch,
  intensity: number,
  contextModifiers: ContextModifiers
): PredictiveDomainImpact[] {
  const mapped = NATAL_DOMAIN_MAP[event.natalPlanet] || ['career'];
  const aspectValence = getAspectValence(event.aspect);

  return mapped.map((domainName, index) => {
    const dampener = index === 0 ? 1 : 0.85;
    const domainBoost = contextModifiers.domainBoosts[domainName] || 0;
    const impact = clamp(Math.round(intensity * dampener * (1 + domainBoost)), 0, 100);
    return {
      name: domainName,
      impact,
      valence: clamp(aspectValence, -1, 1),
    };
  });
}

function buildNarrative(
  event: TransitMatch,
  phase: 'building' | 'peaking' | 'releasing',
  daysToPeak: number,
  contextModifiers: ContextModifiers
): PredictiveNarrative {
  const contextLead = contextModifiers.signals.length
    ? `Your current context (${contextModifiers.signals.join(', ')}) makes this hit more personally. `
    : '';

  const vibe =
    phase === 'building'
      ? `${contextLead}Pressure is building around your ${event.natalPlanet}; this is the setup phase.`
      : phase === 'peaking'
      ? `${contextLead}This transit is peaking now around ${event.natalPlanet}; decisions carry extra weight.`
      : `${contextLead}The peak has passed, but integration around ${event.natalPlanet} is still unfolding.`;

  const risk =
    event.aspect === 'Square' || event.aspect === 'Opposition'
      ? `Reactive choices can create avoidable fallout in the next ${Math.max(daysToPeak, 1)} days.`
      : 'Complacency can waste a strong opening if you wait too long.';

  const opportunity =
    event.aspect === 'Trine' || event.aspect === 'Sextile'
      ? `Momentum is available—small disciplined actions compound quickly now.`
      : `If you stay deliberate under pressure, this becomes a growth pivot instead of a crisis loop.`;

  const whisper =
    contextModifiers.signals.includes('job focus')
      ? 'This week’s vibe: treat the next opening like a real door, not a maybe.'
      : contextModifiers.signals.includes('survival pressure')
      ? 'This week’s vibe: survival mode is loud, so choose the move that protects tomorrow.'
      : phase === 'building'
      ? `This week’s vibe: prepare now so the peak doesn’t catch you ungrounded.`
      : phase === 'peaking'
      ? `This week’s vibe: act cleanly, speak directly, and don’t delay what you already know.`
      : `This week’s vibe: harvest the lesson, then simplify your next move.`;

  return { vibe, risk, opportunity, whisper };
}

export async function buildPredictiveTransitBundle(params: {
  natalPlanets: PlanetPosition[];
  birthDate: string;
  mbtiType?: string;
  userId?: string;
  userContext?: PersistentUserContextSnapshot | null;
  windowDays?: number;
  now?: Date;
}): Promise<PredictiveTransitBundle> {
  const {
    natalPlanets,
    birthDate,
    mbtiType,
    userId,
    userContext,
    windowDays = 7,
    now = new Date(),
  } = params;

  const lifeStages = getLifeStages(birthDate, now);
  const hasActiveLifeStage = lifeStages.some((stage) => stage.active);
  const contextModifiers = buildContextModifiers(userContext);

  const samplesByEvent = new Map<string, Array<{ date: Date; transit: TransitMatch }>>();
  const totalHours = windowDays * 24;

  for (let hourOffset = 0; hourOffset <= totalHours; hourOffset += 6) {
    const date = new Date(now.getTime() + hourOffset * 60 * 60 * 1000);
    const sampledTransits = getTransitsForDate(natalPlanets, date);

    for (const transit of sampledTransits) {
      const eventId = `${transit.transitingPlanet}:${transit.aspect}:${transit.natalPlanet}`;
      const current = samplesByEvent.get(eventId) || [];
      current.push({ date: new Date(date), transit });
      samplesByEvent.set(eventId, current);
    }
  }

  const events = await Promise.all(Array.from(samplesByEvent.entries()).map(async ([eventId, samples]) => {
    const sortedSamples = samples.sort((a, b) => a.date.getTime() - b.date.getTime());
    const currentSample = sortedSamples[0];
    const peakSample = [...sortedSamples].sort((a, b) => a.transit.orb - b.transit.orb)[0];
    const lastSample = sortedSamples[sortedSamples.length - 1];

    const peakDay = daysBetween(now, peakSample.date);
    const peakHours = hoursBetween(now, peakSample.date);
    const currentOrb = currentSample.transit.orb;
    const peakOrb = peakSample.transit.orb;

    const phase: 'building' | 'peaking' | 'releasing' =
      peakDay > 0
        ? 'building'
        : currentOrb <= 0.8
        ? 'peaking'
        : 'releasing';

    const orbMax = ASPECT_ORB_MAX[currentSample.transit.aspect] || 8;
    const orbFactor = getOrbFactor(currentOrb, orbMax);
    const aspectWeight = ASPECT_WEIGHT[currentSample.transit.aspect] || 0.7;
    const transitingWeight = TRANSITING_PLANET_WEIGHT[currentSample.transit.transitingPlanet] || 0.7;
    const natalWeight = NATAL_POINT_WEIGHT[currentSample.transit.natalPlanet] || 0.8;
    const lifeStageBoost = hasActiveLifeStage ? 1.15 : 1;
    const mbtiModifier = getMbtiModifier(mbtiType, currentSample.transit.natalPlanet);
    const confidence = clamp(0.75 + orbFactor * 0.25, 0.75, 1);
    const contextMultiplier = contextModifiers.multiplier;

    const intensityRaw =
      100 * aspectWeight * transitingWeight * natalWeight * orbFactor * lifeStageBoost * mbtiModifier * confidence * contextMultiplier;
    const preContextDomains = buildDomainImpacts(currentSample.transit, Math.round(intensityRaw), contextModifiers);
    const primaryTheme = [...preContextDomains].sort((a, b) => b.impact - a.impact)[0]?.name || 'career';
    const adjustedWeight = userId
      ? await resonanceDB.calculateFinalWeight(userId, eventId, primaryTheme, intensityRaw / 100)
      : intensityRaw / 100;
    const learnedAdjustment = Number((adjustedWeight - intensityRaw / 100).toFixed(2));
    const intensity = clamp(Math.round(adjustedWeight * 100), 0, 100);

    const volatilityRaw =
      (currentSample.transit.aspect === 'Square' || currentSample.transit.aspect === 'Opposition' ? 0.25 : 0.1) +
      (['Pluto', 'Uranus', 'Saturn', 'Neptune'].includes(currentSample.transit.transitingPlanet) ? 0.35 : 0.15) +
      (orbFactor * 0.4);

    const volatility = clamp(Number(volatilityRaw.toFixed(2)), 0, 1);

    const activeStage = lifeStages.find((stage) => stage.active) || lifeStages[0];
  const domains = buildDomainImpacts(currentSample.transit, intensity, contextModifiers);
    const mbtiLens = buildMbtiLens(mbtiType, currentSample.transit);
  const narrative = buildNarrative(currentSample.transit, phase, peakDay, contextModifiers);

    return {
      eventId,
      transit: {
        ...currentSample.transit,
        orbNow: Number(currentOrb.toFixed(2)),
        orbAtPeak: Number(peakOrb.toFixed(2)),
      },
      timing: {
        phase,
        startsAt: currentSample.date.toISOString(),
        peakAt: peakSample.date.toISOString(),
        endsAt: lastSample.date.toISOString(),
        daysToPeak: peakDay,
        hoursToPeak: peakHours,
      },
      scores: {
        intensity,
        confidence: Number(confidence.toFixed(2)),
        volatility,
        learnedAdjustment,
      },
      explanation: {
        aspectWeight: Number(aspectWeight.toFixed(2)),
        transitPlanetWeight: Number(transitingWeight.toFixed(2)),
        natalPointWeight: Number(natalWeight.toFixed(2)),
        orbFactor: Number(orbFactor.toFixed(2)),
        lifeStageBoost: Number(lifeStageBoost.toFixed(2)),
        mbtiModifier: Number(mbtiModifier.toFixed(2)),
        contextMultiplier: Number(contextMultiplier.toFixed(2)),
        learnedAdjustment,
        contextSignals: contextModifiers.signals,
      },
      domains,
      lifeStage: {
        tag: activeStage.label,
        active: activeStage.active,
        note: activeStage.note,
      },
      mbtiLens,
      narrative,
    };
  }));

  const rankedEvents = events
    .sort((a, b) => b.scores.intensity - a.scores.intensity)
    .slice(0, 12);

  return {
    generatedAt: now.toISOString(),
    windowDays,
    lifeStages,
    events: rankedEvents,
  };
}
