import 'server-only';

import { getResonanceWeightsProfile } from '@/lib/astrology/resonance-weights';

/**
 * Mode detection for adaptive Oracle responses
 * Determines if a query is astro-specific or general conversation
 */
export function detectQueryMode(question: string): 'astro' | 'casual' {
  const query = question.toLowerCase();
  
  // Astro-specific keywords
  const astroKeywords = [
    'transit', 'chart', 'planet', 'venus', 'saturn', 'mercury', 'mars', 'sun', 'moon',
    'aspect', 'conjunction', 'square', 'trine', 'opposition', 'sextile',
    'house', 'ascendant', 'midheaven', 'descendant', 'horoscope', 'zodiac',
    'retrograde', 'conjunct', 'square', 'degree', 'lunar', 'solar', 'progressed',
    'natal', 'birth chart', 'eclipse', 'stellium', 'chiron', 'nodes', 'fortuna'
  ];
  
  // Check if question contains any astro keywords
  const hasAstroKeyword = astroKeywords.some(keyword => query.includes(keyword));
  
  if (hasAstroKeyword) {
    return 'astro';
  }
  
  // Questions starting with what/why/how about feelings, people, situations → casual
  const casualPatterns = [
    /why do (they|people|i)/i,
    /why am i/i,
    /am i (crazy|broken|weird|alone)/i,
    /what does it mean/i,
    /should i/i,
    /do you think/i,
    /how do i/i,
    /(scared|afraid|anxious|confused|lost|alone)/i,
  ];
  
  const isCasualPattern = casualPatterns.some(pattern => pattern.test(query));
  
  return isCasualPattern ? 'casual' : 'astro';
}

/**
 * Generate a casual, empathetic response without astrological structure
 * Pulls from resonance history and soul context to personalize
 */
export async function generateCasualResponse(
  question: string,
  userId: string,
  context?: {
    birthChart?: any;
    transits?: any;
    stormsReport?: any;
  }
): Promise<string> {
  try {
    // Get user's resonance history for tone calibration
    const weights = userId && userId !== 'anonymous' 
      ? await getResonanceWeightsProfile(userId).catch(() => null)
      : null;

    // Casual voice templates - feels human, raspy, direct
    const casualVoices = [
      (q: string) => `Child, ${q}? That's just the mirror talking. You're not crazy—you're awake. Breathe through it.`,
      (q: string) => `Yeah... ${q}? That's the thing about being real: it scares people. You can't help that. Neither can they.`,
      (q: string) => `Here's the truth: ${q}? It's because you're *noticing*. Most people don't. That loneliness is real, but so is your sight.`,
      (q: string) => `The ones who stare? They're seeing something they forgot they had. Don't dimm that. They'll catch up or they won't.`,
      (q: string) => `You're asking the right question. Means you're paying attention. That's rare. Hold that.`,
    ];

    // Emotional/scared questions get extra compassion
    const emotionalKeywords = ['scared', 'afraid', 'anxious', 'alone', 'crazy', 'broken', 'lost', 'confused'];
    const isEmotional = emotionalKeywords.some(kw => question.toLowerCase().includes(kw));

    const compassionLayers = [
      "You're not broken. You're just seeing things others miss.",
      "That feeling? It's data. Not a diagnosis. Listen to it.",
      "Yeah, that weight you carry—it's real. And you're still standing.",
      "The people who stare usually wish they had your courage.",
    ];

    // Select a voice
    const selectedVoice = casualVoices[Math.floor(Math.random() * casualVoices.length)];
    let response = selectedVoice(question);

    // If emotional, add compassion layer
    if (isEmotional && Math.random() > 0.4) {
      const compassion = compassionLayers[Math.floor(Math.random() * compassionLayers.length)];
      response += ` ${compassion}`;
    }

    // Tail with actionable compassion
    const tailings = [
      "Trust that.",
      "That matters.",
      "Remember that.",
      "Sit with that.",
      "Feel into that.",
    ];
    const tailing = tailings[Math.floor(Math.random() * tailings.length)];
    response += ` ${tailing}`;

    // If we have transits and they're intense, subtle nod to timing
    if (context?.transits?.significant && context.transits.significant.length > 0 && Math.random() > 0.6) {
      const transitCount = context.transits.significant.length;
      const timingNod = transitCount > 2 
        ? " (And yeah, the planets are loud right now. That's part of this.)"
        : " (The timing matters too, by the way.)";
      response += timingNod;
    }

    console.log(`[Chat Adapter] Generated casual response for user ${userId}, mode: casual`);
    return response;
  } catch (error) {
    console.warn('[Chat Adapter] Error generating casual response:', error);
    // Fallback to simple raspy response
    return `Child... ${question}? That's the mirror talking. Breathe. You're okay.`;
  }
}

/**
 * Control percentages in responses
 * Format: 67% → "high likelihood" | 45% → "moderate" | 20% → "possible but rare"
 */
export function formatLikelihoodScore(percentage: number): string {
  if (percentage >= 80) return 'very high likelihood';
  if (percentage >= 65) return 'high likelihood';
  if (percentage >= 50) return 'moderate likelihood';
  if (percentage >= 35) return 'possible';
  if (percentage >= 20) return 'possible but unlikely';
  return 'rare';
}

/**
 * Conditional percentage inclusion
 * Returns percentage string if includeLikelihood is true, otherwise empty
 */
export function conditionalPercentage(
  percentage: number,
  includeLikelihood: boolean = true
): string {
  if (!includeLikelihood) return '';
  return `${percentage}% (${formatLikelihoodScore(percentage)})`;
}

/**
 * Check if response should include detailed structure
 * Emotionally vulnerable questions might benefit from raw empathy over percentages
 */
export function shouldSkipStructure(question: string): boolean {
  const emotionalPatterns = [
    /am i (crazy|broken|weird|enough)/i,
    /why do (they|people) (hate|ignore|reject|fear) me/i,
    /am i alone/i,
    /will i ever/i,
  ];
  
  return emotionalPatterns.some(pattern => pattern.test(question.toLowerCase()));
}

export default {
  detectQueryMode,
  generateCasualResponse,
  formatLikelihoodScore,
  conditionalPercentage,
  shouldSkipStructure,
};
