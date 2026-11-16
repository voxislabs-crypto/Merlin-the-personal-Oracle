export const CHART_SOURCE_SWISS = 'swiss-real' as const;
export const CHART_SOURCE_MOCK = 'mock-fallback' as const;

export type ChartCalculationSource = typeof CHART_SOURCE_SWISS | typeof CHART_SOURCE_MOCK;

export class EphemerisUnavailableError extends Error {
  constructor(message = 'Swiss ephemeris is unavailable') {
    super(message);
    this.name = 'EphemerisUnavailableError';
  }
}

export function swissChartMetadata(): {
  calculationSource: typeof CHART_SOURCE_SWISS;
  ephemeris: 'Swiss real';
} {
  return { calculationSource: CHART_SOURCE_SWISS, ephemeris: 'Swiss real' };
}

export function mockChartMetadata(): {
  calculationSource: typeof CHART_SOURCE_MOCK;
  ephemeris: 'Mock';
} {
  return { calculationSource: CHART_SOURCE_MOCK, ephemeris: 'Mock' };
}

export function readChartCalculationSource(
  chart: { metadata?: { calculationSource?: unknown } } | null | undefined,
): ChartCalculationSource | null {
  const value = chart?.metadata?.calculationSource;
  if (value === CHART_SOURCE_SWISS || value === CHART_SOURCE_MOCK) return value;
  return null;
}

/** Unknown provenance is the demo engine. A Swiss chart has to say so. */
export function chartSourceOf(
  chart: { metadata?: { calculationSource?: unknown } } | null | undefined,
): ChartCalculationSource {
  return readChartCalculationSource(chart) ?? CHART_SOURCE_MOCK;
}
