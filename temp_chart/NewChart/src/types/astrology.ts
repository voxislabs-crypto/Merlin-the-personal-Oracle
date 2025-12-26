export interface PlanetPosition {
  name: string;
  glyph: string;
  angle: number;
  sign: string;
  degree: number;
  element: "Fire" | "Earth" | "Air" | "Water";
  color: string;
  orbitalDistance: number;
}

export interface AspectLine {
  from: string;
  to: string;
  type: "conjunction" | "opposition" | "trine" | "square" | "sextile";
  angle: number;
  color: string;
  label: string;
}

export interface ZodiacSign {
  name: string;
  glyph: string;
  startAngle: number;
  element: "Fire" | "Earth" | "Air" | "Water";
}

export interface ChartData {
  planets: PlanetPosition[];
  aspects: AspectLine[];
  ascendant: number;
  midheaven: number;
  houses: number[];
}
