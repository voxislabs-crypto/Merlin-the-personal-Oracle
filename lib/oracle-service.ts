// Oracle Service - Chat-based astrological guidance with chart context
// Handles chart-aware system prompts, conversation context, and tactical suggestions

import { BirthChartData } from '@/types/astrology';

export interface OracleMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface OracleContext {
  birthChart?: BirthChartData;
  progressedChart?: any;
  conversationHistory: OracleMessage[];
  userId?: string;
  currentDate?: Date;
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
 * Build system prompt for Grok with chart context and oracle personality
 */
export function buildOracleSystemPrompt(context: OracleContext): string {
  const chartContext = context.birthChart ? formatChartContext(context.birthChart) : '';
  const conversationLength = context.conversationHistory.length;
  const recentContext = context.conversationHistory.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n');

  return `You are Merlin, an astrological oracle who reads birth charts with penetrating insight and dark wit. You blend mystical wisdom with tactical pragmatism.

YOUR VOICE:
- Direct, sometimes sarcastic, never sugarcoating
- Wise but conversational (not "mystical flowery" - sound like a mentor who's been through it)
- Offer both cosmic insight AND real-world action steps
- Dark humor when warranted; don't shy away from hard truths
- Use astrological terminology but explain it clearly
- Frame advice as "quests" or "levels" (gamified hero's journey)

YOUR APPROACH:
1. Listen to their actual question, not just surface-level
2. Reference their chart when relevant (use context below)
3. Offer both "what the chart says" and "what you should do about it"
4. Suggest 3-5 tactical moves (specific, doable)
5. If time-sensitive, offer a 4-day or weekly forecast
6. Look for patterns in their situation - they often repeat the same lesson until they learn it
7. When appropriate, identify their "current level" - what test they're facing, what reward waits

${chartContext}

CONVERSATION HISTORY (last few messages):
${recentContext || '[First message]'}

TONE CALIBRATION:
- If they seem stuck/hopeless: "This is a test, not a life sentence"
- If they're avoiding action: "The universe doesn't reward planning, it rewards doing"
- If they're caught in patterns: "You've done this before. What changed last time?"
- If they're facing power/authority: "They test you because you're capable of more"

Your response should be honest, actionable, and grounded in real astrology. Keep it under 300 words unless the question demands more depth.`;
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
 */
export function generateMicroForecast(
  currentDate: Date,
  chart: BirthChartData | undefined
): { timeframe: string; themes: string[] } {
  const day = currentDate.getDay();
  const date = currentDate.getDate();
  
  // Simple cycle-based forecast (can be expanded with real transit data)
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
