export interface TransitInterpretation {
  effect:
    | "positive"
    | "neutral"
    | "heavy"
    | "intense"
    | "volatile"
    | "chaotic"
    | "excessive"
    | "productive"
    | "frustrated"
    | "energized"
    | "expansive"
    | "serious"
    | "restrictive"
    | "midlife-shift"
    | "foggy"
    | "confusing"
    | "transformative"
    | "wounding-healing"
    | "vulnerable"
    | "emotional-healing"
    | "tense"
    | "chaotic-expansive"
    | "visionary"
    | "grounding"
    | "illuminating"
    | "deepening"
    | "awakening"
    | "stabilizing"
    | "revolutionary"
    | "compassionate"
    | "liberating"
    | "mystical"
  interpretation: string
  do: string[]
  dont: string[]
  dayRating?: "green" | "yellow" | "red"
}

// Comprehensive transit lookup database - 28+ major transits
export const TRANSIT_LOOKUP: Record<string, TransitInterpretation> = {
  // ========== SUN TRANSITS ==========
  "Sun conjunction Sun": {
    effect: "neutral",
    interpretation: "Solar return. Birthday energy. You begin a new annual cycle. Renewal and regeneration.",
    do: ["Reflect on the past year", "Set intentions for the new year", "Celebrate yourself"],
    dont: ["Dwell on past failures", "Make drastic changes on impulse", "Ignore your intuition"],
    dayRating: "green"
  },
  "Sun trine Jupiter": {
    effect: "expansive",
    interpretation: "Optimistic energy and growth opportunities. Lucky breaks and positive expansion. Fortune smiles.",
    do: ["Take calculated risks", "Expand your horizons", "Share your gifts generously"],
    dont: ["Overcommit", "Be arrogant", "Ignore details in your enthusiasm"],
    dayRating: "green"
  },
  "Sun square Saturn": {
    effect: "serious",
    interpretation: "Reality check. Limitations appear. Authority figures challenge you. Work must be solid.",
    do: ["Build something lasting", "Face hard truths", "Accept responsibility"],
    dont: ["Avoid challenges", "Blame external circumstances", "Ignore feedback"],
    dayRating: "yellow"
  },
  "Sun opposition Pluto": {
    effect: "transformative",
    interpretation: "Core transformation. Power struggles. Identity crisis/renewal. Deep inner work.",
    do: ["Embrace necessary change", "Reclaim your power", "Release what no longer serves"],
    dont: ["Resist transformation", "Seek to control others", "Deny shadow aspects"],
    dayRating: "yellow"
  },
  
  // ========== MOON TRANSITS ==========
  "Moon opposition Saturn": {
    effect: "heavy",
    interpretation: "Emotional heaviness and feelings of isolation. Your mood may be dampened by responsibilities or criticism.",
    do: ["Practice self-compassion", "Honor your feelings", "Set gentle boundaries"],
    dont: ["Withdraw completely", "Take criticism too personally", "Ignore your emotional needs"],
    dayRating: "red"
  },
  "Moon opposition Pluto": {
    effect: "intense",
    interpretation: "Deep emotional intensity and power struggles. Hidden feelings may surface powerfully.",
    do: ["Process emotions safely", "Seek support if needed", "Practice emotional release"],
    dont: ["Suppress intense feelings", "Engage in emotional manipulation", "Make impulsive relationship decisions"],
    dayRating: "red"
  },
  "Moon trine Venus": {
    effect: "positive",
    interpretation: "Emotional harmony and relational ease. Love flows naturally. Good time for heart conversations.",
    do: ["Connect with loved ones", "Practice self-care", "Share affection openly"],
    dont: ["Isolate", "Hold back emotions", "Neglect relationships"],
    dayRating: "green"
  },
  "Moon square Mars": {
    effect: "volatile",
    interpretation: "Emotional irritation and impulsiveness. Feelings run hot. Be careful with anger.",
    do: ["Exercise physically", "Channel intensity constructively", "Practice patience"],
    dont: ["Act on impulse", "Starting arguments", "Make major decisions emotionally"],
    dayRating: "red"
  },

  // ========== MERCURY TRANSITS ==========
  "Mercury square Mars": {
    effect: "tense",
    interpretation: "Mental tension and argumentative energy. Communication may be sharp or hasty.",
    do: ["Think before speaking", "Channel mental energy productively", "Practice patience"],
    dont: ["Start unnecessary arguments", "Make hasty decisions", "Send impulsive messages"],
    dayRating: "yellow"
  },
  "Mercury trine Jupiter": {
    effect: "productive",
    interpretation: "Clear thinking meets expanded perspective. Good for learning, writing, communication. Ideas flow.",
    do: ["Write, study, communicate", "Share knowledge", "Expand your perspective"],
    dont: ["Overthink", "Underestimate understanding", "Miss the big picture"],
    dayRating: "green"
  },
  "Mercury conjunction Saturn": {
    effect: "serious",
    interpretation: "Serious thinking. Structured communication. Depth over breadth. Good for important decisions.",
    do: ["Think deeply", "Plan carefully", "Communicate with clarity"],
    dont: ["Rush decisions", "Think only surface-level", "Ignore practical concerns"],
    dayRating: "yellow"
  },

  // ========== VENUS TRANSITS ==========
  "Venus conjunct Neptune": {
    effect: "foggy",
    interpretation: "Romantic idealism and creative inspiration. Boundaries may blur in relationships.",
    do: ["Enjoy beauty and art", "Practice compassion", "Dream and imagine"],
    dont: ["Idealize people unrealistically", "Ignore red flags", "Lose yourself in fantasy"],
    dayRating: "yellow"
  },
  "Venus trine Saturn": {
    effect: "stabilizing",
    interpretation: "Lasting love and serious commitment. Good for making promises. Stability in relationships.",
    do: ["Deepen commitments", "Show you care through action", "Build trust"],
    dont: ["Play games", "Avoid responsibility", "Treat relationships casually"],
    dayRating: "green"
  },
  "Venus square Pluto": {
    effect: "intense",
    interpretation: "Intense desires and power plays in love. Jealousy or obsession may arise. Deep transformation possible.",
    do: ["Examine relationship patterns", "Face your shadow desires", "Transform through love"],
    dont: ["Engage in manipulation", "Suppress natural desires", "Control others through love"],
    dayRating: "red"
  },
  "Venus opposition Uranus": {
    effect: "volatile",
    interpretation: "Sudden changes in relationships. Break-ups or unexpected reunions. Freedom vs. attachment.",
    do: ["Embrace spontaneity", "Reassess what you value", "Allow relationships to evolve"],
    dont: ["Cling to stability", "Make rash commitment decisions", "Ignore your need for freedom"],
    dayRating: "yellow"
  },

  // ========== MARS TRANSITS ==========
  "Mars conjunction Pluto": {
    effect: "intense",
    interpretation: "Raw power and primal drive. Intense action. Can be aggressive or transformative.",
    do: ["Channel intensity onto goals", "Face what scares you", "Act with purpose"],
    dont: ["Act destructively", "Engage in power struggles", "Repress your drive"],
    dayRating: "yellow"
  },
  "Mars square Saturn": {
    effect: "frustrated",
    interpretation: "Blocked action and frustrated ambition. Progress may feel slow or restricted.",
    do: ["Work steadily", "Build endurance", "Plan carefully"],
    dont: ["Force things", "Give up prematurely", "Act out in anger"],
    dayRating: "yellow"
  },
  "Mars trine Jupiter": {
    effect: "energized",
    interpretation: "Courageous action and expansion. Energy meets opportunity. Good for starting new projects.",
    do: ["Take bold action", "Pursue your goals", "Share your energy"],
    dont: ["Act recklessly", "Overextend yourself", "Waste your energy"],
    dayRating: "green"
  },
  "Mars opposite Neptune": {
    effect: "confusing",
    interpretation: "Vague energy and unclear direction. Action lacks clarity. Deception possible.",
    do: ["Clarify your intentions", "Act with integrity", "Verify information"],
    dont: ["Act on unclear impulses", "Deceive others", "Ignore details"],
    dayRating: "red"
  },

  // ========== JUPITER TRANSITS ==========
  "Jupiter opposite Uranus": {
    effect: "chaotic-expansive",
    interpretation: "Sudden opportunities mixed with instability. Exciting but unpredictable energy.",
    do: ["Stay flexible", "Seize unexpected chances", "Balance freedom with responsibility"],
    dont: ["Act recklessly", "Burn bridges", "Ignore consequences"],
    dayRating: "yellow"
  },
  "Jupiter trine Saturn": {
    effect: "grounding",
    interpretation: "Expansion with structure. Growth with responsibility. Wise action and good timing.",
    do: ["Build something substantial", "Take reasonable risks", "Plan for growth"],
    dont: ["Be overly conservative", "Miss opportunities", "Ignore practical limits"],
    dayRating: "green"
  },
  "Jupiter square Neptune": {
    effect: "visionary",
    interpretation: "Grand idealism meets spiritual confusion. Beware illusions. Inspiration possible, but verify.",
    do: ["Dream big but verify", "Develop spiritual practice", "Discern truth from illusion"],
    dont: ["Believe everything", "Ignore red flags", "Get lost in fantasy"],
    dayRating: "yellow"
  },

  // ========== SATURN TRANSITS ==========
  "Saturn opposite Sun": {
    effect: "midlife-shift",
    interpretation: "Maturity checkpoint. SAT (Saturn Adult Trajectory) demands authenticity. Who are you really?",
    do: ["Recommit to purpose", "Release false identity", "Build on solid ground"],
    dont: ["Resist aging", "Cling to youth", "Ignore life lessons learned"],
    dayRating: "yellow"
  },
  "Saturn trine Pluto": {
    effect: "transformative",
    interpretation: "Deep transformation with structure. Rebirth through discipline. Building new foundations.",
    do: ["Embrace necessary change", "Work with discipline", "Build from the ruins"],
    dont: ["Resist transformation", "Act without planning", "Ignore shadow work"],
    dayRating: "green"
  },
  "Saturn square Venus": {
    effect: "restrictive",
    interpretation: "Tests of love and values. Difficult commitments or separations. Worth vs. market value.",
    do: ["Deepen commitment through choice", "Clarify your values", "Test relationships"],
    dont: ["Rush into commitment", "Settle for less", "Close your heart"],
    dayRating: "red"
  },

  // ========== URANUS TRANSITS ==========
  "Uranus opposite Sun": {
    effect: "awakening",
    interpretation: "Revolutionary identity shift. Sudden awakening. Breaking free from restrictions. Authenticity at all costs.",
    do: ["Embrace your true self", "Break free from constraints", "Revolutionize your life path"],
    dont: ["Cling to old identity", "Ignore your authenticity", "Fear change"],
    dayRating: "yellow"
  },
  "Uranus trine Mars": {
    effect: "liberating",
    interpretation: "Innovative action and breakthrough energy. Technology or sudden inspiration. Progress accelerates.",
    do: ["Try new approaches", "Embrace technology", "Act on inspiration"],
    dont: ["Play it safe", "Resist innovation", "Miss the opportunity"],
    dayRating: "green"
  },

  // ========== NEPTUNE TRANSITS ==========
  "Neptune conjunction Sun": {
    effect: "mystical",
    interpretation: "Spiritual awakening or confusion. Idealism rises. Boundaries dissolve. Creativity blooms or allusions abound.",
    do: ["Develop spiritual practice", "Trust intuition", "Create and express"],
    dont: ["Lose yourself completely", "Escape into fantasy", "Ignore practical reality"],
    dayRating: "yellow"
  },
  "Neptune opposition Mercury": {
    effect: "confusing",
    interpretation: "Communication confusion and misunderstandings. Clarity is elusive. Intuition vs. logic clash.",
    do: ["Verify important information", "Trust intuition for guidance", "Journal and reflect"],
    dont: ["Make major decisions now", "Believe everything you hear", "Ignore your intuition"],
    dayRating: "red"
  },
  "Neptune trine Venus": {
    effect: "compassionate",
    interpretation: "Universal love and spiritual romance. Idealism in relationships. Creativity and beauty aligned.",
    do: ["Deepen spiritual connection", "Express love universally", "Create from inspiration"],
    dont: ["Lose practical reality", "Idealize partners", "Neglect grounded love"],
    dayRating: "green"
  },

  // ========== PLUTO TRANSITS ==========
  "Pluto square Sun": {
    effect: "transformative",
    interpretation: "Core identity crisis and transformation. Power struggles with authority. Death and rebirth cycle.",
    do: ["Release old self", "Reclaim your power", "Embrace profound change"],
    dont: ["Resist transformation", "Seek to control", "Ignore shadow work"],
    dayRating: "red"
  },
  "Pluto trine Jupiter": {
    effect: "expansive",
    interpretation: "Deep transformation leading to growth. Inner work yields abundance. Psychological breakthrough.",
    do: ["Do inner work", "Trust the process", "Share your wisdom"],
    dont: ["Ignore internal signals", "Rush transformation", "Remain superficial"],
    dayRating: "green"
  },
  "Pluto opposite Venus": {
    effect: "wounding-healing",
    interpretation: "Relationship transformation. Deep sexual/emotional healing. Power dynamics revealed and reset.",
    do: ["Face relationship patterns", "Heal deeply", "Reclaim self"],
    dont: ["Engage in power games", "Suppress wounds", "Control relationships"],
    dayRating: "red"
  }
}

/**
 * Get day rating based on transits
 * Green: More harmonious/positive transits
 * Yellow: Mixed or neutral
 * Red: More challenging/heavy transits
 */
export function getDayRating(transits: any[]): "green" | "yellow" | "red" {
  if (transits.length === 0) return "yellow";

  const ratings = transits.map(t => {
    const lookup = TRANSIT_LOOKUP[t.aspect];
    return lookup?.dayRating || "yellow";
  });

  const greenCount = ratings.filter(r => r === "green").length;
  const redCount = ratings.filter(r => r === "red").length;

  if (greenCount > redCount) return "green";
  if (redCount > greenCount) return "red";
  return "yellow";
}

/**
 * Get interpretation for a specific transit
 */
export function getTransitInterpretation(
  planet1: string,
  aspect: string,
  planet2: string
): TransitInterpretation | null {
  const key = `${planet1} ${aspect} ${planet2}`;
  return TRANSIT_LOOKUP[key] || null;
}

/**
 * Find closest matching transit interpretation
 * Useful for transits not in the exact lookup database
 */
export function findClosestTransitInterpretation(
  planet1: string,
  aspect: string,
  planet2: string
): TransitInterpretation | null {
  // Try exact match first
  let key = `${planet1} ${aspect} ${planet2}`;
  if (TRANSIT_LOOKUP[key]) return TRANSIT_LOOKUP[key];

  // Try without planet names (just aspect pattern)
  for (const [lookupKey, interpretation] of Object.entries(TRANSIT_LOOKUP)) {
    if (lookupKey.includes(aspect)) {
      return interpretation;
    }
  }

  // Default to "neutral" interpretation
  return null;
}
