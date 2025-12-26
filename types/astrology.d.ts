// Astrology type definitions

export interface PlanetPosition {
  name: string;
  longitude: number;
  latitude: number;
  distance: number;
  sign: string;
  degree: number;
  minute: number;
  house: number;
  dignities?: string[];
}

export interface HousePosition {
  house: number;
  position: number;
  sign: string;
  degree: number;
  minute: number;
}

export interface Aspect {
  planet1: {
    name: string;
    longitude: number;
    latitude?: number;
    distance?: number;
    sign?: string;
    degree?: number;
    minute?: number;
    house?: number;
  };
  planet2: {
    name: string;
    longitude: number;
    latitude?: number;
    distance?: number;
    sign?: string;
    degree?: number;
    minute?: number;
    house?: number;
  };
  type: string;
  orb?: number;
}

export interface ChartData {
  positions: PlanetPosition[];
  houses: HousePosition[];
  aspects: Aspect[];
}

export interface BirthChartInput {
  birthDate: string;
  birthTime: string;
  lat: number;
  lon: number;
  houseSystem?: string;
  zodiac?: string;
  orb?: number;
}

export interface BirthChartResponse {
  success: boolean;
  data?: ChartData;
  error?: string;
}

export interface ChartCalculationParams {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  latitude: number;
  longitude: number;
  houseSystem?: string;
  zodiac?: string;
  orb?: number;
}
