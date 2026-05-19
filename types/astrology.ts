export interface PlanetPosition {
  name: string;
  longitude: number;
  latitude: number;
  distance: number;
  speed?: number;
  sign: string;
  degree: number;
  minute: number;
  second?: number;
  house?: number;
  dignities?: Dignity[];
  retrograde?: boolean;
}

export interface HousePosition {
  house: number;
  position?: number; // Made optional for backward compatibility
  sign: string;
  degree: number;
  minute: number;
  second?: number;
  longitude?: number; // New field to replace position
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
  exact?: boolean;
  applying?: boolean;
  separating?: boolean;
  influence?: "positive" | "negative" | "neutral";
}

export interface BaseChartData {
  positions: PlanetPosition[];
  houses: HousePosition[];
  aspects: Aspect[];
}

export interface ChartData extends BaseChartData {}

export interface BirthChartData extends BaseChartData {
  jd: number;
  planets: PlanetPosition[]; // Alias for positions for compatibility
  ascendant: {
    longitude: number;
    sign: string;
    degree: number;
    minute: number;
  };
  mc: { longitude: number; sign: string; degree: number; minute: number };
  aspectPatterns: AspectPattern[];
  midpoints: Midpoint[];
  fixedStars: FixedStar[];
  karmic: KarmicIndicator[];
  progressed: ProgressedChart;
  electional: ElectionalWindow[];
  moonPhase: LunarPhase;
  transits: Transit[];
  houseSystem?: {
    cusps: number[];
    ascendant: number;
    mc: number;
    vertex: number;
  };
  birthData: {
    birthDate: string;
    birthTime?: string;
    coordinates?: {
      lat: number;
      lon: number;
    };
  };
}

export interface Dignity {
  type:
    | "Domicile"
    | "Exaltation"
    | "Detriment"
    | "Fall"
    | "Triplicity"
    | "Term"
    | "Face";
  score: number;
  description: string;
}

export interface AspectPattern {
  type:
    | "Grand Trine"
    | "T-Square"
    | "Grand Cross"
    | "Kite"
    | "Mystic Rectangle"
    | "Yod"
    | "Stellium";
  planets: string[];
  description: string;
  strength: number;
  focalPlanet?: string;
  quality: "harmonious" | "dynamic" | "tense" | "complex";
}

export interface Midpoint {
  point1: string;
  point2: string;
  position: number;
  sign: string;
  degree: number;
  minute: number;
  second?: number;
  planetAspects: Array<{
    planet: string;
    aspect: string;
    orb: number;
    influence: "positive" | "negative" | "neutral";
  }>;
  interpretation?: string;
}

export interface FixedStar {
  name: string;
  position: number;
  magnitude: number;
  constellation: string;
  nature: string[];
  orb: number;
  aspect?: {
    type: string;
    planet: string;
    planetPosition: number;
    difference: number;
    influence: string;
  };
}

export interface KarmicIndicator {
  type:
    | "North Node"
    | "South Node"
    | "Chiron"
    | "Lilith"
    | "Vertex"
    | "Part of Fortune";
  position: number;
  sign: string;
  house: number;
  aspects: Array<{
    planet: string;
    aspect: string;
    orb: number;
    karmicMeaning: string;
  }>;
  interpretation: string;
  lessons: string[];
}

export interface ProgressedChart {
  date: string;
  positions: PlanetPosition[];
  aspects: Aspect[];
  solarReturn: boolean;
  lunarReturn: boolean;
  progressedMoon: {
    phase: string;
    sign: string;
    house: number;
  };
  progressedSun: {
    sign: string;
    house: number;
    returnDate?: string;
  };
}

export interface Transit {
  transitingPlanet: string;
  natalPlanet: string;
  aspect: string;
  orb: number;
  exact: boolean;
  applying: boolean;
  separating: boolean;
  currentPosition: number;
  natalPosition: number;
  starts: string;
  peaks: string;
  ends: string;
  intensity: "weak" | "moderate" | "strong";
  theme: string;
}

export interface ElectionalWindow {
  start: string;
  end: string;
  score: number;
  aspects: Array<{
    type: string;
    planet1: string;
    planet2: string;
    orb: number;
    influence: "positive" | "negative" | "neutral";
  }>;
  moonPhase: string;
  moonSign: string;
  voidOfCourse: boolean;
  moonVoidStart?: string;
  moonVoidEnd?: string;
  retrogrades: string[];
  recommendedFor: string[];
  avoidFor: string[];
  overallQuality: "excellent" | "good" | "fair" | "poor";
}

export interface LunarPhase {
  type:
    | "New Moon"
    | "Waxing Crescent"
    | "First Quarter"
    | "Waxing Gibbous"
    | "Full Moon"
    | "Waning Gibbous"
    | "Last Quarter"
    | "Waning Crescent";
  phase: string;
  illumination: number;
  angle: number;
  nextNewMoon: string;
  nextFullMoon: string;
  nextEclipse?: {
    type: "Solar" | "Lunar";
    date: string;
    saros: number;
    visibility: string;
    magnitude: number;
  };
}

export interface RelocationChart {
  location: {
    name: string;
    lat: number;
    lng: number;
    timezone?: string;
  };
  angles: {
    ascendant: number;
    midheaven: number;
    descendant: number;
    ic: number;
  };
  relocatedPlanets: PlanetPosition[];
  aspects: Aspect[];
  relocatedHouses: HousePosition[];
  astrocartographyLines: Array<{
    planet: string;
    type: "MC" | "IC" | "ASC" | "DSC";
    line: Array<{ lat: number; lng: number; strength: number }>;
    influence: string;
  }>;
}

export interface EclipseData {
  type: "Solar" | "Lunar";
  date: string;
  time: string;
  visibility: string[];
  saros: number;
  magnitude: number;
  path?: {
    type: "total" | "annular" | "partial" | "penumbral";
    coordinates: Array<{ lat: number; lng: number; time: string }>;
  };
  astrologicalSignificance: {
    zodiacSign: string;
    house: number;
    aspects: Array<{
      planet: string;
      aspect: string;
      orb: number;
      meaning: string;
    }>;
  };
}

export type LifeDomain =
  | 'identity'
  | 'career'
  | 'relationships'
  | 'finances'
  | 'mental_strain'
  | 'creativity'
  | 'spiritual_growth'
  | 'social_connection'
  | 'reinvention';

export interface TransitDriver {
  transitId: string;
  label: string;
  strength: number;
  confidence: number;
  reason: string;
}

export interface DomainScore {
  domain: LifeDomain;
  pressure: number;
  volatility: number;
  confidence: number;
  topDrivers: TransitDriver[];
}

export interface ArchetypeSignal {
  key: string;
  title: string;
  intensity: number;
  rationale: string;
}

export interface SafetyGuidance {
  grounding: string[];
  caution: string[];
  agency: string[];
  supportPrompt?: string;
}

export interface ExplainabilityPacket {
  windowStartIso: string;
  windowEndIso: string;
  globalPressure: number;
  confidence: number;
  topDrivers: TransitDriver[];
  weightingBreakdown: Record<string, number>;
  personalizationBreakdown: Record<string, number>;
  domainScores: DomainScore[];
  archetypes: ArchetypeSignal[];
  safety: SafetyGuidance;
}
