// House System Toggle - Support for Placidus, Whole Sign, Equal
import { BirthChartData, HousePosition } from "@/types/astrology";

export type HouseSystem = "Placidus" | "Whole Sign" | "Equal";

export interface HouseSystemConfig {
  system: HouseSystem;
  description: string;
  bestFor: string;
}

export const HOUSE_SYSTEMS: Record<HouseSystem, HouseSystemConfig> = {
  Placidus: {
    system: "Placidus",
    description: "Most popular modern system. Time-based, unequal houses.",
    bestFor: "Psychological astrology, personal growth work",
  },
  "Whole Sign": {
    system: "Whole Sign",
    description: "Ancient system. One sign = one house. Simple, clean.",
    bestFor: "Traditional astrology, predictive work, beginners",
  },
  Equal: {
    system: "Equal",
    description: "Each house is exactly 30°. ASC = 1st house cusp.",
    bestFor: "Systems-based readings, theoretical work",
  },
};

// Convert degrees to zodiac sign
function degreeToSign(degree: number): { sign: string; degree: number; minute: number } {
  const signs = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
  ];

  const normalizedDegree = ((degree % 360) + 360) % 360;
  const signIndex = Math.floor(normalizedDegree / 30);
  const degreeInSign = normalizedDegree % 30;
  const minuteInSign = Math.floor((degreeInSign % 1) * 60);

  return {
    sign: signs[signIndex],
    degree: Math.floor(degreeInSign),
    minute: minuteInSign,
  };
}

// Calculate Whole Sign houses
export function calculateWholeSignHouses(ascendantLongitude: number): HousePosition[] {
  const houses: HousePosition[] = [];

  // Whole Sign: Ascendant's sign becomes the entire 1st house
  // Each subsequent sign is the next house
  const ascSignIndex = Math.floor(ascendantLongitude / 30);

  for (let i = 0; i < 12; i++) {
    const signIndex = (ascSignIndex + i) % 12;
    const houseCuspLongitude = signIndex * 30; // Start of sign

    const signData = degreeToSign(houseCuspLongitude);

    houses.push({
      house: i + 1,
      longitude: houseCuspLongitude,
      sign: signData.sign,
      degree: 0, // Always 0° for whole sign
      minute: 0,
    });
  }

  return houses;
}

// Calculate Equal houses
export function calculateEqualHouses(ascendantLongitude: number): HousePosition[] {
  const houses: HousePosition[] = [];

  for (let i = 0; i < 12; i++) {
    const houseCuspLongitude = (ascendantLongitude + i * 30) % 360;
    const signData = degreeToSign(houseCuspLongitude);

    houses.push({
      house: i + 1,
      longitude: houseCuspLongitude,
      sign: signData.sign,
      degree: signData.degree,
      minute: signData.minute,
    });
  }

  return houses;
}

// Calculate Placidus houses (complex, latitude-dependent)
// This is a simplified version - full Placidus requires spherical trigonometry
export function calculatePlacidusHouses(
  ascendantLongitude: number,
  mcLongitude: number,
  latitude: number
): HousePosition[] {
  // For now, use a simplified Placidus approximation
  // Full implementation would require RAMC, obliquity, etc.
  
  // This is a placeholder that generates unequal houses based on ASC and MC
  const houses: HousePosition[] = [];

  // Houses 1, 4, 7, 10 are angular (ASC, IC, DSC, MC)
  const asc = ascendantLongitude;
  const mc = mcLongitude;
  const dsc = (asc + 180) % 360;
  const ic = (mc + 180) % 360;

  // Simplified Placidus: interpolate between angles
  // This is not astronomically accurate but demonstrates the concept
  
  const angularPoints = [asc, ic, dsc, mc];
  
  for (let i = 0; i < 12; i++) {
    let houseCuspLongitude: number;

    if (i === 0) houseCuspLongitude = asc;
    else if (i === 3) houseCuspLongitude = ic;
    else if (i === 6) houseCuspLongitude = dsc;
    else if (i === 9) houseCuspLongitude = mc;
    else {
      // Interpolate between angular houses
      const quadrant = Math.floor(i / 3);
      const positionInQuadrant = i % 3;
      
      const startAngle = angularPoints[quadrant];
      const endAngle = angularPoints[(quadrant + 1) % 4];
      
      // Handle 360° wrap
      let span = endAngle - startAngle;
      if (span < 0) span += 360;
      
      // Divide quadrant into 3 unequal parts (simplified)
      const fraction = positionInQuadrant / 3;
      houseCuspLongitude = (startAngle + span * fraction) % 360;
    }

    const signData = degreeToSign(houseCuspLongitude);

    houses.push({
      house: i + 1,
      longitude: houseCuspLongitude,
      sign: signData.sign,
      degree: signData.degree,
      minute: signData.minute,
    });
  }

  return houses;
}

// Main function: Recompute houses with specified system
export function recomputeHouses(
  chartData: BirthChartData,
  houseSystem: HouseSystem
): HousePosition[] {
  const ascendantLongitude = chartData.ascendant?.longitude;
  const mcLongitude = chartData.mc?.longitude;
  const latitude = chartData.birthData?.coordinates?.lat;

  if (!ascendantLongitude) {
    throw new Error("Ascendant longitude is required to compute houses");
  }

  switch (houseSystem) {
    case "Whole Sign":
      return calculateWholeSignHouses(ascendantLongitude);

    case "Equal":
      return calculateEqualHouses(ascendantLongitude);

    case "Placidus":
      if (!mcLongitude || latitude === undefined) {
        throw new Error("MC and latitude required for Placidus houses");
      }
      return calculatePlacidusHouses(ascendantLongitude, mcLongitude, latitude);

    default:
      throw new Error(`Unknown house system: ${houseSystem}`);
  }
}

// Reassign planets to houses after house system change
export function reassignPlanetHouses(
  chartData: BirthChartData,
  newHouses: HousePosition[]
): BirthChartData {
  const updatedPlanets = chartData.positions.map((planet) => {
    const planetLongitude = planet.longitude;

    // Find which house the planet falls into
    let houseNumber = 1;
    
    for (let i = 0; i < newHouses.length; i++) {
      const currentHouse = newHouses[i];
      const nextHouse = newHouses[(i + 1) % 12];

      let currentCusp = currentHouse.longitude || 0;
      let nextCusp = nextHouse.longitude || 0;

      // Handle 360° wrap
      if (nextCusp < currentCusp) nextCusp += 360;
      let adjustedPlanetLon = planetLongitude;
      if (adjustedPlanetLon < currentCusp) adjustedPlanetLon += 360;

      if (adjustedPlanetLon >= currentCusp && adjustedPlanetLon < nextCusp) {
        houseNumber = currentHouse.house;
        break;
      }
    }

    return {
      ...planet,
      house: houseNumber,
    };
  });

  return {
    ...chartData,
    positions: updatedPlanets,
    houses: newHouses,
  };
}

// Get description of house system
export function getHouseSystemDescription(system: HouseSystem): string {
  return HOUSE_SYSTEMS[system].description;
}

// Get best use case for house system
export function getHouseSystemBestFor(system: HouseSystem): string {
  return HOUSE_SYSTEMS[system].bestFor;
}
