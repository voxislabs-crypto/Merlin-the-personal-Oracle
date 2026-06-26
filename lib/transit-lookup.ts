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
  interpretation: string
  do: string[]
  dont: string[]
}

// Comprehensive transit lookup database
export const TRANSIT_LOOKUP: Record<string, TransitInterpretation> = {
  "Moon opposition Saturn": {
    effect: "heavy",
    interpretation: "Emotional heaviness and feelings of isolation. Your mood may be dampened by responsibilities or criticism.",
    do: ["Practice self-compassion", "Honor your feelings", "Set gentle boundaries"],
    dont: ["Withdraw completely", "Take criticism too personally", "Ignore your emotional needs"]
  },
  "Moon opposition Pluto": {
    effect: "intense",
    interpretation: "Deep emotional intensity and power struggles. Hidden feelings may surface powerfully.",
    do: ["Process emotions safely", "Seek support if needed", "Practice emotional release"],
    dont: ["Suppress intense feelings", "Engage in emotional manipulation", "Make impulsive relationship decisions"]
  },
  "Sun trine Jupiter": {
    effect: "expansive",
    interpretation: "Optimistic energy and growth opportunities. Lucky breaks and positive expansion.",
    do: ["Take calculated risks", "Expand your horizons", "Share your gifts generously"],
    dont: ["Overcommit", "Be arrogant", "Ignore details in your enthusiasm"]
  },
  "Mercury square Mars": {
    effect: "tense",
    interpretation: "Mental tension and argumentative energy. Communication may be sharp or hasty.",
    do: ["Think before speaking", "Channel mental energy productively", "Practice patience"],
    dont: ["Start unnecessary arguments", "Make hasty decisions", "Send impulsive messages"]
  },
  "Venus conjunct Neptune": {
    effect: "foggy",
    interpretation: "Romantic idealism and creative inspiration. Boundaries may blur in relationships.",
    do: ["Enjoy beauty and art", "Practice compassion", "Dream and imagine"],
    dont: ["Idealize people unrealistically", "Ignore red flags", "Lose yourself in fantasy"]
  },
  "Mars square Saturn": {
    effect: "frustrated",
    interpretation: "Blocked action and frustrated ambition. Progress may feel slow or restricted.",
    do: ["Work steadily", "Build endurance", "Plan carefully"],
    dont: ["Force things", "Give up prematurely", "Act out in anger"]
  },
  "Jupiter opposite Uranus": {
    effect: "chaotic-expansive",
    interpretation: "Sudden opportunities mixed with instability. Exciting but unpredictable energy.",
    do: ["Stay flexible", "Seize unexpected chances", "Balance freedom with responsibility"],
    dont: ["Act recklessly", "Burn bridges", "Ignore consequences"]
  }
}

// Get day rating based on transits
export function getDayRating(transits: any[]): "green" | "yellow" | "red" {
  const effects = transits.map(t => {
    const lookup = TRANSIT_LOOKUP[t.aspect]
    return lookup?.effect || "neutral"
  })
  
  const challengingEffects = ["heavy", "intense", "frustrated", "chaotic", "volatile"]
  const positiveEffects = ["positive",  "expansive", "productive"]
  
  const challengingCount = effects.filter(e => challengingEffects.includes(e)).length
  const positiveCount = effects.filter(e => positiveEffects.includes(e)).length
  
  if (challengingCount > positiveCount) return "red"
  if (positiveCount > challengingCount) return "green"
  return "yellow"
}
