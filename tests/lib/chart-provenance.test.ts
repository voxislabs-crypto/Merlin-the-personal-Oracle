import { calculateBirthChart as calculateFallbackBirthChart } from '@/lib/engine-fallback';
import { chartSourceOf, readChartCalculationSource } from '@/lib/chart-provenance';

describe('chart provenance', () => {
  it('stamps the demo engine as mock-fallback', () => {
    const chart = calculateFallbackBirthChart('1983-08-14', '16:21', 36.85, -76.29);
    expect(chart.metadata?.calculationSource).toBe('mock-fallback');
    expect(chart.metadata?.ephemeris).toBe('Mock');
    expect(chartSourceOf(chart)).toBe('mock-fallback');
  });

  it('does not treat a missing label as Swiss', () => {
    expect(readChartCalculationSource(null)).toBeNull();
    expect(readChartCalculationSource({ metadata: {} })).toBeNull();
    expect(chartSourceOf(null)).toBe('mock-fallback');
    expect(chartSourceOf({ metadata: { calculationSource: 'swiss-real' } })).toBe('swiss-real');
  });
});
