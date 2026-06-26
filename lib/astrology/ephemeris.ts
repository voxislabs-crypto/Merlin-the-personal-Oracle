import "server-only";
import { calculateBirthChart } from '../engine';
import { calculateBirthChart as calculateBirthChartFallback } from '../engine-fallback';
import { BirthChartData, PlanetPosition } from '../../types/astrology';

export interface DailyForecast {
  date: string;
  summary: string;
  planetaryHighlights: string[];
  moonPhase: string;
  moonSign?: string;
  sunSign?: string;
  transits: string[];
  advice: string;
  summary_raw?: string;
  summary_mbti_adjusted?: string;
  day_rating?:
    | 'Very Positive'
    | 'Positive'
    | 'Neutral'
    | 'Challenging'
    | 'Very Challenging'
    | 'green'
    | 'yellow'
    | 'red';
  focusAreas?: {
    love: string;
    career: string;
    mind: string;
    mood: string;
  };
  mbti_overlay?: {
    type: string;
    confidence: number;
    breakdown: any;
    reasoning: string;
    cosmicTendencies: string[];
  };
  timingWindows?: {
    next24Hours: string;
    next72Hours: string;
    weekAhead: string;
  };
  futureSignals?: Array<{
    domain: 'Love' | 'Career' | 'Mind' | 'Mood';
    signal: string;
    probability: number;
    timeframe: '24h' | '72h' | '7d';
    action: string;
    intensity: 'low' | 'medium' | 'high';
  }>;
  conversationalPrompts?: string[];
}

// ─── Aspect definitions ──────────────────────────────────────────────────────
const ASPECTS = [
  { name: 'Conjunction', angle: 0,   orb: 8,  nature: 'intensifying' as const },
  { name: 'Sextile',     angle: 60,  orb: 5,  nature: 'positive'    as const },
  { name: 'Square',      angle: 90,  orb: 7,  nature: 'challenging' as const },
  { name: 'Trine',       angle: 120, orb: 7,  nature: 'positive'    as const },
  { name: 'Opposition',  angle: 180, orb: 8,  nature: 'challenging' as const },
];

type AspectNature = 'positive' | 'challenging' | 'intensifying';

interface ActiveTransit {
  transitPlanet: string;
  natalPlanet: string;
  aspect: string;
  orb: number;
  nature: AspectNature;
  transitSign: string;
}

function angleDiff(a: number, b: number): number {
  const d = Math.abs(((a - b) + 360) % 360);
  return d > 180 ? 360 - d : d;
}

function computeTransits(transitPlanets: PlanetPosition[], natalPlanets: PlanetPosition[]): ActiveTransit[] {
  const results: ActiveTransit[] = [];
  for (const tp of transitPlanets) {
    for (const np of natalPlanets) {
      for (const asp of ASPECTS) {
        const diff = angleDiff(tp.longitude, np.longitude);
        const orb = Math.abs(diff - asp.angle);
        if (orb <= asp.orb) {
          results.push({
            transitPlanet: tp.name,
            natalPlanet: np.name,
            aspect: asp.name,
            orb: Math.round(orb * 10) / 10,
            nature: asp.nature,
            transitSign: tp.sign,
          });
        }
      }
    }
  }
  // Sort by tightness
  return results.sort((a, b) => a.orb - b.orb);
}

// ─── Planet → life area mapping ──────────────────────────────────────────────
const PLANET_AREAS: Record<string, string[]> = {
  Venus:   ['love'],
  Moon:    ['mood'],
  Mercury: ['mind'],
  Mars:    ['career'],
  Saturn:  ['career'],
  Jupiter: ['love', 'career'],
  Sun:     ['mood'],
  Pluto:   ['mood'],
  Neptune: ['mood', 'love'],
  Uranus:  ['mind', 'career'],
};

const ASPECT_LOVE_TEMPLATES: Record<string, string[]> = {
  positive:     [
    'Romantic energy flows easily. Connections feel warm and natural—reach out to someone who matters.',
    'Venus blesses the heart today. A kind word or gesture could deepen a bond.',
    'Love and beauty are accented. Appreciate what you have; share your warmth.',
  ],
  challenging:  [
    'Relationship friction may surface. Breathe before reacting—this is a growth moment.',
    'Old patterns in love are up for review. Be honest but gentle with yourself and others.',
    'A tension in your close connections may reveal something worth addressing.',
  ],
  intensifying: [
    'Love feels heightened and magnetic. Desire and closeness are amplified—use wisely.',
    'Emotional bonds intensify today. Intimacy is deepened; so are expectations.',
    'What you feel, you feel deeply. Let that intensity clarify what truly matters to you.',
  ],
  neutral:      [
    'Steady day for relationships. Routine affection and quiet connection carry their own magic.',
  ],
};

const ASPECT_CAREER_TEMPLATES: Record<string, string[]> = {
  positive:     [
    'Professional momentum is yours. Tackle ambitious tasks—your efforts land well.',
    'Discipline and drive align. Push forward on projects that demand focus.',
    'Work energy is productive. A strategic move made today could pay dividends.',
  ],
  challenging:  [
    'Friction at work or with ambitions may arise. Adapt rather than force.',
    'Authority figures or structured responsibilities may feel constraining—patience is your power.',
    'Career challenges today are teachers. Identify the lesson before reacting.',
  ],
  intensifying: [
    'Career drive is potent. Channel determination carefully—avoid burning yourself or bridges.',
    'Ambitious energy surges. What you start today can transform your professional path.',
  ],
  neutral:      [
    'Steady work energy. A reliable, focused day for maintaining momentum.',
  ],
};

const ASPECT_MIND_TEMPLATES: Record<string, string[]> = {
  positive:     [
    'Your mind is sharp and communicative. Write, speak, learn—ideas flow freely.',
    'Mental clarity is a gift today. Important conversations can go well.',
    'Curiosity leads somewhere useful. Follow an intellectual thread.',
  ],
  challenging:  [
    'Mental stress or miscommunication is possible. Slow down; confirm before assuming.',
    'Your mind may race or split in too many directions. Choose one thing.',
    'Words carry weight today—choose them thoughtfully.',
  ],
  intensifying: [
    'Deep thinking and penetrating insight are available. Trust what you perceive.',
    'The mind probes beneath the surface. Research, investigate, or journal.',
  ],
  neutral:      [
    'A steady mental day. Good for routine communication and quiet study.',
  ],
};

const ASPECT_MOOD_TEMPLATES: Record<string, string[]> = {
  positive:     [
    'Emotional well-being is supported. You feel grounded and at peace with yourself.',
    'Inner harmony radiates outward. Your authentic self is visible and magnetic.',
    'A sense of wholeness accompanies you today. Savour it.',
  ],
  challenging:  [
    'Emotional undercurrents may stir up feelings. Honour them without being swept away.',
    'Your inner world is processing something important. Give it space.',
    'Sensitivity is elevated. Rest, recharge, and trust the process.',
  ],
  intensifying: [
    'Feelings run deep today. Transformative emotional experiences are possible.',
    'Soul-level themes are active. What moves you holds important information.',
  ],
  neutral:      [
    'A balanced, even-keeled emotional tone. Use this stability to attend to what needs care.',
  ],
};

function hashText(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function deterministicPick(templates: Record<string, string[]>, nature: AspectNature | 'neutral', seed: string): string {
  const pool = templates[nature] || templates['neutral'];
  if (pool.length === 0) {
    return '';
  }
  return pool[hashText(seed) % pool.length];
}

// ─── Day rating ───────────────────────────────────────────────────────────────
function computeDayRating(transits: ActiveTransit[]): DailyForecast['day_rating'] {
  if (transits.length === 0) return 'Neutral';
  let score = 0;
  for (const t of transits) {
    // Tighter orbs weight more
    const weight = t.orb < 2 ? 2 : 1;
    if (t.nature === 'positive')     score += weight;
    if (t.nature === 'challenging')  score -= weight;
    // Conjunctions: half-positive unless involving outer hard planets
    if (t.nature === 'intensifying') {
      const hardPlanets = ['Saturn', 'Pluto', 'Mars'];
      score += hardPlanets.includes(t.transitPlanet) ? -0.5 : 0.5;
    }
  }
  const norm = score / transits.length;
  if (norm >= 1.2)  return 'Very Positive';
  if (norm >= 0.4)  return 'Positive';
  if (norm >= -0.4) return 'Neutral';
  if (norm >= -1.2) return 'Challenging';
  return 'Very Challenging';
}

// ─── Summary builder ─────────────────────────────────────────────────────────
export function getSummaryOpening(
  day_rating: DailyForecast['day_rating'],
  natalSunSign: string
): string {
  switch (day_rating) {
    case 'Very Positive':
      return `The stars are beautifully aligned for you today, ${natalSunSign}.`;
    case 'Positive':
      return `Today carries forward momentum for you, ${natalSunSign}.`;
    case 'green':
      return `Supportive sky signals outweigh the friction today, ${natalSunSign}.`;
    case 'Neutral':
      return `The cosmic weather is steady and balanced for you, ${natalSunSign}.`;
    case 'yellow':
      return `Mixed cosmic signals are in play today, ${natalSunSign}—pace yourself and stay flexible.`;
    case 'Challenging':
      return `The universe has a lesson waiting for you today, ${natalSunSign}.`;
    case 'red':
      return `Heavier transits are louder today, ${natalSunSign}—simplify your plate and protect your energy.`;
    case 'Very Challenging':
      return `Today's energies are intense, ${natalSunSign}—but remember, pressure creates diamonds.`;
    default:
      return `The cosmos speaks to you today, ${natalSunSign}.`;
  }
}

/** Replace the summary opening sentence when an enriched day_rating disagrees with ephemeris tone. */
export function realignSummaryToDayRating(
  summary: string,
  day_rating: DailyForecast['day_rating'],
  natalSunSign: string
): string {
  const opening = getSummaryOpening(day_rating, natalSunSign);
  const firstSentenceEnd = summary.search(/[.!?](?:\s|$)/);
  if (firstSentenceEnd === -1) {
    return opening;
  }
  const remainder = summary.slice(firstSentenceEnd + 1).trimStart();
  return remainder ? `${opening} ${remainder}` : opening;
}

function buildSummary(
  natalSunSign: string,
  transitMoon: PlanetPosition | undefined,
  active: ActiveTransit[],
  moonPhase: string,
  day_rating: DailyForecast['day_rating']
): string {
  const moonSign  = transitMoon?.sign || '';
  const topTransits = active.slice(0, 2); // Only use top 2 for cleaner narrative

  // Human-readable transit descriptors
  const transitDescriptors: Record<string, Record<string, string>> = {
    Sun: {
      positive: 'your vitality is amplified',
      challenging: 'your core intentions face tests',
      intensifying: 'your life force is activated'
    },
    Moon: {
      positive: 'your emotions flow easily',
      challenging: 'feelings need gentle attention',
      intensifying: 'your emotional world is heightened'
    },
    Mercury: {
      positive: 'communication feels clear and productive',
      challenging: 'messages may be misunderstood—slow down',
      intensifying: 'your mind sharpens and penetrates'
    },
    Venus: {
      positive: 'love and connection come naturally',
      challenging: 'relationships may need extra care',
      intensifying: 'desire and attraction intensify'
    },
    Mars: {
      positive: 'your drive and initiative are strong',
      challenging: 'frustration may arise—channel it wisely',
      intensifying: 'energy surges—direct it purposefully'
    },
    Jupiter: {
      positive: 'opportunities expand around you',
      challenging: 'excess or overconfidence needs watching',
      intensifying: 'growth accelerates dramatically'
    },
    Saturn: {
      positive: 'structure and discipline pay off',
      challenging: 'limitations teach important lessons',
      intensifying: 'reality demands your attention'
    },
    Uranus: {
      positive: 'breakthroughs and innovation arise',
      challenging: 'disruption forces adaptation',
      intensifying: 'sudden changes catalyze transformation'
    },
    Neptune: {
      positive: 'intuition and creativity flow',
      challenging: 'confusion clears if you stay grounded',
      intensifying: 'spiritual insights emerge'
    },
    Pluto: {
      positive: 'transformation unfolds naturally',
      challenging: 'power dynamics surface for healing',
      intensifying: 'deep change is inevitable'
    }
  };

  const opening = getSummaryOpening(day_rating, natalSunSign);

  // Build natural-sounding transit description
  let middle = '';
  if (topTransits.length > 0) {
    const descriptions = topTransits.map(t => {
      const natalPlanetDesc = transitDescriptors[t.natalPlanet];
      if (natalPlanetDesc) {
        return natalPlanetDesc[t.nature] || `your ${t.natalPlanet} is activated`;
      }
      return `your natal ${t.natalPlanet} is highlighted`;
    });
    
    if (descriptions.length === 1) {
      middle = ` ${descriptions[0].charAt(0).toUpperCase() + descriptions[0].slice(1)}.`;
    } else if (descriptions.length === 2) {
      middle = ` ${descriptions[0].charAt(0).toUpperCase() + descriptions[0].slice(1)}, and ${descriptions[1]}.`;
    }
  }

  // Moon phase wisdom
  const moonWisdom: Record<string, string> = {
    'New Moon': `With the ${moonPhase} in ${moonSign}, this is a time for new beginnings and setting intentions`,
    'Waxing Crescent': `The ${moonPhase} in ${moonSign} supports taking first steps toward your goals`,
    'First Quarter': `The ${moonPhase} in ${moonSign} calls for decisive action and commitment`,
    'Waxing Gibbous': `The ${moonPhase} in ${moonSign} asks you to refine and perfect your approach`,
    'Full Moon': `The ${moonPhase} in ${moonSign} illuminates what needs completion or release`,
    'Waning Gibbous': `The ${moonPhase} in ${moonSign} invites sharing wisdom and gratitude`,
    'Last Quarter': `The ${moonPhase} in ${moonSign} supports letting go of what no longer serves`,
    'Waning Crescent': `The ${moonPhase} in ${moonSign} whispers of rest and preparation for renewal`
  };

  const moonClause = moonWisdom[moonPhase] 
    ? ` ${moonWisdom[moonPhase]}.`
    : moonSign 
      ? ` The Moon in ${moonSign} colors your emotional landscape.`
      : ' Trust your intuition.';

  return opening + middle + moonClause;
}

export function getTodaysForecast(birthChart: BirthChartData, targetDate?: string): DailyForecast {
  const today = new Date();
  const localDateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const dateString = targetDate && /^\d{4}-\d{2}-\d{2}$/.test(targetDate) ? targetDate : localDateString;

  // ── Transiting chart at noon (with fallback) ──────────────────────────────
  let todaysChart: BirthChartData;
  let source: 'swiss-real' | 'mock-fallback' = 'swiss-real';
  
  try {
    console.log('[ephemeris] Calculating today\'s transiting chart with real sweph');
    todaysChart = calculateBirthChart(
      dateString,
      '12:00:00',
      birthChart.birthData.coordinates?.lat || 0,
      birthChart.birthData.coordinates?.lon || 0
    ) as BirthChartData;
  } catch (error) {
    console.warn('[ephemeris] Swiss failed, using fallback:', error);
    source = 'mock-fallback';
    todaysChart = calculateBirthChartFallback(
      dateString,
      '12:00:00',
      birthChart.birthData.coordinates?.lat || 0,
      birthChart.birthData.coordinates?.lon || 0
    ) as BirthChartData;
  }

  const natalPlanets   = birthChart.positions  || birthChart.planets || [];
  const transitPlanets = todaysChart.positions || todaysChart.planets || [];

  console.log(`[ephemeris] Calculated transit positions (source: ${source}):`);
  transitPlanets.forEach(p => {
    console.log(`  ${p.name}: ${p.longitude.toFixed(2)}° (${p.sign} ${p.degree}°${p.minute}')`);
  });

  // ── Real natal-to-transit aspect computation ──────────────────────────────
  const activeTransits = computeTransits(transitPlanets, natalPlanets);

  // ── Planetary highlights (tightest 5 aspects + degree-critical planets) ──
  const planetaryHighlights: string[] = [];
  activeTransits.slice(0, 5).forEach(t => {
    const orbStr = t.orb < 1 ? '(exact)' : `(${t.orb}° orb)`;
    const prefix = t.nature === 'positive' ? '✦' : t.nature === 'challenging' ? '⚡' : '◈';
    planetaryHighlights.push(
      `${prefix} ${t.transitPlanet} ${t.aspect} natal ${t.natalPlanet} in ${t.transitSign} ${orbStr}`
    );
  });
  // Add critical-degree planets (0°, 29°) not already listed
  transitPlanets.forEach(tp => {
    const deg = Math.floor(tp.longitude % 30);
    if ((deg === 0 || deg === 29) && planetaryHighlights.length < 7) {
      const label = deg === 0 ? '0° (new sign energy)' : '29° (critical degree)';
      if (!planetaryHighlights.some(h => h.includes(tp.name))) {
        planetaryHighlights.push(`◈ ${tp.name} at ${label} in ${tp.sign}`);
      }
    }
  });

  // ── Transit text list ─────────────────────────────────────────────────────
  const transitTexts = activeTransits.slice(0, 6).map(t =>
    `${t.transitPlanet} ${t.aspect} natal ${t.natalPlanet} (${t.transitSign}, orb ${t.orb}°)`
  );

  // ── Moon & Sun info ───────────────────────────────────────────────────────
  const moonPhase      = todaysChart.moonPhase?.type || 'Unknown';
  const transitMoon    = transitPlanets.find(p => p.name === 'Moon');
  const moonSign       = transitMoon?.sign;
  const natalSunSign   = natalPlanets.find(p => p.name === 'Sun')?.sign || 'Unknown';

  // ── Day rating ────────────────────────────────────────────────────────────
  const day_rating = computeDayRating(activeTransits);

  // ── Summary ───────────────────────────────────────────────────────────────
  const summary = buildSummary(natalSunSign, transitMoon, activeTransits, moonPhase, day_rating);

  // ── Focus areas ───────────────────────────────────────────────────────────
  const focusAreas = buildFocusAreas(activeTransits, day_rating, dateString);

  // ── Future-facing layers ──────────────────────────────────────────────────
  const timingWindows = buildTimingWindows(day_rating, moonPhase, activeTransits);
  const futureSignals = buildFutureSignals(activeTransits, day_rating);
  const conversationalPrompts = buildConversationPrompts(natalSunSign, futureSignals);

  // ── Advice ────────────────────────────────────────────────────────────────
  const advice = generateDailyAdvice(natalSunSign, moonPhase, day_rating);

  return {
    date:               dateString,
    summary,
    sunSign:            natalSunSign,
    moonSign,
    planetaryHighlights,
    moonPhase,
    transits:           transitTexts,
    advice,
    day_rating,
    focusAreas,
    timingWindows,
    futureSignals,
    conversationalPrompts,
  };
}

// ─── Focus area builder ───────────────────────────────────────────────────────
function buildFocusAreas(
  transits: ActiveTransit[],
  day_rating: DailyForecast['day_rating'],
  dateString: string
): DailyForecast['focusAreas'] {
  // Determine dominant nature per area from transits touching that area's planets
  function dominantNature(area: string): AspectNature | 'neutral' {
    const relevant = transits.filter(t =>
      (PLANET_AREAS[t.transitPlanet] || []).includes(area) ||
      (PLANET_AREAS[t.natalPlanet]   || []).includes(area)
    );
    if (relevant.length === 0) return 'neutral';
    let score = 0;
    for (const t of relevant) {
      if (t.nature === 'positive')     score += 1;
      if (t.nature === 'challenging')  score -= 1;
    }
    if (score > 0)  return 'positive';
    if (score < 0)  return 'challenging';
    return 'intensifying';
  }

  return {
    love: deterministicPick(ASPECT_LOVE_TEMPLATES, dominantNature('love'), `${dateString}-love-${day_rating || 'neutral'}`),
    career: deterministicPick(ASPECT_CAREER_TEMPLATES, dominantNature('career'), `${dateString}-career-${day_rating || 'neutral'}`),
    mind: deterministicPick(ASPECT_MIND_TEMPLATES, dominantNature('mind'), `${dateString}-mind-${day_rating || 'neutral'}`),
    mood: deterministicPick(ASPECT_MOOD_TEMPLATES, dominantNature('mood'), `${dateString}-mood-${day_rating || 'neutral'}`),
  };
}

function buildTimingWindows(
  day_rating: DailyForecast['day_rating'],
  moonPhase: string,
  transits: ActiveTransit[]
): DailyForecast['timingWindows'] {
  const exactCount = transits.filter(t => t.orb < 1).length;
  const positiveCount = transits.filter(t => t.nature === 'positive').length;
  const challengingCount = transits.filter(t => t.nature === 'challenging').length;

  const shortTermByRating: Record<string, string> = {
    'Very Positive': 'Momentum is strongest in the next 24 hours. Front-load important conversations and launches now.',
    'Positive': 'A supportive tide builds through the next day. Take one strategic action while clarity is high.',
    green: 'Momentum is strongest in the next 24 hours. Front-load important conversations and launches now.',
    'Neutral': 'The next 24 hours are steady. Use this as setup time before bigger movement later this week.',
    yellow: 'The next 24 hours are mixed. Stay flexible, avoid forcing big moves, and move one deliberate step at a time.',
    'Challenging': 'The next 24 hours are sensitive. Move slowly, simplify commitments, and avoid rushed decisions.',
    red: 'The next 24 hours call for recovery mode. Protect bandwidth and prioritize sleep, food, and boundaries.',
    'Very Challenging': 'The next 24 hours call for recovery mode. Protect bandwidth and prioritize sleep, food, and boundaries.',
  };

  const next72 = challengingCount > positiveCount
    ? 'The next 72 hours bring pressure-testing. Expect delays or emotional spikes; choose patience over force.'
    : 'The next 72 hours bring constructive openings. Follow through on practical plans and relationship repair.';

  const moonLayer = moonPhase === 'Full Moon'
    ? 'By week end, clarity arrives through completion and release.'
    : moonPhase === 'New Moon'
      ? 'By week end, seeds planted now begin showing early signs of traction.'
      : 'By week end, consistent small moves outperform dramatic leaps.';

  const precisionLine = exactCount > 0
    ? ` ${exactCount} exact transit${exactCount > 1 ? 's are' : ' is'} active, so timing choices matter more than usual.`
    : '';

  return {
    next24Hours: (shortTermByRating[day_rating || 'Neutral'] || shortTermByRating.Neutral) + precisionLine,
    next72Hours: next72,
    weekAhead: moonLayer,
  };
}

function buildFutureSignals(
  transits: ActiveTransit[],
  day_rating: DailyForecast['day_rating']
): DailyForecast['futureSignals'] {
  const top = transits.slice(0, 4);
  const fallbackSignals: DailyForecast['futureSignals'] = [
    {
      domain: 'Mind',
      signal: 'A quieter processing phase supports planning over reacting.',
      probability: 64,
      timeframe: '24h',
      action: 'Write down your top 3 priorities and defer lower-stakes choices.',
      intensity: 'low',
    },
    {
      domain: 'Mood',
      signal: 'Emotional weather is stable enough for reset and reflection.',
      probability: 61,
      timeframe: '72h',
      action: 'Protect one uninterrupted recovery block each day.',
      intensity: 'low',
    },
  ];

  if (top.length === 0) {
    return fallbackSignals;
  }

  const toDomain = (planet: string): 'Love' | 'Career' | 'Mind' | 'Mood' => {
    const area = PLANET_AREAS[planet]?.[0];
    if (area === 'love') return 'Love';
    if (area === 'career') return 'Career';
    if (area === 'mind') return 'Mind';
    return 'Mood';
  };

  const ratingBias =
    day_rating === 'Very Positive' ? 10
    : day_rating === 'Positive' ? 6
    : day_rating === 'Neutral' ? 0
    : day_rating === 'Challenging' ? -6
    : -10;

  return top.map((t, idx) => {
    const domain = toDomain(t.natalPlanet);
    const base = t.nature === 'positive' ? 72 : t.nature === 'challenging' ? 68 : 63;
    const precisionBonus = Math.max(0, 8 - Math.floor(t.orb));
    const probability = Math.max(55, Math.min(92, base + precisionBonus + ratingBias));
    const timeframe: '24h' | '72h' | '7d' = idx === 0 ? '24h' : idx < 3 ? '72h' : '7d';
    const intensity: 'low' | 'medium' | 'high' = t.orb < 1.5 ? 'high' : t.orb < 3 ? 'medium' : 'low';

    return {
      domain,
      signal: `${t.transitPlanet} ${t.aspect} natal ${t.natalPlanet} suggests ${domain.toLowerCase()} dynamics are shifting.`,
      probability,
      timeframe,
      action: t.nature === 'challenging'
        ? 'Reduce reactivity: pause, verify facts, and take one grounded next step.'
        : 'Use the opening: make one concrete move while timing is supportive.',
      intensity,
    };
  });
}

function buildConversationPrompts(
  sunSign: string,
  futureSignals: DailyForecast['futureSignals']
): string[] {
  const topSignal = futureSignals?.[0];
  const domain = topSignal?.domain?.toLowerCase() || 'energy';
  return [
    `Ask Merlin: "What should I prioritize in ${domain} over the next 72 hours?"`,
    `Ask Merlin: "If I avoid one mistake this week as a ${sunSign}, what should it be?"`,
    'Ask Merlin: "Give me a 3-step action plan for today, tomorrow, and this weekend."',
  ];
}

function generateDailyAdvice(
  sunSign: string,
  moonPhase: string,
  day_rating: DailyForecast['day_rating']
): string {
  const ratingAdvice: Record<string, string> = {
    'Very Positive':    'Act boldly—cosmic winds are behind you. Initiate, reach out, and create.',
    'Positive':         'Lean into the constructive energy. Make one meaningful move forward.',
    'Neutral':          'Observe before acting. Quiet days often carry the seeds of big growth.',
    'Challenging':      'Pace yourself. Rest, reassess, and respond rather than react.',
    'Very Challenging': 'Simplify your agenda. Be extra gentle with yourself and others.',
  };

  const phaseAdvice: Record<string, string> = {
    'New Moon':         'Set a clear intention for the month ahead.',
    'Waxing Crescent':  'Take the first step on something that matters.',
    'First Quarter':    'Commit to a decision and take decisive action.',
    'Waxing Gibbous':   'Refine your approach—you\'re close to a breakthrough.',
    'Full Moon':        'Release what no longer serves you; celebrate what you\'ve built.',
    'Waning Gibbous':   'Share your wisdom; teach or give back today.',
    'Last Quarter':     'Clear old obligations and create space for what\'s next.',
    'Waning Crescent':  'Rest, restore, and surrender to the quiet before the new cycle.',
  };

  const rLine = ratingAdvice[day_rating || 'Neutral'] || 'Trust the moment.';
  const pLine = phaseAdvice[moonPhase] || 'Stay present.';

  return `As a ${sunSign}, the cosmic prescription for today: ${rLine} ${pLine}`;
}