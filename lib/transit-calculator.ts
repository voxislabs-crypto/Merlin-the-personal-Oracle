import { TRANSIT_LOOKUP, getDayRating, type TransitInterpretation } from "./transit-lookup"
import { type MBTIType } from "./mbti-system"
import { getPlanetPositions, type PlanetPositions } from "./swiss-ephemeris-core"
import { type DetectedAspect } from "./aspect-detection"
import { assignPrimaryAndSecondaryThemes } from "./theme-assignment"
import { applyMBTIOverlay } from "./mbti-overlay"
import { resonanceDB } from "./resonance-database"
import type { ResonanceStats } from "./resonance-types"

export interface Transit {
  transit_aspect: string
  orb: string
  effect: TransitInterpretation["effect"]
  interpretation: string
  do: string[]
  dont: string[]
  score?: number
  resonanceStats?: ResonanceStats
  adjustedScore?: number
}

export interface DailyForecast {
  date: string
  day_rating: "green" | "yellow" | "red"
  summary: string
  transits: Transit[]
  primaryTheme?: string
  secondaryThemes?: string[]
  mbti_overlay?: {
    [key: string]: {
      translation: string
    }
  }
  overallConfidence?: number
  personalizedForUser?: string
}

export interface BirthData {
  date: Date
  location: {
    latitude: number
    longitude: number
  }
}

const MOCK_TRANSITS = [
  { aspect: "Moon opposition Saturn", orb: "0° 20'" },
  { aspect: "Moon opposition Pluto", orb: "0° 35'" },
  { aspect: "Sun conjunct Venus", orb: "1° 15'" },
  { aspect: "Mars square Moon", orb: "2° 45'" },
  { aspect: "Jupiter trine Sun", orb: "3° 10'" },
  { aspect: "Saturn square Sun", orb: "0° 55'" },
  { aspect: "Sun conjunct Mercury", orb: "0° 08'" },
  { aspect: "Mars trine Jupiter", orb: "1° 30'" },
]

function detectTransitAspects(currentPlanets: PlanetPositions, natalPlanets: PlanetPositions): DetectedAspect[] {
  const aspects: DetectedAspect[] = []
  const planets = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"] as const
  const aspectTypes = [
    { name: "conjunction", angle: 0, orb: 10 },
    { name: "opposition", angle: 180, orb: 10 },
    { name: "trine", angle: 120, orb: 8 },
    { name: "square", angle: 90, orb: 8 },
    { name: "sextile", angle: 60, orb: 6 },
  ]

  for (const transitPlanet of planets) {
    for (const natalPlanet of planets) {
      const transitLon = currentPlanets[transitPlanet]?.longitude
      const natalLon = natalPlanets[natalPlanet]?.longitude

      if (transitLon === undefined || natalLon === undefined) continue

      for (const aspectType of aspectTypes) {
        let diff = Math.abs(transitLon - natalLon)
        if (diff > 180) diff = 360 - diff

        const orbDiff = Math.abs(diff - aspectType.angle)
        if (orbDiff <= aspectType.orb) {
          aspects.push({
            planet1: transitPlanet,
            planet2: natalPlanet,
            aspect: aspectType.name,
            orb: orbDiff,
            score: 100 - (orbDiff / aspectType.orb) * 100,
          })
        }
      }
    }
  }

  return aspects
}

async function calculateDailyTransits(date: Date, birthData: BirthData, userId?: string): Promise<Transit[]> {
  try {
    const currentPlanets = await getPlanetPositions(date)
    const natalPlanets = await getPlanetPositions(birthData.date)

    const aspectsDetected = detectTransitAspects(currentPlanets, natalPlanets)

    const transits: Transit[] = await Promise.all(
      aspectsDetected.map(async (aspect) => {
        const aspectKey = `${aspect.planet1} ${aspect.aspect.toLowerCase()} ${aspect.planet2}`
        const interpretation = TRANSIT_LOOKUP[aspectKey] || TRANSIT_LOOKUP[aspect.aspect.toLowerCase()]

        let resonanceStats: ResonanceStats | undefined
        let adjustedScore = aspect.score || 0

        if (userId) {
          // Determine primary theme for this aspect
          const primaryTheme = assignPrimaryAndSecondaryThemes([aspect]).primaryTheme

          try {
            resonanceStats = await resonanceDB.getResonanceStats(userId, aspectKey, primaryTheme)

            // Calculate resonance-adjusted score
            const finalWeight = await resonanceDB.calculateFinalWeight(userId, aspectKey, primaryTheme, adjustedScore)
            adjustedScore = finalWeight
          } catch (error) {
            console.error("Error getting resonance stats:", error)
          }
        }

        return {
          transit_aspect: aspectKey,
          orb: `${Math.abs(aspect.orb).toFixed(2)}°`,
          effect: interpretation?.effect || "neutral",
          interpretation: interpretation?.interpretation || "Transit energy present",
          do: interpretation?.do || ["Stay mindful of cosmic energies"],
          dont: interpretation?.dont || ["Ignore your intuition"],
          score: aspect.score,
          resonanceStats,
          adjustedScore,
        }
      }),
    )

    return transits.sort((a, b) => (b.adjustedScore || 0) - (a.adjustedScore || 0)).slice(0, 5)
  } catch (error) {
    console.error("Error calculating real transits:", error)
    return calculateMockTransits(date, userId)
  }
}

function calculateMockTransits(date: Date, _userId?: string): Transit[] {
  const dayOfMonth = date.getDate()
  const numTransits = Math.min(3, Math.max(1, (dayOfMonth % 4) + 1))

  const selectedTransits = MOCK_TRANSITS.sort(() => Math.random() - 0.5).slice(0, numTransits)

  return selectedTransits.map((mockTransit) => {
    const interpretation = TRANSIT_LOOKUP[mockTransit.aspect]
    if (!interpretation) {
      return {
        transit_aspect: mockTransit.aspect,
        orb: mockTransit.orb,
        effect: "neutral" as const,
        interpretation: "Transit interpretation not available",
        do: ["Stay mindful of cosmic energies"],
        dont: ["Ignore your intuition"],
      }
    }

    return {
      transit_aspect: mockTransit.aspect,
      orb: mockTransit.orb,
      effect: interpretation.effect,
      interpretation: interpretation.interpretation,
      do: interpretation.do,
      dont: interpretation.dont,
    }
  })
}

export async function generateDailyForecast(
  date: Date,
  birthData?: BirthData,
  mbtiType?: MBTIType,
  userId?: string,
): Promise<DailyForecast> {
  const transits = birthData
    ? await calculateDailyTransits(date, birthData, userId)
    : calculateMockTransits(date, userId)

  const effects = transits.map((t) => t.effect)
  const dayRating = getDayRating(effects)

  let summary = ""
  let primaryTheme = ""
  let secondaryThemes: string[] = []
  let overallConfidence = 0.5

  if (birthData && transits.length > 0) {
    const aspectsForThemes: DetectedAspect[] = transits.map((t) => ({
      planet1: t.transit_aspect.split(" ")[0],
      planet2: t.transit_aspect.split(" ")[2],
      aspect: t.transit_aspect.split(" ")[1],
      orb: Number.parseFloat(t.orb.replace("°", "")),
      score: t.adjustedScore || t.score || 0, // Use adjusted score for theme assignment
    }))

    const themeAssignment = assignPrimaryAndSecondaryThemes(aspectsForThemes)
    primaryTheme = themeAssignment.primaryTheme
    secondaryThemes = themeAssignment.secondaryThemes

    if (userId && transits.some((t) => t.resonanceStats)) {
      const confidenceScores = transits
        .filter((t) => t.resonanceStats)
        .map((t) => t.resonanceStats!.personal?.confidence || t.resonanceStats!.global.confidence)

      overallConfidence =
        confidenceScores.length > 0
          ? confidenceScores.reduce((sum, conf) => sum + conf, 0) / confidenceScores.length
          : 0.5
    }
  }

  const confidenceModifier = overallConfidence > 0.7 ? "strong" : overallConfidence > 0.4 ? "moderate" : "emerging"

  if (
    effects.filter((e) => ["heavy", "intense", "volatile"].includes(e)).length >
    effects.filter((e) => ["positive", "productive", "energized"].includes(e)).length
  ) {
    summary = primaryTheme
      ? `${confidenceModifier.charAt(0).toUpperCase() + confidenceModifier.slice(1)} challenging ${primaryTheme} themes dominate today. Focus on patience and structure.`
      : `${confidenceModifier.charAt(0).toUpperCase() + confidenceModifier.slice(1)} challenging day with emotional tests and restrictions. Focus on patience and structure.`
  } else if (
    effects.filter((e) => ["positive", "productive", "energized"].includes(e)).length >
    effects.filter((e) => ["heavy", "intense", "volatile"].includes(e)).length
  ) {
    summary = primaryTheme
      ? `${confidenceModifier.charAt(0).toUpperCase() + confidenceModifier.slice(1)} favorable cosmic weather supports ${primaryTheme} growth and positive connections.`
      : `${confidenceModifier.charAt(0).toUpperCase() + confidenceModifier.slice(1)} favorable cosmic weather supports growth and positive connections.`
  } else {
    summary = primaryTheme
      ? `${confidenceModifier.charAt(0).toUpperCase() + confidenceModifier.slice(1)} mixed ${primaryTheme} energies today. Balance caution with optimism.`
      : `${confidenceModifier.charAt(0).toUpperCase() + confidenceModifier.slice(1)} mixed energies today. Balance caution with optimism.`
  }

  const forecast: DailyForecast = {
    date: date.toISOString().split("T")[0],
    day_rating: dayRating,
    summary,
    transits,
    primaryTheme,
    secondaryThemes,
    overallConfidence,
    personalizedForUser: userId,
  }

  if (mbtiType && primaryTheme) {
    const mbtiGuidance = applyMBTIOverlay(primaryTheme, mbtiType)

    forecast.mbti_overlay = {
      [mbtiType]: {
        translation: mbtiGuidance,
      },
    }
  }

  return forecast
}

export async function getWeeklyForecast(
  startDate: Date,
  birthData?: BirthData,
  mbtiType?: MBTIType,
  userId?: string,
): Promise<DailyForecast[]> {
  const forecasts: DailyForecast[] = []

  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    const forecast = await generateDailyForecast(date, birthData, mbtiType, userId)
    forecasts.push(forecast)
  }

  return forecasts
}

export async function getPersonalizedForecast(
  date: Date,
  userId: string,
  birthData?: BirthData,
  mbtiType?: MBTIType,
): Promise<DailyForecast & { learningInsights?: string }> {
  const forecast = await generateDailyForecast(date, birthData, mbtiType, userId)

  // Get user accuracy stats for learning insights
  try {
    const accuracyStats = await resonanceDB.getUserAccuracyStats(userId, 30)

    let learningInsights = ""
    if (accuracyStats.totalFeedbacks > 5) {
      if (accuracyStats.overallAccuracy > 0.8) {
        learningInsights = `Merlin has learned your patterns well (${Math.round(accuracyStats.overallAccuracy * 100)}% accuracy). Today's forecast is highly personalized.`
      } else if (accuracyStats.overallAccuracy > 0.6) {
        learningInsights = `Merlin is learning your cosmic patterns (${Math.round(accuracyStats.overallAccuracy * 100)}% accuracy). Keep providing feedback to improve personalization.`
      } else {
        learningInsights = `Merlin is still learning your unique patterns (${Math.round(accuracyStats.overallAccuracy * 100)}% accuracy). Your feedback helps improve future forecasts.`
      }
    } else {
      learningInsights =
        "Merlin is building your personal cosmic profile. Provide feedback to unlock personalized insights."
    }

    return { ...forecast, learningInsights }
  } catch (error) {
    console.error("Error getting learning insights:", error)
    return forecast
  }
}
