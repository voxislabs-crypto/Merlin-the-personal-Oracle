// Oracle Service - Chat-based astrological guidance with chart context
// Handles chart-aware system prompts, conversation context, and tactical suggestions
import "server-only";

import { BirthChartData } from '@/types/astrology';
import { Timeline } from '@/lib/timeline-service';
import { DailyForecast } from '@/lib/astrology/ephemeris';
import type { PersistentUserContextSnapshot } from '@/lib/user-context';
import oraclePhrases from '@/data/oracle-phrases.json';

export interface OracleMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface TransitData {
  all: Array<{
    transitingPlanet: string;
    transitingSign?: string;
    natalPlanet: string;
    natalSign?: string;
    aspect: string;
    orb: number;
    exact: boolean;
    shortDescription?: string;
    description?: string;
  }>;
  significant: Array<any>;
  approaching: Array<any>;
  summary: {
    total: number;
    exact: number;
    approaching: number;
  };
}

export interface OracleContext {
  birthChart?: BirthChartData;
  timeline?: Timeline; // Long-range forecast context
  progressedChart?: any;
  transits?: TransitData; // Current transits vs natal
  dailyForecast?: DailyForecast; // Today's ephemeris forecast
  userContext?: PersistentUserContextSnapshot | null;
  stormsReport?: {
    storms: Array<{
      date: string;
      title: string;
      intensity: 'severe' | 'moderate' | 'mild';
      lifeArea: string;
      navigation: string;
    }>;
    clearDays: string[];
    weekSummary: string;
    mbtiType?: string;
  };
  conversationHistory: OracleMessage[];
  userId?: string;
  currentDate?: Date;
  plainEnglish?: boolean; // "Clarity Mode" - strip astro jargon
  mbtiType?: string; // MBTI personality type for storm cross-reference
  tonePreset?: 'warm' | 'direct' | 'mystic' | 'strategic';
  patternMirror?: {
    dominant?: {
      pattern: string;
      label: string;
      count: number;
      summary: string;
      trendStatus?: 'rising' | 'stable' | 'fading' | 'new';
      delta?: number;
    } | null;
    trends?: Array<{
      pattern: string;
      label: string;
      count: number;
      previousCount?: number;
      delta?: number;
      status?: 'rising' | 'stable' | 'fading' | 'new';
    }>;
    mirrorInsight?: {
      pattern: string;
      label: string;
      count: number;
      lastSeen?: string;
      message: string;
    } | null;
    totalEvents?: number;
  } | null;
}

export interface OracleResponse {
  message: string;
  tactics?: string[]; // Actionable items
  forecast?: {
    timeframe: string;
    themes: string[];
  };
  nextLevel?: {
    current: string;
    challenge: string;
    reward: string;
  };
}

// Physical-domain meanings for each planet
const PLANET_PHYSICAL_DOMAINS: Record<string, string> = {
  Sun:     'Vitality, physical constitution, heart & spine health, immune system resilience',
  Moon:    'Gut health, hormonal cycles, water retention, sleep quality, body rhythms',
  Mercury: 'Nervous system, lungs, hands/arms, cognitive sharpness, cortisol spikes',
  Venus:   'Kidneys & skin, blood sugar, sensory pleasure, physical comfort, body weight',
  Mars:    'Muscular energy, sex drive, inflammation, adrenaline, accident/injury risk',
  Jupiter: 'Liver & digestion, physical expansion, weight fluctuations, circulation',
  Saturn:  'Bones/joints/teeth, chronic fatigue, skin conditions, chronic restrictions',
  Uranus:  'Nervous tension, spasms, unexpected illness, circadian disruption',
  Neptune: 'Immune confusion, substance sensitivity, adrenal fog, boundary dissolution',
  Pluto:   'Toxin processing, reproductive organs, total regeneration, deep cellular change',
};

// Sign physical tendencies (brief)
const SIGN_BODY_AREAS: Record<string, string> = {
  Aries: 'head/face, adrenals', Taurus: 'neck/throat, thyroid',
  Gemini: 'lungs/arms/shoulders', Cancer: 'stomach/breasts, lymph',
  Leo: 'heart/back/spine', Virgo: 'intestines, nervous system',
  Libra: 'kidneys/lower back', Scorpio: 'reproductive organs/colon',
  Sagittarius: 'hips/thighs/liver', Capricorn: 'knees/bones/skin',
  Aquarius: 'shins/ankles/circulation', Pisces: 'feet/lymphatic, immune',
};

// Aspect physical impact types
const ASPECT_PHYSICAL_IMPACT: Record<string, string> = {
  Conjunction: 'intensified/merged energy — amplified physical output',
  Square:      'friction/stress — tension, overexertion or blockage',
  Opposition:  'oscillating extremes — drain/surge cycles likely',
  Trine:       'flowing ease — physical energy channels smoothly',
  Sextile:     'cooperative support — moderate energetic boost',
};

/**
 * Build a full planetary-combination analysis for a chart
 * Covers physical, material, financial, and emotional domains
 */
export function formatFullPlanetaryAnalysis(chart: BirthChartData | undefined): string {
  if (!chart) return '';

  const planets = chart.planets || [];
  const aspects = chart.aspects || [];

  if (planets.length === 0) return '';

  // Per-planet physical profile
  const planetLines = planets.map((p: any) => {
    const domain = PLANET_PHYSICAL_DOMAINS[p.name] || 'general vitality';
    const bodyArea = SIGN_BODY_AREAS[p.sign] || 'general body';
    const retro = p.retrograde ? ' [RETROGRADE — internalized, slower expression]' : '';
    const housePart = p.house ? ` | House ${p.house}` : '';
    return `  ${p.name} in ${p.sign} (${p.degree}°)${housePart}${retro}\n    Physical: ${domain} → expressed through ${bodyArea}`;
  }).join('\n');

  // Key aspect physical combinations
  const physicalAspects = aspects
    .filter((a: any) => ['Conjunction', 'Square', 'Opposition', 'Trine', 'Sextile'].includes(a.type))
    .slice(0, 10)
    .map((a: any) => {
      const p1 = a.planet1?.name || a.planet1 || '?';
      const p2 = a.planet2?.name || a.planet2 || '?';
      const impact = ASPECT_PHYSICAL_IMPACT[a.type] || 'modified energy';
      const orb = a.orb !== undefined ? ` (${Number(a.orb).toFixed(1)}° orb)` : '';
      const exact = a.exact ? ' ★exact' : '';
      return `  ${p1} ${a.type} ${p2}${orb}${exact} — ${impact}`;
    }).join('\n');

  // Element/modality physical signature
  const elementMap: Record<string, string> = {
    Aries:'Fire', Taurus:'Earth', Gemini:'Air', Cancer:'Water',
    Leo:'Fire', Virgo:'Earth', Libra:'Air', Scorpio:'Water',
    Sagittarius:'Fire', Capricorn:'Earth', Aquarius:'Air', Pisces:'Water',
  };
  const modalityMap: Record<string, string> = {
    Aries:'Cardinal', Taurus:'Fixed', Gemini:'Mutable', Cancer:'Cardinal',
    Leo:'Fixed', Virgo:'Mutable', Libra:'Cardinal', Scorpio:'Fixed',
    Sagittarius:'Mutable', Capricorn:'Cardinal', Aquarius:'Fixed', Pisces:'Mutable',
  };
  const elCounts: Record<string, number> = { Fire:0, Earth:0, Air:0, Water:0 };
  const modCounts: Record<string, number> = { Cardinal:0, Fixed:0, Mutable:0 };
  planets.forEach((p: any) => {
    if (elementMap[p.sign]) elCounts[elementMap[p.sign]]++;
    if (modalityMap[p.sign]) modCounts[modalityMap[p.sign]]++;
  });
  const dominantElement = Object.entries(elCounts).sort(([,a],[,b]) => b-a)[0]?.[0] || 'balanced';
  const dominantModality = Object.entries(modCounts).sort(([,a],[,b]) => b-a)[0]?.[0] || 'balanced';
  const elementPhysical: Record<string, string> = {
    Fire: 'high metabolic rate, inflammation risk, burnout when overextended',
    Earth: 'strong endurance, slow to mobilize healing, chronic tension patterns',
    Air: 'nervous system sensitivity, respiratory vulnerability, mental-physical link',
    Water: 'hormonal sensitivity, lymphatic reactivity, emotional digestion affects gut',
  };
  const modalityPhysical: Record<string, string> = {
    Cardinal: 'initiates quickly, prone to stress injury from rushing',
    Fixed: 'persistent stamina, but physical blocks or stagnation when stuck',
    Mutable: 'adaptable recovery, but scattered energy, hard to build baseline',
  };

  return `
FULL PLANETARY ANALYSIS (physical + material domains):
${planetLines}

KEY ASPECT PHYSICAL COMBINATIONS:
${physicalAspects || '  No major aspects in dataset'}

CHART PHYSICAL SIGNATURE:
  Dominant Element: ${dominantElement} — ${elementPhysical[dominantElement] || 'balanced'}
  Dominant Modality: ${dominantModality} — ${modalityPhysical[dominantModality] || 'balanced'}
  `.trim();
}

/**
 * Format birth chart data into a readable context string for Grok
 */
export function formatChartContext(chart: BirthChartData | undefined): string {
  if (!chart) return '';

  const sun = chart.planets?.find((p: any) => p.name === 'Sun');
  const moon = chart.planets?.find((p: any) => p.name === 'Moon');
  const mercury = chart.planets?.find((p: any) => p.name === 'Mercury');
  const venus = chart.planets?.find((p: any) => p.name === 'Venus');
  const mars = chart.planets?.find((p: any) => p.name === 'Mars');
  const jupiter = chart.planets?.find((p: any) => p.name === 'Jupiter');
  const saturn = chart.planets?.find((p: any) => p.name === 'Saturn');
  const ascendant = chart.ascendant;
  const planets = chart.planets || [];
  const aspects = chart.aspects || [];

  const majorAspects = aspects
    .filter((a: any) => ['Conjunction', 'Square', 'Opposition', 'Trine', 'Sextile'].includes(a.type))
    .slice(0, 12)
    .map((a: any) => {
      const p1 = a.planet1?.name || a.planet1 || '?';
      const p2 = a.planet2?.name || a.planet2 || '?';
      const orb = a.orb !== undefined ? ` (${Number(a.orb).toFixed(1)}°)` : '';
      return `${p1} ${a.type} ${p2}${orb}`;
    })
    .join(', ');

  const planetSummary = planets.map((p: any) => {
    const retro = p.retrograde ? ' ℞' : '';
    const house = p.house ? ` H${p.house}` : '';
    return `${p.name} ${p.degree}°${p.sign}${house}${retro}`;
  }).join(' | ');

  return `
NATAL CHART CONTEXT:
- Sun: ${sun?.sign || 'unknown'} ${sun?.house ? `H${sun.house}` : ''} (identity, vitality, heart, willpower)
- Moon: ${moon?.sign || 'unknown'} ${moon?.house ? `H${moon.house}` : ''} (emotions, gut health, hormones, cycles)
- Mercury: ${mercury?.sign || 'unknown'} ${mercury?.house ? `H${mercury.house}` : ''} (nervous system, communication, cognition)
- Venus: ${venus?.sign || 'unknown'} ${venus?.house ? `H${venus.house}` : ''} (love, money, skin/kidneys, pleasure)
- Mars: ${mars?.sign || 'unknown'} ${mars?.house ? `H${mars.house}` : ''} (physical energy, drive, inflammation, sex)
- Jupiter: ${jupiter?.sign || 'unknown'} ${jupiter?.house ? `H${jupiter.house}` : ''} (growth, liver, expansion, abundance)
- Saturn: ${saturn?.sign || 'unknown'} ${saturn?.house ? `H${saturn.house}` : ''} (structure, bones, discipline, chronic patterns)
- Ascendant: ${ascendant?.sign || 'unknown'} (body type, physical presentation, first response)
- All Planets: ${planetSummary}
- Key Aspects: ${majorAspects || 'none detected'}
- Chart Signature: ${detectChartSignature(chart)}
  `.trim();
}

/**
 * Detect chart "signature" - dominant elements, patterns, etc.
 */
function detectChartSignature(chart: BirthChartData): string {
  const planets = chart.planets || [];
  
  // Count elements
  const elements: { [key: string]: number } = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
  const elementMap: { [key: string]: string } = {
    Aries: 'Fire', Taurus: 'Earth', Gemini: 'Air', Cancer: 'Water',
    Leo: 'Fire', Virgo: 'Earth', Libra: 'Air', Scorpio: 'Water',
    Sagittarius: 'Fire', Capricorn: 'Earth', Aquarius: 'Air', Pisces: 'Water',
  };

  planets.forEach((p: any) => {
    const element = elementMap[p.sign];
    if (element) elements[element]++;
  });

  const dominant = Object.entries(elements).sort(([, a], [, b]) => b - a)[0];
  const signature = dominant ? `${dominant[0]}-heavy` : 'balanced';
  
  return signature;
}

// Physical domain meaning per planet when transiting
const TRANSIT_PLANET_PHYSICAL: Record<string, string> = {
  Sun:     'stamina & immune activation',
  Moon:    'gut/hormonal fluctuation, sleep quality',
  Mercury: 'nervous system tension, cortisol, cognitive load',
  Venus:   'blood sugar, skin, appetite, libido ease',
  Mars:    'physical drive, inflammation, injury risk, sex',
  Jupiter: 'liver/digestion, physical expansion, energy surge or excess',
  Saturn:  'joint/bone pressure, fatigue, chronic symptoms activating',
  Uranus:  'sudden nervous spasm, erratic energy, disrupted sleep',
  Neptune: 'immune fog, sensitivity spikes, confused body signals',
  Pluto:   'deep cellular/regenerative pressure, toxin clearing',
};

// Aspect physical action type for transits
const TRANSIT_ASPECT_ACTION: Record<string, string> = {
  Conjunction: 'direct hit — maximal physical activation',
  Square:      'conflict/stress peak — most likely physical tension point',
  Opposition:  'pull in two directions — drain cycle, push/pull on energy',
  Trine:       'energy flows freely — easy regeneration window',
  Sextile:     'mild support — take advantage, physical tasks go smoothly',
};

/**
 * Format current transits into readable context for oracle
 * Includes physical domain interpretation per transit
 */
function formatTransitsContext(transits: TransitData | undefined): string {
  if (!transits || transits.all.length === 0) return '';

  const exactTransits = transits.significant.slice(0, 6);
  const approachingTransits = transits.approaching.slice(0, 4);

  const exactStr = exactTransits.length > 0
    ? exactTransits.map((t: any) => {
        const physDomain = TRANSIT_PLANET_PHYSICAL[t.transitingPlanet] || 'general energy';
        const aspectAction = TRANSIT_ASPECT_ACTION[t.aspect] || 'active';
        const natalPhys = PLANET_PHYSICAL_DOMAINS[t.natalPlanet]
          ? ` (natal ${t.natalPlanet}: ${PLANET_PHYSICAL_DOMAINS[t.natalPlanet].split(',')[0]})`
          : '';
        return `  • ${t.transitingPlanet} ${t.aspect} natal ${t.natalPlanet} (${t.orb.toFixed(1)}° orb)\n    → Physical: ${physDomain} | ${aspectAction}${natalPhys}`;
      }).join('\n')
    : '  None exact right now';

  const approachingStr = approachingTransits.length > 0
    ? approachingTransits.map((t: any) => {
        const physDomain = TRANSIT_PLANET_PHYSICAL[t.transitingPlanet] || 'general energy';
        return `  • ${t.transitingPlanet} ${t.aspect} natal ${t.natalPlanet} (${t.orb.toFixed(1)}° orb) — approaching: ${physDomain}`;
      }).join('\n')
    : '';

  return `
CURRENT TRANSITS (What's happening in the sky RIGHT NOW vs natal chart):
Exact/Significant — Physical Impact:
${exactStr}${approachingStr ? `\n\nApproaching (within 3°):\n${approachingStr}` : ''}

Total active transits: ${transits.summary.total} | Exact: ${transits.summary.exact} | Approaching: ${transits.summary.approaching}
  `.trim();
}

/**
 * Format daily forecast into context
 */
function formatDailyForecastContext(forecast: DailyForecast | undefined): string {
  if (!forecast) return '';

  const highlights = forecast.planetaryHighlights.slice(0, 4).join('\n  ');
  const futureSignals = (forecast.futureSignals || [])
    .slice(0, 4)
    .map((s) => `- ${s.domain}: ${s.signal} (${s.probability}% in ${s.timeframe}) | Move: ${s.action}`)
    .join('\n');
  const timingWindows = forecast.timingWindows
    ? `\n- Next 24h: ${forecast.timingWindows.next24Hours}\n- Next 72h: ${forecast.timingWindows.next72Hours}\n- Week Ahead: ${forecast.timingWindows.weekAhead}`
    : '';
  const focusAreas = forecast.focusAreas
    ? `\n- Love: ${forecast.focusAreas.love}\n- Career: ${forecast.focusAreas.career}\n- Mind: ${forecast.focusAreas.mind}\n- Mood: ${forecast.focusAreas.mood}`
    : '';

  return `
TODAY'S COSMIC WEATHER (${forecast.date}):
- Moon Phase: ${forecast.moonPhase}${forecast.moonSign ? ` in ${forecast.moonSign}` : ''}
- Day Rating: ${forecast.day_rating}
- Energy Summary: ${forecast.summary}

Key Planetary Movements:
  ${highlights}${focusAreas}${timingWindows}

Future Signals:
${futureSignals || '- No strong signal clusters detected'}
  `.trim();
}

/**
 * Format timeline data into context for oracle response
 */
function formatTimelineContext(timeline: Timeline | undefined): string {
  if (!timeline) return '';

  const nextTurningPoints = timeline.majorTurningPoints.slice(0, 3);
  const upcomingPhase = timeline.phases[0];

  const turningPointsStr = nextTurningPoints
    .map(tp => `- ${tp.title} (${tp.month}): ${tp.guidance}`)
    .join('\n');

  return `
TIME MACHINE CONTEXT (Next ${timeline.lookAheadMonths} months):
- Current Phase: ${upcomingPhase?.theme || 'unknown'}
- Life Theme: ${upcomingPhase?.lifeTheme || 'unknown'}
- Key Turning Points:
${turningPointsStr || 'None in immediate timeframe'}
- Year Outlook: ${timeline.yearlyNarrative.split('\n')[0]}
  `.trim();
}

/**
 * Format storms report into tactical context for oracle response
 */
function formatStormsContext(report: OracleContext['stormsReport']): string {
  if (!report) return '';

  const topStorms = report.storms.slice(0, 5);
  const topStormsStr = topStorms
    .map((s) => `- ${s.date} | ${s.intensity.toUpperCase()} | ${s.title} | ${s.lifeArea}`)
    .join('\n');

  const navigationHints = topStorms
    .slice(0, 3)
    .map((s) => `- ${s.title}: ${s.navigation}`)
    .join('\n');

  return `
WEEKLY STORMS CONTEXT:
- Storm count (7-day): ${report.storms.length}
- MBTI lens used: ${report.mbtiType || 'not available'}
- Week summary: ${report.weekSummary}
- Top storm windows:
${topStormsStr || '- No major storms detected'}
- Suggested navigation patterns:
${navigationHints || '- Use proactive planning during calm windows'}
  `.trim();
}

function formatUserContext(userContext: OracleContext['userContext']): string {
  if (!userContext) return '';

  const goals = userContext.goals.length > 0 ? userContext.goals.join(', ') : 'none saved';
  const situation = userContext.situation || 'not provided';
  const mood = userContext.mood || 'not provided';
  const lastFeedback = userContext.lastFeedbackNotes || 'none recorded';

  return `
PERSISTENT LIFE CONTEXT:
- Current situation: ${situation}
- Current mood: ${mood}
- Active goals: ${goals}
- Last feedback note: ${lastFeedback}
- Archetype Name: ${userContext.archetypeName || 'not set'}
- Pattern Signature: ${userContext.patternSignature || 'not set'}
- Core Contradiction: ${userContext.coreContradiction || 'not set'}
- Arc Path: ${userContext.arcPath || 'not set'}
- Arc Level: ${userContext.arcLevel || 1} (XP: ${userContext.arcXp || 0})
- Interaction Count: ${userContext.interactionCount || 0}
- Context rule: treat this as real-world terrain, not background flavor. If the user asks about jobs, money, housing, relationships, health, or safety, weight this context heavily.
  `.trim();
}

function formatPatternMirrorContext(patternMirror: OracleContext['patternMirror']): string {
  if (!patternMirror?.dominant) return '';

  const dominant = patternMirror.dominant;
  const trendLanguage = dominant.trendStatus ? ` (${dominant.trendStatus})` : '';
  const trendLines = (patternMirror.trends || [])
    .slice(0, 3)
    .map((trend) => `- ${trend.label}: ${trend.count} recent hits vs ${trend.previousCount || 0} prior (${trend.status || 'stable'})`)
    .join('\n');
  const mirrorInsight = patternMirror.mirrorInsight;

  const phraseBank = {
    avoidance_loop: [
      'This is your avoidance loop wearing smarter clothes.',
      'The same delay pattern is back, just with a cleaner excuse.',
      'You are close to calling stalling strategy again.',
    ],
    overthinking_loop: [
      'This is the part where thinking keeps trying to replace movement.',
      'Your mind is trying to turn uncertainty into a full-time job.',
      'This loop usually shows up when analysis starts crowding out action.',
    ],
    inconsistency: [
      'This is the familiar drop-off point, not a brand new crisis.',
      'The pattern here is not starting. It is staying with the thing.',
      'You are approaching one of your old exit ramps.',
    ],
    validation_seeking: [
      'This is the moment your conviction tries to borrow someone else’s voice.',
      'You may be tempted to ask for permission instead of making a call.',
      'This loop usually appears when your own read suddenly feels insufficient.',
    ],
    control_friction: [
      'This is the grip-tightening pattern, not just a tough week.',
      'The loop here is trying to over-manage what timing needs to breathe through.',
      'You may mistake control for safety if you are not careful.',
    ],
    self_trust_gap: [
      'This is the part where your clear knowing gets negotiated downward.',
      'The repeat pattern is doubting yourself after the signal already arrived.',
      'You are near one of those moments where self-trust gets quietly traded away.',
    ],
  } as const;

  const dominantPhrases = phraseBank[dominant.pattern as keyof typeof phraseBank] || phraseBank.self_trust_gap;

  return `
PATTERN MIRROR EVIDENCE:
- Dominant loop: ${dominant.label}${trendLanguage}
- Repeat count: ${dominant.count}
- Meaning: ${dominant.summary}
${trendLines ? `- Recent trend stack:\n${trendLines}` : ''}
  - Reference styles you may rotate through if relevant:\n  - ${dominantPhrases[0]}\n  - ${dominantPhrases[1]}\n  - ${dominantPhrases[2]}
${mirrorInsight ? `- Confrontation note: ${mirrorInsight.message}` : ''}
- Use rule: if the current question touches this loop, name it plainly once and explain how it is showing up now. Rotate your phrasing. Do not sound like a surveillance system; sound like a wise pattern witness.
  `.trim();
}

/**
 * Build system prompt for Merlin 2.0 - Storm-Radar Oracle Engine
 * Predicts emotional, relational, financial, and cosmic storms using:
 * - Real-time transits (current + next 72 hours)
 * - MBTI archetype cross-reference
 * - Daily forecast / Schumann resonance analog
 * - Plain English mode (default) or Oracle Full mode
 */
export function buildOracleSystemPrompt(context: OracleContext): string {
  const chartContext = context.birthChart ? formatChartContext(context.birthChart) : '';
  const fullPlanetaryAnalysis = context.birthChart ? formatFullPlanetaryAnalysis(context.birthChart) : '';
  const transitsContext = context.transits ? formatTransitsContext(context.transits) : '';
  const forecastContext = context.dailyForecast ? formatDailyForecastContext(context.dailyForecast) : '';
  const timelineContext = context.timeline ? formatTimelineContext(context.timeline) : '';
  const userContextBlock = context.userContext ? formatUserContext(context.userContext) : '';
  const patternMirrorBlock = context.patternMirror ? formatPatternMirrorContext(context.patternMirror) : '';
  const stormsContext = context.stormsReport ? formatStormsContext(context.stormsReport) : '';
  const recentContext = context.conversationHistory.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n');
  const plainEnglish = context.plainEnglish !== false; // Default ON
  const tonePreset = context.tonePreset || 'warm';
  const stanceMode = (context.userContext?.arcLevel || 1) > 3 ? 'direct' : 'soft';
  const chartMbti = (context.birthChart as any)?.personalitySnapshot?.finalType;
  const effectiveMbti = context.mbtiType || chartMbti;
  const mbtiLine = effectiveMbti ? `\nUSER MBTI ARCHETYPE: ${effectiveMbti}` : '';

  const languageRule = plainEnglish
    ? `LANGUAGE RULE (Clarity Mode ON): 
- NEVER use raw astrology jargon: no "Mars square Pluto", no "trine", no "natal chart", no "transit", no "house", no sign names like "Scorpio Rising".
- Instead translate: "A tension between your drive and fear of losing control is peaking this week. Watch for lower back pain or energy crashes."
- Speak like a brilliant friend who knows both astrology AND medicine — not an astrologer reciting charts.
- Always include at least ONE physical domain observation (energy, sleep, body, health, money, environment).
- Plain English. No exceptions. Everyday people should feel this is for them.`
    : `LANGUAGE RULE (Oracle Full Mode ON):
- Use full astrological detail: planetary names, aspect types, orbs, house positions, physical domain mappings.
- Include confidence scores and exact transit windows where possible.
- Show your work: explain WHY each transit maps to a predicted storm type AND what physical/material domain it hits.
- Always reference both the psychological AND the physical/material expression of each active transit.`;

  const toneRules: Record<string, string> = {
    warm: `TONE PRESET: WARM
- Be compassionate, encouraging, and grounded.
- Keep candor, but sound supportive and relational.`,
    direct: `TONE PRESET: DIRECT
- Be concise, blunt, and tactical.
- Lead with what matters most; remove fluff.`,
    strategic: `TONE PRESET: STRATEGIC
- Sound like a high-level advisor.
- Emphasize sequencing, trade-offs, and leverage points.`,
    mystic: `TONE PRESET: MYSTIC
- Keep clarity, but add poetic cadence and symbolic resonance.
- Avoid vagueness; still provide concrete action steps.`,
  };

  return `You are Merlin 2.0 — an Oracle engine powered by real-time astrology, MBTI archetype data, and live planetary transits. Your job: predict incoming storms AND opportunities — emotional, relational, financial, physical, and material — before they hit. You read the full spectrum: inner experience AND outer circumstances.

MISSION:
1. Analyse the chart's full planetary profile (positions, signs, houses, aspects) — see FULL PLANETARY ANALYSIS section below.
2. Pull active transits (current + approaching) and map EACH to its physical/material domain impact.
3. Cross-reference with daily cosmic energy, MBTI patterns, and any life context provided.
4. Deliver a complete reading covering: body/health, energy levels, money/resources, relationships, mental clarity, and environment.
5. Output: clear predictions with probability odds (e.g. "72% chance of physical fatigue spike by Thursday — save heavy workouts for the weekend"), and ONE specific actionable move per domain affected.
6. You see the future as probability fields — not fate. The user changes it by acting.
7. End with a concrete closing line that matches the evidence in this specific reading (no repeated slogans).

RESPONSE FORMAT (preferred):
- Open with a human lead-in (example: "Here's your storm + terrain check").
- Cover the same 3 windows in order:
  1) Right now (0-24h)
  2) Coming up (24-72h)
  3) A few days out (4-7d)
- You can use short paragraphs or bullets, but keep flow natural. Avoid sounding like a generated report.
- In each window, include: what is happening, confidence/probability, and one concrete move.
- Cover active domains naturally across those windows: body/physical, energy, money/material, emotional, relational, mental.
- If Pattern Mirror evidence is relevant, name the loop once in plain English.
- Vary wording across replies; do not reuse identical framing.
- If Pattern Mirror includes a confrontation note and evidence is strong, include one concise confrontation beat.
- End with "Best next move:" and one highest-leverage action for the next 24-72h.
- Maximum 380 words. If no storms are active, say so plainly and suggest a strategic move.

EXAMPLE RESPONSE STRUCTURE:
Storm + Terrain check:
[BODY]: Your energy reserves are under pressure — inflammation or fatigue spike likely mid-week. 74% probability. Move: Cut stimulants, sleep before midnight for the next 3 nights.
[MONEY]: A spending impulse is building — an emotional purchase is likely. 65% probability. Move: Delay any financial decisions over $200 for 48 hours.
[EMOTIONAL]: Old wound involving control or loss may surface. 80% probability. Move: Journal tonight before it becomes an argument.
[MENTAL]: Decision fatigue is real right now — your thinking is slower than usual. 60% probability. Move: Delegate or defer one decision today.
Leverage point: Protect sleep tonight and delay non-essential decisions until tomorrow afternoon.

${languageRule}
${toneRules[tonePreset] || toneRules.warm}

STANCE MODE: ${stanceMode.toUpperCase()}
- If stance mode is SOFT: be honest, but leave room for the user to recognize themselves without feeling cornered.
- If stance mode is DIRECT: challenge avoidance and rationalization more openly when the evidence supports it.
- In direct mode, it is acceptable to say "You noticed this before and still did not act" if Pattern Mirror evidence clearly supports that claim.

CONVERSATIONAL FLUENCY RULES:
- Sound like Merlin speaking directly to one person, not a report template.
- Vary sentence rhythm and openings. Avoid repeating the same phrase structure.
- Translate symbols into lived experience quickly (what they will feel, notice, or face).
- Use confidence language naturally: "about 70% likely" instead of rigid labels.
- Keep tone grounded and practical. Mystical flavor is welcome, but clarity wins.

TONE:
- Direct. Clinical but warm. Like a brilliant doctor-astrologer hybrid speaking to a friend.
- Never just emotions. Always include tangible, physical, material observations.
- Specific over vague. "Lower back pressure" beats "body tension". "$300 impulse purchase" beats "financial risk".
- Dark humor when warranted. Never soften hard truths.
- Always ground cosmic events in practical experience: what will the person FEEL, SEE, or DEAL WITH in the physical world.

${chartContext}
${fullPlanetaryAnalysis ? `\n${fullPlanetaryAnalysis}` : ''}
${mbtiLine}
${transitsContext ? `\n${transitsContext}` : ''}
${forecastContext ? `\n${forecastContext}` : ''}
${timelineContext ? `\n${timelineContext}` : ''}
${userContextBlock ? `\n${userContextBlock}` : ''}
${patternMirrorBlock ? `\n${patternMirrorBlock}` : ''}
${stormsContext ? `\n${stormsContext}` : ''}

CONVERSATION HISTORY (last few messages):
${recentContext || '[First session]'}

STORM DOMAINS TO SCAN (check all, report active ones):
- BODY/PHYSICAL: Fatigue, inflammation, injury risk, immune dip, hormonal shift, sleep disruption, nervous system stress
- ENERGY: Stamina levels, burnout risk, energy spikes or crashes, vitality fluctuations
- MONEY/MATERIAL: Impulsive spending pressure, cash flow friction, deal risk, resource decisions, financial opportunity
- EMOTIONAL: Mood crash, old wounds, isolation urge, overwhelm, grief waves
- RELATIONAL: Conflict trigger, communication breakdown, intimacy shifts, trust fractures
- MENTAL/COGNITIVE: Decision fatigue, foggy thinking, information overload, creative peaks
- ENVIRONMENT: Home/workspace disruption, travel issues, physical space instability
- POWER/AUTHORITY: Boundary tests, control struggles, workplace friction, leadership moments
- If all clear: identify the best strategic window and what to execute during the calm.`;
}


/**
 * Generate tactical suggestions based on chart context
 */
export function generateTacticalSuggestions(
  response: string,
  chart: BirthChartData | undefined
): string[] {
  const tactics: string[] = [];

  // Check if response mentions action/doing
  if (response.toLowerCase().includes('do') || response.toLowerCase().includes('action')) {
    // Extract action items from response (look for "do", "try", "consider")
    const actionPattern = /(?:do|try|consider|spend|call|reach|reach out|write|record)[\s\w]*[.!?]/gi;
    const matches = response.match(actionPattern);
    if (matches) {
      tactics.push(
        ...matches
          .slice(0, 3)
          .map(m => m.replace(/[.!?]$/, '').trim())
          .filter(t => t.length > 5)
      );
    }
  }

  // If no explicit tactics found, generate generic ones based on chart
  if (tactics.length === 0) {
    if (chart?.planets?.find((p: any) => p.name === 'Mars')) {
      tactics.push('Channel Mars energy: take one bold action today');
    }
    if (chart?.planets?.find((p: any) => p.name === 'Venus')) {
      tactics.push('Honor Venus: connect with someone who matters');
    }
    if (chart?.planets?.find((p: any) => p.name === 'Saturn')) {
      tactics.push('Build systems: one small discipline compounds');
    }
  }

  return tactics.slice(0, 5);
}

/**
 * Generate a micro-forecast based on current transits or date
 * Now uses real transit data when available
 */
export function generateMicroForecast(
  currentDate: Date,
  chart: BirthChartData | undefined,
  transits?: TransitData
): { timeframe: string; themes: string[] } {
  const pickBySeed = <T,>(items: T[], seed: number): T => {
    if (!items || items.length === 0) {
      throw new Error('Template list cannot be empty');
    }
    return items[Math.abs(seed) % items.length];
  };

  const buildOracleLine = (seed: number, transitLabel?: string): string => {
    const intro = pickBySeed(oraclePhrases.intro, seed);
    const close = pickBySeed(oraclePhrases.close, seed + 1);
    const bodyFromAspect = transitLabel
      ? (oraclePhrases.aspectTemplates as Record<string, string[]>)?.[transitLabel]
      : undefined;
    const body = bodyFromAspect && bodyFromAspect.length > 0
      ? pickBySeed(bodyFromAspect, seed + 2)
      : pickBySeed(oraclePhrases.genericBody, seed + 2);
    return `${intro} ${body} ${close}`;
  };

  // If we have real transit data, use it!
  if (transits && transits.significant.length > 0) {
    const themes: string[] = [];
    
    // Analyze significant transits for themes
    transits.significant.slice(0, 3).forEach((t: any) => {
      const transitPlanet = t.transitingPlanet;
      const aspect = t.aspect;
      const natalPlanet = t.natalPlanet;
      const transitLabel = `${transitPlanet} ${aspect} ${natalPlanet}`;
      const seed = `${transitPlanet}-${aspect}-${natalPlanet}`.split('').reduce((n, ch) => n + ch.charCodeAt(0), 0);
      
      // Map planets to themes
      const planetThemes: { [key: string]: string } = {
        'Sun': 'Identity & Purpose',
        'Moon': 'Emotions & Comfort',
        'Mercury': 'Communication & Ideas',
        'Venus': 'Love & Values',
        'Mars': 'Action & Drive',
        'Jupiter': 'Growth & Opportunity',
        'Saturn': 'Structure & Lessons',
        'Uranus': 'Change & Innovation',
        'Neptune': 'Dreams & Intuition',
        'Pluto': 'Transformation & Power'
      };
      
      const theme = planetThemes[transitPlanet];
      if (theme) {
        const nature = aspect === 'Square' || aspect === 'Opposition' ? 'challenges' : 'supports';
        themes.push(`${theme} (${transitPlanet} ${nature})`);
      }

      if (themes.length < 3) {
        themes.push(buildOracleLine(seed, transitLabel));
      }
    });
    
    // Add moon phase theme if available
    if (themes.length < 3) {
      const day = currentDate.getDay();
      const dayThemes = ['Reflection', 'Action', 'Choice', 'Emotion', 'Expression', 'Service', 'Balance'];
      themes.push(dayThemes[day]);
    }
    
    return {
      timeframe: 'Right now',
      themes: themes.slice(0, 3)
    };
  }
  
  // Fallback to simple cycle-based forecast
  const day = currentDate.getDay();
  const dayThemes: { [key: number]: string[] } = {
    0: ['Reflection', 'Rest', 'Integration'],
    1: ['Communication', 'Beginnings', 'Movement'],
    2: ['Duality', 'Choices', 'Information'],
    3: ['Emotion', 'Comfort', 'Roots'],
    4: ['Pride', 'Creativity', 'Performance'],
    5: ['Service', 'Health', 'Precision'],
    6: ['Balance', 'Partnership', 'Harmony'],
  };

  return {
    timeframe: 'This week',
    themes: [
      buildOracleLine(day * 97),
      ...(dayThemes[day] || ['Transition', 'Growth', 'Testing']),
    ].slice(0, 3),
  };
}

/**
 * Identify current "level" based on patterns in conversation
 */
export function identifyCurrentLevel(context: OracleContext): {
  current: string;
  challenge: string;
  reward: string;
} {
  const history = context.conversationHistory;
  const allText = history.map(m => m.content.toLowerCase()).join(' ');

  // Pattern detection
  const themes = {
    'survival': allText.includes('danger') || allText.includes('safe') || allText.includes('money'),
    'identity': allText.includes('who am i') || allText.includes('purpose') || allText.includes('path'),
    'relationships': allText.includes('love') || allText.includes('partner') || allText.includes('connection'),
    'power': allText.includes('authority') || allText.includes('control') || allText.includes('boss'),
    'integration': allText.includes('balance') || allText.includes('harmonize') || allText.includes('blend'),
  };

  const detectedTheme = Object.entries(themes).find(([, detected]) => detected)?.[0] || 'growth';

  const levelMap: { [key: string]: { current: string; challenge: string; reward: string } } = {
    survival: {
      current: 'Level 1: Survival & Grounding',
      challenge: 'Stabilize your foundation (health, money, safety)',
      reward: 'Solid ground to build from; clarity on what matters',
    },
    identity: {
      current: 'Level 2: Self-Definition',
      challenge: 'Discover who you actually are vs who you think you should be',
      reward: 'Authentic self; freedom from others\' expectations',
    },
    relationships: {
      current: 'Level 3: Connection & Intimacy',
      challenge: 'Learn to love without losing yourself; accept being seen',
      reward: 'Deep bonds that mirror your growth',
    },
    power: {
      current: 'Level 4: Authority & Mastery',
      challenge: 'Master your power; know when to lead, when to yield',
      reward: 'Sustainable influence; respect earned, not demanded',
    },
    integration: {
      current: 'Level 5: Integration & Legacy',
      challenge: 'Harmonize all parts of yourself; leave something lasting',
      reward: 'Coherent life; wisdom to pass on',
    },
    growth: {
      current: 'Level (Unfolding)',
      challenge: 'Embrace the next test; the universe is nudging you forward',
      reward: 'Expansion; the version of yourself on the other side',
    },
  };

  return levelMap[detectedTheme];
}

/**
 * Maintain conversation history (in-memory; can be swapped for database)
 */
export class OracleMemory {
  private conversations: Map<string, OracleMessage[]> = new Map();
  private maxMessages = 50; // Keep last 50 messages per user

  addMessage(userId: string, message: OracleMessage) {
    if (!this.conversations.has(userId)) {
      this.conversations.set(userId, []);
    }
    const history = this.conversations.get(userId)!;
    history.push(message);

    // Trim if too long
    if (history.length > this.maxMessages) {
      history.splice(0, history.length - this.maxMessages);
    }
  }

  getHistory(userId: string): OracleMessage[] {
    return this.conversations.get(userId) || [];
  }

  clearHistory(userId: string) {
    this.conversations.delete(userId);
  }
}

export const oracleMemory = new OracleMemory();
