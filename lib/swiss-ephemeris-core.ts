// Swiss Ephemeris Core - Astronomical calculations using Swiss Ephemeris library
// Provides planetary position calculations with graceful fallback
// Note: This runs server-side in API routes (swisseph is a native Node.js module)

export interface PlanetPositions {
  sun: { longitude: number; latitude: number; distance: number; speedLongitude: number }
  moon: { longitude: number; latitude: number; distance: number; speedLongitude: number }
  mercury: { longitude: number; latitude: number; distance: number; speedLongitude: number }
  venus: { longitude: number; latitude: number; distance: number; speedLongitude: number }
  mars: { longitude: number; latitude: number; distance: number; speedLongitude: number }
  jupiter: { longitude: number; latitude: number; distance: number; speedLongitude: number }
  saturn: { longitude: number; latitude: number; distance: number; speedLongitude: number }
  uranus: { longitude: number; latitude: number; distance: number; speedLongitude: number }
  neptune: { longitude: number; latitude: number; distance: number; speedLongitude: number }
  pluto: { longitude: number; latitude: number; distance: number; speedLongitude: number }
  meanNode: { longitude: number; latitude: number; distance: number; speedLongitude: number }
  trueNode: { longitude: number; latitude: number; distance: number; speedLongitude: number }
}

// Try to load swisseph dynamically
let swisseph: any = null
try {
  swisseph = require("swisseph")
  console.log("[swiss-ephemeris-core] swisseph loaded successfully")
} catch {
  console.warn("[swiss-ephemeris-core] swisseph not available, will use fallback mock data")
}

// Planet numbers for Swiss Ephemeris
const PLANET_NUMBERS = {
  SUN: 0,
  MOON: 1,
  MERCURY: 2,
  VENUS: 3,
  MARS: 4,
  JUPITER: 5,
  SATURN: 6,
  URANUS: 7,
  NEPTUNE: 8,
  PLUTO: 9,
  MEAN_NODE: 10,
  TRUE_NODE: 11,
}

/**
 * Convert a date to Julian Day number
 */
export function toJulianDay(year: number, month: number, day: number, hour: number = 12, minute: number = 0): number {
  // Convert time to decimal hours
  const decimalHour = hour + minute / 60

  // Julian Day calculation (standard astronomical formula)
  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3

  const jdn =
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045

  // Add the time fraction
  return jdn + (decimalHour - 12) / 24
}

/**
 * Get planetary positions for a given date
 * Uses Swiss Ephemeris if available, otherwise generates mock data
 */
export async function getPlanetPositions(date: Date): Promise<PlanetPositions> {
  if (!swisseph) {
    console.log("[swiss-ephemeris-core] Using mock positions")
    return generateMockPositions(date)
  }

  try {
    const year = date.getFullYear()
    const month = date.getMonth() + 1 // JS months are 0-indexed
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()

    const julianDay = toJulianDay(year, month, day, hour, minute)

    // Calculate positions for all planets
    const calculatePlanet = (planetNum: number) => {
      const flag = swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED
      const result = swisseph.swe_calc_ut(julianDay, planetNum, flag)

      if (result.error) {
        throw new Error(`swisseph calculation error for planet ${planetNum}: ${result.error}`)
      }

      return {
        longitude: result.longitude,
        latitude: result.latitude,
        distance: result.distance,
        speedLongitude: result.longitudeSpeed,
      }
    }

    return {
      sun: calculatePlanet(PLANET_NUMBERS.SUN),
      moon: calculatePlanet(PLANET_NUMBERS.MOON),
      mercury: calculatePlanet(PLANET_NUMBERS.MERCURY),
      venus: calculatePlanet(PLANET_NUMBERS.VENUS),
      mars: calculatePlanet(PLANET_NUMBERS.MARS),
      jupiter: calculatePlanet(PLANET_NUMBERS.JUPITER),
      saturn: calculatePlanet(PLANET_NUMBERS.SATURN),
      uranus: calculatePlanet(PLANET_NUMBERS.URANUS),
      neptune: calculatePlanet(PLANET_NUMBERS.NEPTUNE),
      pluto: calculatePlanet(PLANET_NUMBERS.PLUTO),
      meanNode: calculatePlanet(PLANET_NUMBERS.MEAN_NODE),
      trueNode: calculatePlanet(PLANET_NUMBERS.TRUE_NODE),
    }
  } catch (error) {
    console.error("[swiss-ephemeris-core] Error calculating with swisseph:", error)
    return generateMockPositions(date)
  }
}

/**
 * Generate mock planetary positions for testing
 * Uses simple cyclic formulas based on approximate planetary periods
 */
function generateMockPositions(date: Date): PlanetPositions {
  const daysSinceEpoch = date.getTime() / (1000 * 60 * 60 * 24)

  // Simple mock calculation based on rough orbital periods
  const mockPosition = (periodDays: number, startLongitude: number = 0) => {
    const longitude = ((daysSinceEpoch / periodDays) * 360 + startLongitude) % 360
    return {
      longitude,
      latitude: 0,
      distance: 1.0,
      speedLongitude: 360 / periodDays,
    }
  }

  return {
    sun: mockPosition(365.25, 0),
    moon: mockPosition(27.32, 90),
    mercury: mockPosition(87.97, 30),
    venus: mockPosition(224.7, 60),
    mars: mockPosition(686.98, 120),
    jupiter: mockPosition(4332.59, 180),
    saturn: mockPosition(10759.22, 240),
    uranus: mockPosition(30688.5, 300),
    neptune: mockPosition(60182, 330),
    pluto: mockPosition(90560, 15),
    meanNode: mockPosition(6798.38, 180), // Lunar nodes
    trueNode: mockPosition(6798.38, 180),
  }
}
