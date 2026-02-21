/**
 * Comprehensive Aspect Dictionary - Core + Minor + Modern Aspects
 * ~28 aspect types with full interpretations
 */

export type AspectType = 
  // Core Aspects (5)
  | 'Conjunction'
  | 'Sextile' 
  | 'Square'
  | 'Trine'
  | 'Opposition'
  // Minor Modern Aspects (8)
  | 'Quincunx'
  | 'Semisextile'
  | 'Novile'
  | 'Quintile'
  | 'Biquintile'
  | 'Sesquiquadrate'
  | 'Semisquare'
  | 'Septile'
  // Harmonic Aspects (5+)
  | 'Decile'
  | 'Tridecile'
  | 'Undecimal'
  | 'Duodecile'
  | 'Vigintile'
  // Generational/Karmic (3+)
  | 'Parallel'
  | 'Contraparallel'
  | 'Composite'
  | 'Synastry';

export interface AspectDefinition {
  type: AspectType;
  angle: number; // degrees
  orb: number; // acceptable orb range
  category: 'core' | 'minor' | 'harmonic' | 'karmic';
  nature: 'harmonious' | 'challenging' | 'neutral' | 'transformative';
  keywords: string[];
  positive: string;
  negative: string;
  advice: string;
}

// Complete Aspect Dictionary
export const ASPECT_DICTIONARY: Record<AspectType, AspectDefinition> = {
  // ============ CORE ASPECTS (0°, 60°, 90°, 120°, 180°) ============
  
  Conjunction: {
    type: 'Conjunction',
    angle: 0,
    orb: 10,
    category: 'core',
    nature: 'neutral',
    keywords: ['union', 'fusion', 'amplification', 'focus', 'intensity'],
    positive: 'Unified energy, amplified intention, merged strengths, new synergy',
    negative: 'Conflated issues, overwhelming intensity, loss of objectivity, internal pressure',
    advice: 'Channel combined energy consciously. Use intensity as fuel. Integrate traits rather than compete.'
  },

  Sextile: {
    type: 'Sextile',
    angle: 60,
    orb: 6,
    category: 'core',
    nature: 'harmonious',
    keywords: ['opportunity', 'communication', 'ease', 'creativity', 'support'],
    positive: 'Harmonious flow, natural talent, creative expression, effortless growth',
    negative: 'Missed opportunities, complacency, underutilized potential, lack of drive',
    advice: 'Actively engage this energy; it won\'t push itself. Take the opportunities offered. Develop the gifts.'
  },

  Square: {
    type: 'Square',
    angle: 90,
    orb: 8,
    category: 'core',
    nature: 'challenging',
    keywords: ['tension', 'growth', 'friction', 'challenge', 'motivation'],
    positive: 'Dynamic drive, creative friction, growth catalyst, motivation for change',
    negative: 'Internal conflict, obstacles, frustration, blocked progress, stress',
    advice: 'Use friction as fuel. Problem-solve consciously. This aspect builds resilience—lean into it.'
  },

  Trine: {
    type: 'Trine',
    angle: 120,
    orb: 8,
    category: 'core',
    nature: 'harmonious',
    keywords: ['fortune', 'talent', 'grace', 'flow', 'ease'],
    positive: 'Natural talents, fortunate circumstances, effortless flow, gifts and blessings',
    negative: 'Complacency, wasted talent, overconfidence, missed lessons, spiritual laziness',
    advice: 'These gifts are real—but they require use. Don\'t take fortune for granted. Develop what flows easily.'
  },

  Opposition: {
    type: 'Opposition',
    angle: 180,
    orb: 10,
    category: 'core',
    nature: 'challenging',
    keywords: ['polarity', 'projection', 'awareness', 'balance', 'integration'],
    positive: 'Awareness of shadow, catalyst for integration, magnetic polarities, relationship wisdom',
    negative: 'Projection, denial, confrontation, relationship tension, external blame',
    advice: 'What you see in others is often within you. Integrate both poles. Build bridges instead of walls.'
  },

  // ============ MINOR ASPECTS ============

  Quincunx: {
    type: 'Quincunx',
    angle: 150,
    orb: 3,
    category: 'minor',
    nature: 'challenging',
    keywords: ['adjustment', 'irritation', 'fine-tuning', 'restlessness', 'recalibration'],
    positive: 'Subtle refinement, attention to detail, continuous adjustment, perfection-seeking',
    negative: 'Chronic irritation, perfectionism paralysis, inability to settle, nervous tension',
    advice: 'Small adjustments lead to breakthroughs. Don\'t let perfectionism paralyze. Refine, not ruminate.'
  },

  Semisextile: {
    type: 'Semisextile',
    angle: 30,
    orb: 2,
    category: 'minor',
    nature: 'neutral',
    keywords: ['connection', 'minor support', 'subtle link', 'slight friction'],
    positive: 'Subtle support, minor opportunities, gentle connections, quiet growth',
    negative: 'Barely perceptible tension, slow progress, easy to overlook',
    advice: 'Notice and nurture these subtle threads. Small connections compound over time.'
  },

  Novile: {
    type: 'Novile',
    angle: 40,
    orb: 2,
    category: 'minor',
    nature: 'harmonious',
    keywords: ['perfection', 'completion', 'spiritual', 'sacred geometry', 'divine timing'],
    positive: 'Spiritual alignment, divine timing, sacred completion, transcendent understanding',
    negative: 'Perfectionist demands, unrealistic expectations, out-of-touch idealism',
    advice: 'Trust the universe\'s timing. Perfection exists in the process, not the destination.'
  },

  Quintile: {
    type: 'Quintile',
    angle: 72,
    orb: 2,
    category: 'minor',
    nature: 'harmonious',
    keywords: ['creativity', 'talent', 'mastery', 'divine gift', 'genius'],
    positive: 'Innate creativity, special talent, genius-level skill, unique expression',
    negative: 'Undeveloped talent, creative frustration, misaligned gifts, hidden abilities',
    advice: 'You have a special gift. Discover it. Develop it. The world needs your unique contribution.'
  },

  Biquintile: {
    type: 'Biquintile',
    angle: 144,
    orb: 2,
    category: 'minor',
    nature: 'harmonious',
    keywords: ['mastery', 'skill', 'expression', 'creative power', 'artistry'],
    positive: 'Refined mastery, artistic expression, cultivated skill, creative excellence',
    negative: 'Unexpressed talent, suppressed creativity, passive skill, underdeveloped gift',
    advice: 'Your skills are advanced. Express them boldly. Teach others what you\'ve mastered.'
  },

  Sesquiquadrate: {
    type: 'Sesquiquadrate',
    angle: 135,
    orb: 2,
    category: 'minor',
    nature: 'challenging',
    keywords: ['friction', 'testing', 'proving ground', 'subtle conflict', 'refinement'],
    positive: 'Tests character, strengthens resolve, proves worth, refines approach',
    negative: 'Low-level frustration, constant testing, feeling unproven, nagging doubt',
    advice: 'You\'re being tested to become stronger. Pass these trials. They\'re not punishment—they\'re preparation.'
  },

  Semisquare: {
    type: 'Semisquare',
    angle: 45,
    orb: 2,
    category: 'minor',
    nature: 'challenging',
    keywords: ['irritation', 'buildup', 'minor friction', 'nagging tension', 'cumulative stress'],
    positive: 'Motivation through friction, attention-getter, prevents stagnation',
    negative: 'Persistent annoyance, low-grade stress, friction that compounds, chronic irritation',
    advice: 'Don\'t ignore small tensions. Address them before they compound into bigger issues.'
  },

  Septile: {
    type: 'Septile',
    angle: 51.43,
    orb: 2,
    category: 'minor',
    nature: 'transformative',
    keywords: ['mystical', 'fateful', 'karmic', 'spiritual guidance', 'destiny'],
    positive: 'Spiritual destiny, karmic purpose, mystical alignment, divinely guided',
    negative: 'Fatalistic resignation, mystical bypassing, spiritual confusion, unclear calling',
    advice: 'You\'re on a spiritual path. Trust the guidance you receive, but also take action.'
  },

  // ============ HARMONIC ASPECTS ============

  Decile: {
    type: 'Decile',
    angle: 36,
    orb: 2,
    category: 'harmonic',
    nature: 'harmonious',
    keywords: ['opportunity', 'luck', 'grace', 'small blessings', 'progress'],
    positive: 'Fortunate moments, lucky breaks, grace in small things, steady progress',
    negative: 'Missed small opportunities, failure to recognize blessings, stagnation',
    advice: 'Blessings come in small packages. Stay alert. Opportunity often whispers before it shouts.'
  },

  Tridecile: {
    type: 'Tridecile',
    angle: 108,
    orb: 2,
    category: 'harmonic',
    nature: 'harmonious',
    keywords: ['luck', 'expansion', 'abundance', 'growth', 'synchronicity'],
    positive: 'Synchronistic events, fortunate connections, expanding opportunities, abundance',
    negative: 'Overlooked opportunities, passive reception, wasted luck, missed synchronicity',
    advice: 'The universe is conspiring in your favor. Act on the synchronicities you notice.'
  },

  Undecimal: {
    type: 'Undecimal',
    angle: 32.73,
    orb: 2,
    category: 'harmonic',
    nature: 'neutral',
    keywords: ['resonance', 'harmony', 'attunement', 'alignment', 'synchrony'],
    positive: 'Perfect resonance, harmonious alignment, intuitive understanding, shared wavelength',
    negative: 'Missed attunement, dissonance, misalignment, failure to connect',
    advice: 'You\'re in harmony with this energy. Trust your intuition. The path is clear.'
  },

  Duodecile: {
    type: 'Duodecile',
    angle: 30,
    orb: 1.5,
    category: 'harmonic',
    nature: 'harmonious',
    keywords: ['grace', 'minor blessing', 'small fortune', 'subtle support', 'quiet growth'],
    positive: 'Subtle grace, minor blessings, quiet support, gradual improvement',
    negative: 'Subtle problems overlooked, minor issues ignored, grace unappreciated',
    advice: 'Life\'s small graces add up. Appreciate the subtle support surrounding you.'
  },

  Vigintile: {
    type: 'Vigintile',
    angle: 18,
    orb: 1.5,
    category: 'harmonic',
    nature: 'neutral',
    keywords: ['initiation', 'seed', 'potential', 'beginning', 'spark'],
    positive: 'New beginnings, seed potential, initiatory spark, fresh start',
    negative: 'Failed starts, unrealized potential, aborted initiatives, false starts',
    advice: 'A seed has been planted. Water it with intention. Begin what calls to you.'
  },

  // ============ KARMIC/GENERATIONAL ============

  Parallel: {
    type: 'Parallel',
    angle: 0,
    orb: 1.5,
    category: 'karmic',
    nature: 'harmonious',
    keywords: ['resonance', 'synchronicity', 'same frequency', 'aligned destiny', 'soul connection'],
    positive: 'Soul connection, aligned paths, same frequency, karmic recognition, instant familiarity',
    negative: 'Enmeshment, loss of individuation, codependence, unresolved entanglement',
    advice: 'You recognize each other at soul level. Make sure you\'re also individuals with boundaries.'
  },

  Contraparallel: {
    type: 'Contraparallel',
    angle: 0,
    orb: 1.5,
    category: 'karmic',
    nature: 'challenging',
    keywords: ['polarity', 'opposite path', 'shadow resonance', 'karmic mirror', 'reflection'],
    positive: 'Shadow awareness, complementary strengths, karmic mirror, integration potential',
    negative: 'Mirror projection, oppositional dynamics, shadow compulsion, unresolved patterns',
    advice: 'This person/energy mirrors your shadow. What repels you likely teaches you something vital.'
  },

  Composite: {
    type: 'Composite',
    angle: 0,
    orb: 0,
    category: 'karmic',
    nature: 'transformative',
    keywords: ['merge', 'synthesis', 'unity', 'new whole', 'third entity'],
    positive: 'Creation of third space, synthesis of strengths, new possibilities, shared vision',
    negative: 'Loss of self, merged identity, codependence, diluted purpose',
    advice: 'You\'re creating something new together. Maintain your individuality while building the whole.'
  },

  Synastry: {
    type: 'Synastry',
    angle: 0,
    orb: 0,
    category: 'karmic',
    nature: 'transformative',
    keywords: ['between', 'relationship', 'dynamic', 'interaction', 'exchange'],
    positive: 'Mutual growth, reciprocal understanding, dynamic exchange, relationship potential',
    negative: 'Unbalanced dynamics, one-sided exchange, power struggles, unmet needs',
    advice: 'Every relationship is a dance of energies. Make sure both partners lead and follow.'
  }
};

/**
 * Helper function to get aspect by angle
 */
export function getAspectByAngle(angle: number): AspectDefinition | null {
  const normalized = ((angle % 360) + 360) % 360;
  
  for (const aspect of Object.values(ASPECT_DICTIONARY)) {
    const diff = Math.min(
      Math.abs(normalized - aspect.angle),
      360 - Math.abs(normalized - aspect.angle)
    );
    if (diff <= aspect.orb) {
      return aspect;
    }
  }
  
  return null;
}

/**
 * Get all aspects of a specific category
 */
export function getAspectsByCategory(category: AspectDefinition['category']): AspectDefinition[] {
  return Object.values(ASPECT_DICTIONARY).filter(a => a.category === category);
}

/**
 * Get all harmonious aspects
 */
export function getHarmoniousAspects(): AspectDefinition[] {
  return Object.values(ASPECT_DICTIONARY).filter(a => a.nature === 'harmonious');
}

/**
 * Get all challenging aspects  
 */
export function getChallengingAspects(): AspectDefinition[] {
  return Object.values(ASPECT_DICTIONARY).filter(a => a.nature === 'challenging');
}

/**
 * Get aspect by exact name
 */
export function getAspectDefinition(aspectType: AspectType): AspectDefinition | null {
  return ASPECT_DICTIONARY[aspectType] || null;
}
