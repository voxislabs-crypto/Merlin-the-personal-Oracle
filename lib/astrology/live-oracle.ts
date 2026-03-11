import type { BirthData } from '@/components/astrology/BirthChartCalculator';
import { calculateForecastClient, calculateTransitsClient, type ClientDailyForecast } from '@/lib/astrology/client-insights';

export interface LiveOracleLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface LiveOracleSnapshot {
  timestamp: string;
  intervalMinutes: number;
  location: LiveOracleLocation;
  forecast: ClientDailyForecast;
  transitSummary: {
    total: number;
    exact: number;
    approaching: number;
  };
  advice: string;
}

function formatCoord(value: number): string {
  return value.toFixed(3);
}

function buildRelocatedBirthData(baseBirthData: BirthData, location: LiveOracleLocation): BirthData {
  return {
    ...baseBirthData,
    latitude: location.latitude,
    longitude: location.longitude,
  };
}

function composeAdvice(
  forecast: ClientDailyForecast,
  location: LiveOracleLocation,
  transitSummary: LiveOracleSnapshot['transitSummary']
): string {
  const locationText = `At ${formatCoord(location.latitude)}, ${formatCoord(location.longitude)}`;

  if (transitSummary.exact >= 3) {
    return `${locationText}, your sky is highly active with ${transitSummary.exact} exact transit alignments. ${forecast.advice}`;
  }

  if (forecast.day_rating === 'Very Challenging' || forecast.day_rating === 'Challenging') {
    return `${locationText}, the current transit tone is intense. ${forecast.advice}`;
  }

  if (forecast.day_rating === 'Very Positive' || forecast.day_rating === 'Positive') {
    return `${locationText}, momentum is on your side right now. ${forecast.advice}`;
  }

  return `${locationText}, the cosmic weather is steady. ${forecast.advice}`;
}

export async function generateLiveOracleSnapshot(
  birthData: BirthData,
  location: LiveOracleLocation,
  intervalMinutes: number
): Promise<LiveOracleSnapshot> {
  const relocated = buildRelocatedBirthData(birthData, location);
  const [forecast, transitData] = await Promise.all([
    calculateForecastClient(relocated),
    calculateTransitsClient(relocated),
  ]);

  return {
    timestamp: new Date().toISOString(),
    intervalMinutes,
    location,
    forecast,
    transitSummary: transitData.summary,
    advice: composeAdvice(forecast, location, transitData.summary),
  };
}
