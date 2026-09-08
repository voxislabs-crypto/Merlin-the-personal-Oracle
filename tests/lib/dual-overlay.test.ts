import {
  derivePersonalityFromChart,
  selectPersonalityReads,
  type DualOverlay,
} from '@/lib/personality/dual-overlay';
import type { BirthChartData } from '@/types/astrology';

function sampleChart(): BirthChartData {
  return {
    jd: 2445000,
    positions: [
      { name: 'Sun', longitude: 120, latitude: 0, distance: 1, sign: 'Leo', degree: 0, minute: 0, house: 10 },
      { name: 'Moon', longitude: 300, latitude: 0, distance: 1, sign: 'Aquarius', degree: 0, minute: 0, house: 4 },
      { name: 'Mercury', longitude: 130, latitude: 0, distance: 1, sign: 'Leo', degree: 10, minute: 0, house: 10 },
      { name: 'Mars', longitude: 45, latitude: 0, distance: 1, sign: 'Taurus', degree: 15, minute: 0, house: 7 },
    ],
    planets: [],
    houses: [{ house: 1, sign: 'Scorpio', degree: 0, minute: 0, longitude: 210 }],
    aspects: [],
    ascendant: { longitude: 210, sign: 'Scorpio', degree: 0, minute: 0 },
    mc: { longitude: 120, sign: 'Leo', degree: 0, minute: 0 },
    aspectPatterns: [],
    midpoints: [],
    fixedStars: [],
    karmic: [],
    progressed: {} as BirthChartData['progressed'],
    electional: [],
    moonPhase: {} as BirthChartData['moonPhase'],
    transits: [],
  };
}

describe('derivePersonalityFromChart', () => {
  it('returns mask and core types from chart data', () => {
    const chart = sampleChart();
    chart.planets = chart.positions;

    const result = derivePersonalityFromChart(chart);

    expect(result).not.toBeNull();
    expect(result?.mbtiType).toMatch(/^[EI][SN][TF][JP]$/);
    expect(result?.mbtiType).toBe(result?.dualOverlay.firmware.mbtiType);
    expect(result?.dualOverlay.hardware.mbtiType).toMatch(/^[EI][SN][TF][JP]$/);
    expect(result?.dualOverlay.firmware.mbtiType).toMatch(/^[EI][SN][TF][JP]$/);
    expect(result?.dualOverlay.hardware.description.length).toBeGreaterThan(10);
    expect(result?.dualOverlay.firmware.description.length).toBeGreaterThan(10);
  });

  it('returns null when chart has no positions', () => {
    const chart = sampleChart();
    chart.positions = [];
    chart.planets = [];

    expect(derivePersonalityFromChart(chart)).toBeNull();
  });
});

function overlayFor(core: string): DualOverlay {
  return {
    hardware: {
      label: 'mask',
      sublabel: '',
      mbtiType: 'INTP',
      confidence: 80,
      archetype: '',
      description: '',
      breakdown: {
        e_i: 'I',
        s_n: 'N',
        t_f: 'T',
        j_p: 'P',
        reasoning: { extraversion: [], intuition: [], thinking: [], judging: [] },
      },
    },
    firmware: {
      label: 'core',
      sublabel: '',
      mbtiType: core,
      confidence: 80,
      archetype: '',
      description: '',
      breakdown: {
        e_i: 'I',
        s_n: 'N',
        t_f: 'F',
        j_p: core.endsWith('J') ? 'J' : 'P',
        reasoning: { extraversion: [], intuition: [], thinking: [], judging: [] },
      },
    },
    finalType: core,
    finalConfidence: 80,
  };
}

describe('selectPersonalityReads', () => {
  const base = overlayFor('INFJ');
  const rx = overlayFor('INFP');

  it('uses overlay-off Core while the switch is off', () => {
    const reads = selectPersonalityReads({
      overlay: rx,
      base,
      rx,
      retrogradeOverlay: false,
    });
    expect(reads.live?.firmware.mbtiType).toBe('INFJ');
    expect(reads.base?.firmware.mbtiType).toBe('INFJ');
    expect(reads.rx?.firmware.mbtiType).toBe('INFP');
  });

  it('uses overlay-on Core when flipped', () => {
    const reads = selectPersonalityReads({
      overlay: base,
      base,
      rx,
      retrogradeOverlay: true,
    });
    expect(reads.live?.firmware.mbtiType).toBe('INFP');
  });
});