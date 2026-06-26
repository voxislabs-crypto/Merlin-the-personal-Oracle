import type { BirthChartData } from '@/types/astrology';

export interface SolarReturnBriefing {
  returnDate: string;
  returnTime: string;
  returnYear: number;
  daysToReturn: number;
  daysSinceReturn: number;
  isBirthdayWindow: boolean;
  ascendantSign: string;
  sunSign: string;
  moonSign: string;
  highlights: string[];
  annualTheme: string;
  profectionTheme: string;
  chart: Pick<BirthChartData, 'positions' | 'ascendant' | 'mc' | 'houses'>;
}

export type LunarEmotionalTone = 'supportive' | 'volatile' | 'reflective' | 'open';

export interface LunarReturnWeather {
  returnDate: string;
  returnTime: string;
  nextReturnDate: string;
  daysIntoCycle: number;
  daysUntilNextReturn: number;
  moonSign: string;
  ascendantSign: string;
  emotionalTone: LunarEmotionalTone;
  headline: string;
  guidance: string;
  highlights: string[];
}

export interface ReturnsPacket {
  solarReturn: SolarReturnBriefing | null;
  lunarReturn: LunarReturnWeather | null;
}