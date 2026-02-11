// Aspect Detection - Detects astrological aspects between planets

import type { PlanetPositions } from "./swiss-ephemeris-core"

export interface AspectDefinition {
  name: string
  angle: number
  orb: number
}

export interface DetectedAspect {
  planet1: string
  planet2: string
  aspect: string
  orb: number
  score?: number
  intensity?: "high" | "medium" | "low"
  confidence?: number
  resonanceScore?: number
}

export const aspects: AspectDefinition[] = [
  { name: "Conjunction", angle: 0, orb: 10 },
  { name: "Sextile", angle: 60, orb: 6 },
  { name: "Square", angle: 90, orb: 8 },
  { name: "Trine", angle: 120, orb: 8 },
  { name: "Opposition", angle: 180, orb: 10 },
]

export const defaultAspectWeights: Record<string, number> = {
  Conjunction: 1.0,
  Opposition: 0.9,
  Square: 0.8,
  Trine: 0.7,
  Sextile: 0.6,
}

export const planetWeights: Record<string, number> = {
  sun: 1.0,
  moon: 1.0,
  mercury: 0.7,
  venus: 0.8,
  mars: 0.8,
  jupiter: 0.9,
  saturn: 0.9,
  uranus: 0.7,
  neptune: 0.6,
  pluto: 0.7,
  meanNode: 0.5,
  trueNode: 0.5,
}

/**
 * Get a unique ID for an aspect
 */
function getAspectId(planet1: string, planet2: string, aspect: string): string {
  // Sort planets alphabetically for consistency
  const [p1, p2] = [planet1, planet2].sort()
  return `${p1}_${aspect}_${p2}`
}

/**
 * Calculate the angular difference between two longitudes
 */
function angularDifference(lon1: number, lon2: number): number {
  let diff = Math.abs(lon1 - lon2)
  if (diff > 180) {
    diff = 360 - diff
  }
  return diff
}

/**
 * Detect aspects between planets
 */
export function detectAspects(positions: PlanetPositions): DetectedAspect[] {
  const detected: DetectedAspect[] = []
  const planetNames = Object.keys(positions) as Array<keyof PlanetPositions>

  // Check all planet pairs
  for (let i = 0; i < planetNames.length; i++) {
    for (let j = i + 1; j < planetNames.length; j++) {
      const planet1 = planetNames[i]
      const planet2 = planetNames[j]

      const pos1 = positions[planet1]
      const pos2 = positions[planet2]

      const angleDiff = angularDifference(pos1.longitude, pos2.longitude)

      // Check each aspect type
      for (const aspect of aspects) {
        const aspectDiff = Math.abs(angleDiff - aspect.angle)

        if (aspectDiff <= aspect.orb) {
          // Calculate strength (1.0 = exact, 0.0 = at orb edge)
          const strength = 1 - aspectDiff / aspect.orb

          // Calculate score based on aspect weight, planet weights, and strength
          const aspectWeight = defaultAspectWeights[aspect.name] || 0.5
          const p1Weight = planetWeights[planet1] || 0.5
          const p2Weight = planetWeights[planet2] || 0.5
          const score = aspectWeight * p1Weight * p2Weight * strength

          // Calculate confidence based on orb
          const confidence = Math.max(0.1, 1 - aspectDiff / (aspect.orb * 1.5))

          // Determine intensity
          let intensity: "high" | "medium" | "low" = "low"
          if (aspectDiff <= aspect.orb * 0.33) intensity = "high"
          else if (aspectDiff <= aspect.orb * 0.66) intensity = "medium"

          detected.push({
            planet1,
            planet2,
            aspect: aspect.name,
            orb: parseFloat(aspectDiff.toFixed(2)),
            score: parseFloat(score.toFixed(4)),
            intensity,
            confidence: parseFloat(confidence.toFixed(2)),
          })
        }
      }
    }
  }

  // Sort by score (highest first)
  return detected.sort((a, b) => (b.score || 0) - (a.score || 0))
}

/**
 * Helper to prioritize aspects (return top N)
 */
export function prioritizeAspects(aspects: DetectedAspect[], count: number = 5): DetectedAspect[] {
  return aspects.slice(0, count)
}

/**
 * Get aspect color for UI display
 */
export function getAspectColor(aspectName: string): string {
  const colors: Record<string, string> = {
    Conjunction: "#8B5CF6", // purple
    Opposition: "#EF4444", // red
    Square: "#F59E0B", // amber
    Trine: "#10B981", // green
    Sextile: "#3B82F6", // blue
  }
  return colors[aspectName] || "#6B7280" // gray default
}

/**
 * Format aspect for display
 */
export function formatAspect(aspect: DetectedAspect): string {
  const planet1 = aspect.planet1.charAt(0).toUpperCase() + aspect.planet1.slice(1)
  const planet2 = aspect.planet2.charAt(0).toUpperCase() + aspect.planet2.slice(1)
  return `${planet1} ${aspect.aspect} ${planet2}`
}
