import { assembleAtmosphereInput } from '@/lib/atmosphere/assemble-input';
import { computeAtmosphere } from '@/lib/atmosphere/compute';
import { buildAtmosphereTemporalInput } from '@/lib/atmosphere/temporal-context';
import type { AtmospherePatternProfile } from '@/lib/atmosphere/pattern-types';
import type { AtmospherePacket, AtmosphereRealityCheckInput } from '@/lib/atmosphere/types';
import type { PressureWindowData } from '@/hooks/usePressureWindow';
import type { DailyForecast } from '@/hooks/useForecast';
import type { StormsReport } from '@/hooks/useStorms';
import type { BirthChartData } from '@/types/astrology';

export function computeAtmosphereFromDashboardSources(options: {
  date?: string;
  pressureWindow?: PressureWindowData | null;
  forecast?: DailyForecast | null;
  stormsReport?: StormsReport | null;
  moonPhase?: string;
  moonSign?: string;
  chartData?: BirthChartData | null;
  birthDate?: string;
  realityCheck?: AtmosphereRealityCheckInput | null;
  patternProfile?: AtmospherePatternProfile | null;
}): AtmospherePacket | null {
  const { pressureWindow, forecast, stormsReport } = options;
  if (!pressureWindow && !forecast && !stormsReport) {
    return null;
  }

  const temporal = buildAtmosphereTemporalInput({
    ascendantSign: options.chartData?.ascendant?.sign,
    birthDate: options.birthDate,
    natalPlanets: options.chartData?.positions || options.chartData?.planets,
    ascendantLongitude: options.chartData?.ascendant?.longitude,
    mcLongitude: options.chartData?.mc?.longitude,
  });

  const activeTransits =
    pressureWindow?.predictive?.events?.slice(0, 5).map((event) => ({
      transitingPlanet: event.transit?.transitingPlanet,
      natalPlanet: event.transit?.natalPlanet,
      aspect: event.transit?.aspect,
      label: event.transit
        ? `${event.transit.transitingPlanet} ${event.transit.aspect} ${event.transit.natalPlanet}`
        : undefined,
    })) || [];

  return computeAtmosphere(
    assembleAtmosphereInput({
      date: options.date || forecast?.date,
      temporal,
      explainability: pressureWindow?.explainability ?? null,
      predictive: pressureWindow?.predictive
        ? {
            events: pressureWindow.predictive.events?.map((event) => ({
              eventId: event.eventId,
              scores: event.scores,
              transit: event.transit,
              narrative: event.narrative,
            })),
            lunarTiming: {
              phase: pressureWindow.predictive.lunarTiming?.phase,
              illumination: pressureWindow.predictive.lunarTiming?.illumination,
              actionBias: pressureWindow.predictive.lunarTiming?.actionBias,
              guidance: pressureWindow.predictive.lunarTiming?.guidance,
            },
            progressedMoon: pressureWindow.predictive.progressedMoon,
          }
        : null,
      storms: stormsReport
        ? {
            storms: stormsReport.storms?.map((storm) => ({
              title: storm.title,
              intensity: storm.intensity,
              intensityScore: storm.intensityScore,
              transitingPlanet: storm.transitingPlanet,
              natalPlanet: storm.natalPlanet,
              aspect: storm.aspect,
              description: storm.description,
            })),
            weekSummary: stormsReport.weekSummary,
          }
        : null,
      forecast: forecast
        ? {
            day_rating: forecast.day_rating,
            planetaryHighlights: forecast.planetaryHighlights,
            summary: forecast.summary,
          }
        : null,
      calibration:
        pressureWindow?.calibrationProvenance &&
        pressureWindow.calibrationProvenance.feedbackCount >= 3
          ? {
              feedbackCount: pressureWindow.calibrationProvenance.feedbackCount,
              strongestPlanet: pressureWindow.calibrationProvenance.strongestPlanet,
              strongestMultiplier: pressureWindow.calibrationProvenance.strongestMultiplier,
            }
          : undefined,
      moonPhase: options.moonPhase || forecast?.moonPhase,
      moonSign: options.moonSign || forecast?.moonSign,
      realityCheck: options.realityCheck ?? null,
      patterns: {
        profile: options.patternProfile ?? null,
        activeTransits,
      },
    })
  );
}