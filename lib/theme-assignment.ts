// Theme Assignment - Maps aspects to life themes

import type { DetectedAspect } from "./aspect-detection"

export interface ThemeScore {
  theme: string
  score: number
  aspects: DetectedAspect[]
}

export interface ThemeAssignment {
  primaryTheme: string
  secondaryThemes: string[]
  themeScores: ThemeScore[]
  groupedAspects: Record<string, DetectedAspect[]>
}

// Map planet combinations to themes
const themeMap: Record<string, string> = {
  // Self & Identity
  "sun-sun": "Self & Identity",
  "sun-moon": "Self & Identity",
  "sun-mars": "Self & Identity",

  // Relationships
  "moon-venus": "Relationships",
  "venus-mars": "Relationships",
  "venus-pluto": "Relationships",
  "moon-moon": "Relationships",

  // Career & Ambition
  "sun-saturn": "Career",
  "mars-saturn": "Career",
  "jupiter-saturn": "Career",
  "sun-midheaven": "Career",

  // Mental Focus & Communication
  "mercury-mercury": "Mental Focus",
  "mercury-moon": "Mental Focus",
  "mercury-jupiter": "Mental Focus",

  // Home & Family
  "moon-saturn": "Home & Family",
  "moon-ic": "Home & Family",

  // Action & Goals
  "mars-mars": "Action & Goals",
  "mars-jupiter": "Action & Goals",

  // Opportunities & Growth
  "jupiter-jupiter": "Opportunities",
  "sun-jupiter": "Opportunities",
  "venus-jupiter": "Opportunities",

  // Transformation & Change
  "pluto-sun": "Transformation",
  "pluto-moon": "Transformation",
  "uranus-sun": "Transformation",

  // Spirituality & Dreams
  "neptune-moon": "Spirituality",
  "neptune-venus": "Spirituality",
  "neptune-sun": "Spirituality",

  // Life Purpose
  "trueNode-sun": "Life Purpose",
  "meanNode-sun": "Life Purpose",
}

// Theme categories with friendly names
const themeCategories: Record<string, string> = {
  "Self & Identity": "Personal Growth & Self-Expression",
  Relationships: "Love, Partnerships & Social Connections",
  Career: "Career, Ambition & Achievement",
  "Mental Focus": "Communication, Learning & Ideas",
  "Home & Family": "Home, Family & Security",
  "Action & Goals": "Energy, Action & Drive",
  Opportunities: "Luck, Growth & Expansion",
  Transformation: "Change, Transformation & Power",
  Spirituality: "Dreams, Intuition & Spirituality",
  "Life Purpose": "Destiny, Purpose & Direction",
}

/**
 * Assign themes to aspects
 */
function assignThemes(aspects: DetectedAspect[]): string[] {
  return aspects.map((aspect) => {
    const key1 = `${aspect.planet1}-${aspect.planet2}`
    const key2 = `${aspect.planet2}-${aspect.planet1}`

    // Check theme map
    if (themeMap[key1]) return themeMap[key1]
    if (themeMap[key2]) return themeMap[key2]

    // Default themes based on individual planets
    if (aspect.planet1 === "saturn" || aspect.planet2 === "saturn") return "Career"
    if (aspect.planet1 === "venus" || aspect.planet2 === "venus") return "Relationships"
    if (aspect.planet1 === "jupiter" || aspect.planet2 === "jupiter") return "Opportunities"
    if (aspect.planet1 === "mars" || aspect.planet2 === "mars") return "Action & Goals"
    if (aspect.planet1 === "mercury" || aspect.planet2 === "mercury") return "Mental Focus"

    return "Self & Identity" // default fallback
  })
}

/**
 * Calculate theme scores
 */
function calculateThemeScores(aspects: DetectedAspect[], themes: string[]): Record<string, number> {
  const scores: Record<string, number> = {}

  aspects.forEach((aspect, index) => {
    const theme = themes[index]
    const score = aspect.score || 0

    if (!scores[theme]) {
      scores[theme] = 0
    }
    scores[theme] += score
  })

  return scores
}

/**
 * Group aspects by theme
 */
function groupAspectsByTheme(aspects: DetectedAspect[], themes: string[]): Record<string, DetectedAspect[]> {
  const grouped: Record<string, DetectedAspect[]> = {}

  aspects.forEach((aspect, index) => {
    const theme = themes[index]

    if (!grouped[theme]) {
      grouped[theme] = []
    }
    grouped[theme].push(aspect)
  })

  return grouped
}

/**
 * Assign primary and secondary themes to a set of aspects
 */
export function assignPrimaryAndSecondaryThemes(aspects: DetectedAspect[]): ThemeAssignment {
  if (aspects.length === 0) {
    return {
      primaryTheme: "General",
      secondaryThemes: [],
      themeScores: [],
      groupedAspects: {},
    }
  }

  // Assign themes to aspects
  const themes = assignThemes(aspects)

  // Calculate scores for each theme
  const themeScoreMap = calculateThemeScores(aspects, themes)

  // Sort themes by score
  const sortedThemes = Object.entries(themeScoreMap)
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
    .map(([theme]) => theme)

  // Group aspects by theme
  const groupedAspects = groupAspectsByTheme(aspects, themes)

  // Build theme scores array
  const themeScores: ThemeScore[] = sortedThemes.map((theme) => ({
    theme,
    score: themeScoreMap[theme],
    aspects: groupedAspects[theme] || [],
  }))

  return {
    primaryTheme: sortedThemes[0] || "General",
    secondaryThemes: sortedThemes.slice(1, 3),
    themeScores,
    groupedAspects,
  }
}

/**
 * Get theme intensity based on score
 */
export function getThemeIntensity(score: number): "high" | "medium" | "low" {
  if (score >= 3.0) return "high"
  if (score >= 1.5) return "medium"
  return "low"
}

/**
 * Get theme color for UI
 */
export function getThemeColor(theme: string): string {
  const colors: Record<string, string> = {
    "Self & Identity": "#8B5CF6", // purple
    Relationships: "#EC4899", // pink
    Career: "#3B82F6", // blue
    "Mental Focus": "#10B981", // green
    "Home & Family": "#F59E0B", // amber
    "Action & Goals": "#EF4444", // red
    Opportunities: "#14B8A6", // teal
    Transformation: "#6366F1", // indigo
    Spirituality: "#A855F7", // violet
    "Life Purpose": "#F97316", // orange
  }
  return colors[theme] || "#6B7280" // gray default
}

/**
 * Format theme summary for display
 */
export function formatThemeSummary(themeAssignment: ThemeAssignment): string {
  const { primaryTheme, secondaryThemes } = themeAssignment
  const friendlyPrimary = themeCategories[primaryTheme] || primaryTheme

  if (secondaryThemes.length === 0) {
    return friendlyPrimary
  }

  const friendlySecondary = secondaryThemes.map((t) => themeCategories[t] || t).join(", ")
  return `${friendlyPrimary} (with ${friendlySecondary})`
}
