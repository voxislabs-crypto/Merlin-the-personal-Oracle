// Oracle Service - Chat-based astrological guidance with chart context
// Handles chart-aware system prompts, conversation context, and tactical suggestions
import "server-only";

import { BirthChartData } from '@/types/astrology';
import { Timeline } from '@/lib/timeline-service';
import { DailyForecast } from '@/lib/astrology/ephemeris';

export interface OracleMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface TransitData {
  all: Array<{
    transitingPlanet: string;
    natalPlanet: string;
    aspect: string;
    orb: number;
    exact: boolean;
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
  conversationHistory: OracleMessage[];
  userId?: string;
  currentDate?: Date;
  plainEnglish?: boolean; // "Clarity Mode" - strip astro jargon
  mbtiType?: string; // MBTI personality type for storm cross-reference
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

/**
 * Format birth chart data into a readable context string for Grok
 */
export function formatChartContext(chart: BirthChartData | undefined): string {
  if (!chart) return '';

  const sun = chart.planets?.find((p: any) => p.name === 'Sun');
  const moon = chart.planets?.find((p: any) => p.name === 'Moon');
  const ascendant = chart.ascendant;
  const planets = chart.planets || [];
  const aspects = chart.aspects || [];

  const majorAspects = aspects
    .filter((a: any) => ['Conjunction', 'Square', 'Opposition', 'Trine', 'Sextile'].includes(a.type))
    .slice(0, 8) // Top 8 aspects
    .map((a: any) => `${a.planet1? a.planet1.name || a.planet1 : '?'} ${a.type} ${a.planet2 ? a.planet2.name || a.planet2 : '?'}`)
    .join(', ');

  return `
NATAL CHART CONTEXT:
- Sun: ${sun?.sign || 'unknown'} (core identity, will, purpose)
- Moon: ${moon?.sign || 'unknown'} (emotions, needs, inner world)  
- Ascendant: ${ascendant?.sign || 'unknown'} (how they appear, first impression)
- Key Aspects: ${majorAspects || 'none detected'}
- Total Planets: ${planets.length}
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

/**
 * Format current transits into readable context for oracle
 */
function formatTransitsContext(transits: TransitData | undefined): string {
  if (!transits || transits.all.length === 0) return '';

  const exactTransits = transits.significant.slice(0, 5);
  const approachingTransits = transits.approaching.slice(0, 3);

  const exactStr = exactTransits.length > 0
    ? exactTransits.map((t: any) => 
        `  • ${t.transitingPlanet} ${t.aspect} natal ${t.natalPlanet} (${t.orb.toFixed(1)}° orb)`
      ).join('\n')
    : '  None exact right now';

  const approachingStr = approachingTransits.length > 0
    ? approachingTransits.map((t: any) => 
        `  • ${t.transitingPlanet} ${t.aspect} natal ${t.natalPlanet} (${t.orb.toFixed(1)}° orb)`
      ).join('\n')
    : '';

  return `
CURRENT TRANSITS (What's happening in the sky RIGHT NOW):
Exact/Significant Aspects:
${exactStr}${approachingStr ? `\n\nApproaching (within 3°):\n${approachingStr}` : ''}

Total active transits: ${transits.summary.total}
  `.trim();
}

/**
 * Format daily forecast into context
 */
function formatDailyForecastContext(forecast: DailyForecast | undefined): string {
  if (!forecast) return '';

  const highlights = forecast.planetaryHighlights.slice(0, 4).join('\n  ');
  const focusAreas = forecast.focusAreas
    ? `\n- Love: ${forecast.focusAreas.love}\n- Career: ${forecast.focusAreas.career}\n- Mind: ${forecast.focusAreas.mind}\n- Mood: ${forecast.focusAreas.mood}`
    : '';

  return `
TODAY'S COSMIC WEATHER (${forecast.date}):
- Moon Phase: ${forecast.moonPhase}${forecast.moonSign ? ` in ${forecast.moonSign}` : ''}
- Day Rating: ${forecast.day_rating}
- Energy Summary: ${forecast.summary}

Key Planetary Movements:
  ${highlights}${focusAreas}
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
 * Build system prompt for Merlin 2.0 - Storm-Radar Oracle Engine
 * Predicts emotional, relational, financial, and cosmic storms using:
 * - Real-time transits (current + next 72 hours)
 * - MBTI archetype cross-reference
 * - Daily forecast / Schumann resonance analog
 * - Plain English mode (default) or Oracle Full mode
 */
export function buildOracleSystemPrompt(context: OracleContext): string {
  const chartContext = context.birthChart ? formatChartContext(context.birthChart) : '';
  const transitsContext = context.transits ? formatTransitsContext(context.transits) : '';
  const forecastContext = context.dailyForecast ? formatDailyForecastContext(context.dailyForecast) : '';
  const timelineContext = context.timeline ? formatTimelineContext(context.timeline) : '';
  const recentContext = context.conversationHistory.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n');
  const plainEnglish = context.plainEnglish !== false; // Default ON
  const mbtiLine = context.mbtiType ? `\nUSER MBTI ARCHETYPE: ${context.mbtiType}` : '';

  const languageRule = plainEnglish
    ? `LANGUAGE RULE (Clarity Mode ON): 
- NEVER use raw astrology jargon: no "Mars square Pluto", no "trine", no "natal chart", no "transit", no "house", no sign names like "Scorpio Rising".
- Instead translate: "A tension between your drive and fear of losing control is peaking this week."
- Speak like a brilliant friend who happens to know astrology - not an astrologer speaking to clients.
- Plain English. No exceptions. Everyday people should feel this is for them.`
    : `LANGUAGE RULE (Oracle Full Mode ON):
- Use full astrological detail: planetary names, aspect types, orbs, house positions.
- Include confidence scores and exact transit windows where possible.
- Show your work: explain WHY each transit maps to the predicted storm type.`;

  return `You are Merlin 2.0 — an Oracle engine powered by real-time astrology, user MBTI archetype, and live cosmic data. Your ONE job: predict storms—emotional, relational, financial, or cosmic—before they hit. No fluff. No poetry.

MISSION:
1. Pull transits (current + next 72 hours) from the user's context below.
2. Cross-reference with daily cosmic energy, MBTI archetype patterns, and any life context provided.
3. Output: clear warnings, probability odds (e.g. "78% chance of conflict with authority by Friday"), and ONE actionable move ("Don't send that email. Wait 48 hours.").
4. You see the future as probability fields—not fate. The user changes it by acting.
5. Remind them: "This shifts if you pivot."

RESPONSE FORMAT (non-negotiable):
- ALWAYS start your response with: "Storm check: "
- ALWAYS end your response with: "Odds: [X]%. Move: [one clear action]."
- Between those: 2-3 sentences of storm analysis, then the move. Under 250 words total.
- If no storms detected: "Storm check: Clear skies. No major disruptions in the next 24 hours." then end with: "Odds: 5% disruption. Move: Use this window to reset."

${languageRule}

TONE:
- Direct. Clinical. Like a radar operator calling weather - not a fortune teller.
- No "interesting energy", no "cosmic invitation", no poetic metaphors.
- Call it exactly: "Tension with a partner peaks today", "Financial decision pressure tomorrow", "Emotional spiral risk high".
- Dark humor when warranted. Never soften hard truths.
- One actionable move per response. Specific. Doable today.

${chartContext}
${mbtiLine}
${transitsContext ? `\n${transitsContext}` : ''}
${forecastContext ? `\n${forecastContext}` : ''}
${timelineContext ? `\n${timelineContext}` : ''}

CONVERSATION HISTORY (last few messages):
${recentContext || '[First session]'}

STORM ARCHETYPES TO WATCH FOR:
- Emotional storm: Mood crash, old wounds surfacing, isolation urge
- Relational storm: Conflict trigger, communication breakdown, trust fracture
- Financial storm: Impulsive spending pressure, deal risks, resource anxiety
- Decision storm: Pressure to commit before you're ready
- Power storm: Authority clash, boundary test, control struggle
- If none detected: note the clear window as a strategic advantage ("Use this calm to execute what you've been delaying.")`;
}


/**
 * Generate tactical suggestions based on chart context
 */
export function generateTacticalSuggestions(
  response: string,
  chart: BirthChartData | undefined,
  context: OracleContext
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
  // If we have real transit data, use it!
  if (transits && transits.significant.length > 0) {
    const themes: string[] = [];
    
    // Analyze significant transits for themes
    transits.significant.slice(0, 3).forEach((t: any) => {
      const transitPlanet = t.transitingPlanet;
      const aspect = t.aspect;
      
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
    themes: dayThemes[day] || ['Transition', 'Growth', 'Testing'],
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
