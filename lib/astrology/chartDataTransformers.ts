import type { PlanetPosition, HousePosition, Aspect } from '@/types/astrology';

export interface TransformedPlanet {
  name: string;
  sign: string;
  degree: number;
  minute: number;
  second: number;
  house: number;
  latitude: number;
  longitude: number;
  distance: number;
  speed: number;
  dignities?: string[];
}

export interface TransformedHouse extends HousePosition {
  house: number;
  sign: string;
  degree: number;
  minute: number;
  second?: number;
  position?: number; // For backward compatibility
  longitude: number;
}

export interface TransformedAspect extends Omit<Aspect, 'planet1' | 'planet2'> {
  planet1: string;
  planet2: string;
  type: string;
  orb: number;
  exact?: boolean;
  influence: 'positive' | 'negative' | 'neutral';
}

export interface TransformedChartData {
  planets: TransformedPlanet[];
  houses: TransformedHouse[];
  aspects: TransformedAspect[];
  metadata?: {
    houseSystem: string;
    zodiac: string;
  };
}

export function transformChartData(data: any): TransformedChartData {
  if (!data) {
    return { planets: [], houses: [], aspects: [] };
  }

  // Transform planets
  const planets: TransformedPlanet[] = (data.planets || []).map((planet: any) => ({
    ...planet,
    latitude: planet.latitude || 0,
    distance: planet.distance || 1,
    speed: planet.speed || 0,
    second: planet.second || 0,
  }));

  // Transform houses
  const houses: TransformedHouse[] = (data.houses || []).map((house: any) => {
    const longitude = house.longitude ?? house.position ?? 0;
    return {
      ...house,
      longitude,
      position: longitude, // Keep for backward compatibility
      degree: house.degree ?? 0,
      minute: house.minute ?? 0,
      second: house.second ?? 0,
    };
  });

  // Transform aspects
  const aspects: TransformedAspect[] = (data.aspects || []).map((aspect: any) => {
    // Handle both string and object planet references
    const planet1 = typeof aspect.planet1 === 'string' 
      ? aspect.planet1 
      : aspect.planet1?.name || '';
      
    const planet2 = typeof aspect.planet2 === 'string' 
      ? aspect.planet2 
      : aspect.planet2?.name || '';

    return {
      ...aspect,
      planet1,
      planet2,
      type: aspect.type || '',
      orb: aspect.orb || 0,
      influence: aspect.influence || 'neutral',
    };
  });

  return {
    planets,
    houses,
    aspects,
    metadata: data.metadata,
  };
}

// Helper function to get planet by name
export function getPlanetByName(planets: TransformedPlanet[], name: string): TransformedPlanet | undefined {
  return planets.find(p => p.name === name);
}

// Helper function to get house by number
export function getHouseByNumber(houses: TransformedHouse[], houseNumber: number): TransformedHouse | undefined {
  return houses.find(h => h.house === houseNumber);
}
