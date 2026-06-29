import "server-only";

import { PlanetPosition } from '@/types/astrology';
import { getTransitsForDate, TransitMatch } from '@/lib/astrology/transits';
import { resonanceDB } from '@/lib/resonance-database';
import { PersistentUserContextSnapshot } from '@/lib/user-context';
import { isPrismaStoreUnavailableError } from '@/lib/prisma-errors';

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

export interface PredictiveLunarTiming {
  phase: string;
  illumination: number;
  isVoidOfCourse: boolean;
  hoursToNextSign: number;
  nextSignAt: string;
  actionBias: 'initiate' | 'build' | 'review' | 'release';
  guidance: string;
}

export interface PredictiveProgressedMoon {
  sign: string;
  degree: number;
  yearsProgressed: number;
  emphasis: Array<PredictiveDomainImpact['name']>;
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
    resonanceMultiplier: number;
  };
  explanation: {
    aspectWeight: number;
    transitPlanetWeight: number;
    natalPointWeight: number;
    orbFactor: number;
    lifeStageBoost: number;
    mbtiModifier: number;
    contextMultiplier: number;
    progressedMoonBoost: number;
    lunarTimingModifier: number;
    learnedAdjustment: number;
    contextSignals: string[];
    lunarSignals: string[];
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
  lunarTiming: PredictiveLunarTiming;
  progressedMoon: PredictiveProgressedMoon;
  events: PredictiveTransitEvent[];
}

function isMissingResonanceTableError(error: unknown): boolean {
  if (isPrismaStoreUnavailableError(error)) {
    return true;
  }

  const code = (error as { code?: string } | null)?.code;
  const message = (error as { message?: string } | null)?.message || '';

  if (code === 'P2021') {
    return true;
  }

  return (
    message.includes('does not exist in the current database') &&
    (message.includes('ResonanceUser') ||
      message.includes('PersonalResonanceRecord') ||
      message.includes('GlobalResonanceRecord') ||
      message.includes('ClusterResonanceRecord') ||
      message.includes('ResonanceFeedbackRecord'))
  );
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

const MOON_SIGN_DOMAIN_MAP: Record<string, Array<PredictiveDomainImpact['name']>> = {
  Aries: ['self', 'health'],
  Taurus: ['money', 'self'],
  Gemini: ['career', 'self'],
  Cancer: ['family', 'health'],
  Leo: ['love', 'self'],
  Virgo: ['health', 'career'],
  Libra: ['love', 'career'],
  Scorpio: ['family', 'self'],
  Sagittarius: ['career', 'self'],
  Capricorn: ['career', 'money'],
  Aquarius: ['career', 'family'],
  Pisces: ['health', 'love'],
};

const ZODIAC_SIGNS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeAngle(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function dateToJulianDay(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
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

function calculateLunarPhaseSnapshot(date: Date): { phase: string; illumination: number } {
  const jd = dateToJulianDay(date);
  const knownNewMoon = 2451549.5;
  const synodicMonth = 29.53059;
  const daysSinceNew = ((jd - knownNewMoon) % synodicMonth + synodicMonth) % synodicMonth;

  if (daysSinceNew < 1.84566) return { phase: 'New Moon', illumination: 0 };
  if (daysSinceNew < 5.53699) {
    return {
      phase: 'Waxing Crescent',
      illumination: clamp(Math.round(((daysSinceNew - 1.84566) / (5.53699 - 1.84566)) * 50), 5, 45),
    };
  }
  if (daysSinceNew < 9.22831) return { phase: 'First Quarter', illumination: 50 };
  if (daysSinceNew < 12.91963) {
    return {
      phase: 'Waxing Gibbous',
      illumination: clamp(Math.round(50 + ((daysSinceNew - 9.22831) / (12.91963 - 9.22831)) * 50), 55, 95),
    };
  }
  if (daysSinceNew < 16.61096) return { phase: 'Full Moon', illumination: 100 };
  if (daysSinceNew < 20.30228) {
    return {
      phase: 'Waning Gibbous',
      illumination: clamp(Math.round(100 - ((daysSinceNew - 16.61096) / (20.30228 - 16.61096)) * 45), 55, 95),
    };
  }
  if (daysSinceNew < 23.99361) return { phase: 'Last Quarter', illumination: 50 };
  return {
    phase: 'Waning Crescent',
    illumination: clamp(Math.round(50 - ((daysSinceNew - 23.99361) / (29.53059 - 23.99361)) * 50), 5, 45),
  };
}

function getApproxMoonLongitude(date: Date): number {
  const daysSinceJ2000 = dateToJulianDay(date) - 2451545.0;
  return normalizeAngle(218.316 + 13.176396 * daysSinceJ2000);
}

function getLunarTiming(now: Date): PredictiveLunarTiming {
  const phaseSnapshot = calculateLunarPhaseSnapshot(now);
  const moonLongitude = getApproxMoonLongitude(now);
  const degreeInSign = moonLongitude % 30;
  const hoursToNextSign = Number((((30 - degreeInSign) / 13.176396) * 24).toFixed(1));
  const isVoidOfCourse = hoursToNextSign <= 3;
  const nextSignAt = new Date(now.getTime() + hoursToNextSign * 60 * 60 * 1000).toISOString();

  let actionBias: PredictiveLunarTiming['actionBias'] = 'build';
  let guidance = 'Momentum supports practical steps and steady follow-through.';

  if (phaseSnapshot.phase === 'New Moon') {
    actionBias = 'initiate';
    guidance = 'Seed intentions and begin what matters; keep scope focused and clear.';
  } else if (phaseSnapshot.phase === 'Waxing Crescent' || phaseSnapshot.phase === 'First Quarter') {
    actionBias = 'build';
    guidance = 'Build traction with decisive action and measurable progress.';
  } else if (phaseSnapshot.phase === 'Full Moon' || phaseSnapshot.phase === 'Waning Gibbous') {
    actionBias = 'review';
    guidance = 'Review outcomes and make visible adjustments before committing further.';
  } else if (phaseSnapshot.phase === 'Last Quarter' || phaseSnapshot.phase === 'Waning Crescent') {
    actionBias = 'release';
    guidance = 'Release what is not working and simplify priorities before the next cycle.';
  }

  if (isVoidOfCourse) {
    guidance = 'Moon is near sign transition: avoid high-stakes launches for a few hours; focus on maintenance and review.';
  }

  return {
    phase: phaseSnapshot.phase,
    illumination: phaseSnapshot.illumination,
    isVoidOfCourse,
    hoursToNextSign,
    nextSignAt,
    actionBias,
    guidance,
  };
}

function getProgressedMoonProfile(
  natalPlanets: PlanetPosition[],
  birthDate: string,
  now: Date
): PredictiveProgressedMoon {
  const natalMoon = natalPlanets.find((planet) => planet.name === 'Moon');
  const fallback: PredictiveProgressedMoon = {
    sign: 'Cancer',
    degree: 0,
    yearsProgressed: 0,
    emphasis: ['family', 'health'],
  };

  if (!natalMoon) return fallback;

  const [year, month, day] = birthDate.split('-').map(Number);
  const birth = new Date(Date.UTC(year, month - 1, day));
  const yearsProgressed = clamp((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365.25), 0, 120);
  const progressedLongitude = normalizeAngle(natalMoon.longitude + yearsProgressed * 13.2);
  const signIndex = Math.floor(progressedLongitude / 30);
  const sign = ZODIAC_SIGNS[signIndex] || 'Cancer';
  const degree = Number((progressedLongitude % 30).toFixed(1));

  return {
    sign,
    degree,
    yearsProgressed: Number(yearsProgressed.toFixed(1)),
    emphasis: MOON_SIGN_DOMAIN_MAP[sign] || ['family', 'health'],
  };
}

function getProgressedMoonModifier(
  event: TransitMatch,
  progressedMoon: PredictiveProgressedMoon
): number {
  const domains = NATAL_DOMAIN_MAP[event.natalPlanet] || [];
  const overlap = domains.filter((domain) => progressedMoon.emphasis.includes(domain));
  const hasMoonTheme = event.natalPlanet === 'Moon' || event.transitingPlanet === 'Moon';

  if (hasMoonTheme) return 1.12;
  if (overlap.length >= 2) return 1.1;
  if (overlap.length === 1) return 1.06;
  return 1;
}

function getLunarTimingModifier(event: TransitMatch, lunarTiming: PredictiveLunarTiming): number {
  let modifier = 1;
  const isHardAspect = event.aspect === 'Square' || event.aspect === 'Opposition';
  const isSoftAspect = event.aspect === 'Trine' || event.aspect === 'Sextile';

  if (lunarTiming.isVoidOfCourse) {
    modifier -= isHardAspect ? 0.12 : 0.08;
  }

  if (lunarTiming.actionBias === 'initiate' && isSoftAspect) modifier += 0.06;
  if (lunarTiming.actionBias === 'review' && isHardAspect) modifier += 0.03;
  if (lunarTiming.actionBias === 'release' && event.natalPlanet === 'Saturn') modifier += 0.02;

  return clamp(Number(modifier.toFixed(2)), 0.82, 1.12);
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

  const [energy, , decision, lifestyle] = mbtiType.split('');
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
  contextModifiers: ContextModifiers,
  supplementalBoosts?: Partial<Record<PredictiveDomainImpact['name'], number>>
): PredictiveDomainImpact[] {
  const mapped = NATAL_DOMAIN_MAP[event.natalPlanet] || ['career'];
  const aspectValence = getAspectValence(event.aspect);

  return mapped.map((domainName, index) => {
    const dampener = index === 0 ? 1 : 0.85;
    const domainBoost = (contextModifiers.domainBoosts[domainName] || 0) + (supplementalBoosts?.[domainName] || 0);
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
  contextModifiers: ContextModifiers,
  lunarTiming?: PredictiveLunarTiming
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
      : lunarTiming?.isVoidOfCourse
      ? 'This week’s vibe: pause high-stakes launches until the Moon changes sign, then move cleanly.'
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
  const lunarTiming = getLunarTiming(now);
  const progressedMoon = getProgressedMoonProfile(natalPlanets, birthDate, now);

  const samplesByEvent = new Map<string, Array<{ date: Date; transit: TransitMatch }>>();
  let resonanceUnavailable = false;
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
    const progressedMoonBoost = getProgressedMoonModifier(currentSample.transit, progressedMoon);
    const lunarTimingModifier = getLunarTimingModifier(currentSample.transit, lunarTiming);
    const confidence = clamp((0.75 + orbFactor * 0.25) * (lunarTiming.isVoidOfCourse ? 0.92 : 1), 0.68, 1);
    const contextMultiplier = contextModifiers.multiplier;

    const intensityRaw =
      100 *
      aspectWeight *
      transitingWeight *
      natalWeight *
      orbFactor *
      lifeStageBoost *
      mbtiModifier *
      progressedMoonBoost *
      lunarTimingModifier *
      confidence *
      contextMultiplier;
    const preContextDomains = buildDomainImpacts(currentSample.transit, Math.round(intensityRaw), contextModifiers);
    const primaryTheme = [...preContextDomains].sort((a, b) => b.impact - a.impact)[0]?.name || 'career';
    let adjustedWeight = intensityRaw / 100;
    if (userId && !resonanceUnavailable) {
      try {
        adjustedWeight = await resonanceDB.calculateFinalWeight(userId, eventId, primaryTheme, intensityRaw / 100);
      } catch (error) {
        if (isMissingResonanceTableError(error)) {
          resonanceUnavailable = true;
          console.warn('[PredictiveTransits] Resonance tables missing, using base weighting');
        } else {
          console.warn('[PredictiveTransits] Failed to apply resonance weighting:', error);
        }
      }
    }
    const learnedAdjustment = Number((adjustedWeight - intensityRaw / 100).toFixed(2));
    const intensity = clamp(Math.round(adjustedWeight * 100), 0, 100);

    const volatilityRaw =
      (currentSample.transit.aspect === 'Square' || currentSample.transit.aspect === 'Opposition' ? 0.25 : 0.1) +
      (['Pluto', 'Uranus', 'Saturn', 'Neptune'].includes(currentSample.transit.transitingPlanet) ? 0.35 : 0.15) +
      (orbFactor * 0.4);

    const volatility = clamp(Number(volatilityRaw.toFixed(2)), 0, 1);

    const activeStage = lifeStages.find((stage) => stage.active) || lifeStages[0];
    const moonDomainBoosts: Partial<Record<PredictiveDomainImpact['name'], number>> = {};
    progressedMoon.emphasis.forEach((domain, index) => {
      moonDomainBoosts[domain] = index === 0 ? 0.12 : 0.07;
    });

    const domains = buildDomainImpacts(currentSample.transit, intensity, contextModifiers, moonDomainBoosts);
    const mbtiLens = buildMbtiLens(mbtiType, currentSample.transit);
    const narrative = buildNarrative(currentSample.transit, phase, peakDay, contextModifiers, lunarTiming);
    const lunarSignals: string[] = [];
    if (lunarTiming.isVoidOfCourse) lunarSignals.push('moon void-of-course caution');
    lunarSignals.push(`lunar phase ${lunarTiming.phase.toLowerCase()}`);
    lunarSignals.push(`progressed Moon in ${progressedMoon.sign}`);

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
        resonanceMultiplier: 1,
      },
      explanation: {
        aspectWeight: Number(aspectWeight.toFixed(2)),
        transitPlanetWeight: Number(transitingWeight.toFixed(2)),
        natalPointWeight: Number(natalWeight.toFixed(2)),
        orbFactor: Number(orbFactor.toFixed(2)),
        lifeStageBoost: Number(lifeStageBoost.toFixed(2)),
        mbtiModifier: Number(mbtiModifier.toFixed(2)),
        contextMultiplier: Number(contextMultiplier.toFixed(2)),
        progressedMoonBoost: Number(progressedMoonBoost.toFixed(2)),
        lunarTimingModifier: Number(lunarTimingModifier.toFixed(2)),
        learnedAdjustment,
        contextSignals: contextModifiers.signals,
        lunarSignals,
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

  const rankedEvents = events.sort((a, b) => b.scores.intensity - a.scores.intensity);

  return {
    generatedAt: now.toISOString(),
    windowDays,
    lifeStages,
    lunarTiming,
    progressedMoon,
    events: rankedEvents,
  };
}
