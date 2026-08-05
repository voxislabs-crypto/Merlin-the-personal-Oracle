import 'server-only';

/**
 * Mode detection for adaptive Oracle responses.
 * Prefer full oracle (with app sight) for life/timing/self questions.
 * True "casual" is only small talk with no chart stakes.
 */

export function detectQueryMode(question: string): 'astro' | 'casual' {
  const query = question.toLowerCase().trim();

  // Explicit life-weather / impact language → full oracle
  const lifeWeatherKeywords = [
    'transit', 'chart', 'planet', 'venus', 'saturn', 'mercury', 'mars', 'sun', 'moon',
    'aspect', 'conjunction', 'square', 'trine', 'opposition', 'sextile',
    'house', 'ascendant', 'midheaven', 'horoscope', 'zodiac', 'retrograde',
    'natal', 'birth chart', 'eclipse', 'storm', 'friction', 'bullshit',
    'pressure', 'forecast', 'weather', 'risk', 'confidence', 'timing',
    'this week', 'today', 'tomorrow', 'next week', 'when should',
    'should i', 'career', 'money', 'relationship', 'partner', 'health',
    'energy', 'sleep', 'what do you see', 'my chart', 'life weather',
    'playbook', 'hard time', 'tough week', 'good day', 'bad day',
  ];

  if (lifeWeatherKeywords.some((keyword) => query.includes(keyword))) {
    return 'astro';
  }

  // Pure small talk only
  const pureCasual = [
    /^(hi|hello|hey|yo|sup)\b/i,
    /^(thanks|thank you|thx)\b/i,
    /^(ok|okay|cool|got it|nice)\b/i,
    /how are you/i,
    /who are you/i,
    /what('s| is) your name/i,
  ];

  if (pureCasual.some((pattern) => pattern.test(query))) {
    return 'casual';
  }

  // Default: full oracle so Merlin can use chart + weather when available
  return 'astro';
}

/**
 * Lightweight casual line when there is truly no chart context and no need for LLM depth.
 * Prefer full oracle path whenever app data is present.
 */
export async function generateCasualResponse(
  question: string,
  userId: string,
  context?: {
    birthChart?: any;
    transits?: any;
    stormsReport?: any;
    atmospherePacket?: any;
  }
): Promise<string> {
  void userId;
  void context;

  const q = question.toLowerCase();
  if (/who are you|what('s| is) your name/.test(q)) {
    return "I'm Merlin — the intelligence in this app. I read your chart and life weather when they're loaded, and I'll answer you directly. What do you want to look at?";
  }
  if (/^(hi|hello|hey|yo)\b/.test(q)) {
    return "Hello. I'm here. Ask me about your timing, a decision, or what your chart is doing — I'll use what the app can see.";
  }
  if (/thanks|thank you/.test(q)) {
    return "You're welcome. When you're ready for the next layer, ask.";
  }
  if (/how are you/.test(q)) {
    return "Steady. More useful question: what pressure or decision are you sitting with?";
  }

  return "I'm listening. Give me a real question — timing, a relationship, work, money, or how you're feeling under this sky — and I'll answer with what I can actually see.";
}

/**
 * Format percentages for optional structured output
 */
export function formatLikelihoodScore(percentage: number): string {
  if (percentage >= 80) return 'very high likelihood';
  if (percentage >= 65) return 'high likelihood';
  if (percentage >= 50) return 'moderate likelihood';
  if (percentage >= 35) return 'possible';
  if (percentage >= 20) return 'possible but unlikely';
  return 'rare';
}

export function conditionalPercentage(
  percentage: number,
  includeLikelihood: boolean = true
): string {
  if (!includeLikelihood) return '';
  return `${percentage}% (${formatLikelihoodScore(percentage)})`;
}

/**
 * Emotionally raw questions still get full oracle when chart is present;
 * this flag only softens structure in the client/UI if needed.
 */
export function shouldSkipStructure(question: string): boolean {
  const emotionalKeywords = [
    'scared', 'afraid', 'anxious', 'alone', 'crazy', 'broken', 'lost', 'confused',
    'panic', 'hopeless', 'worthless',
  ];
  return emotionalKeywords.some((kw) => question.toLowerCase().includes(kw));
}
