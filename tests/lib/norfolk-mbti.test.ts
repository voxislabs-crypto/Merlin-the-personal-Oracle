import { calculateBirthChart } from '@/lib/engine';
import { computeMBTIDual } from '@/lib/astrology/mbtiFusion';

describe('Norfolk MBTI mask tuning', () => {
  it('reports hardware mask breakdown for Aug 14 1983 12:21 Norfolk', () => {
    // 12:21 PM EDT (UTC-4) => 16:21 UTC
    const chart = calculateBirthChart('1983-08-14', '16:21', 36.8468, -76.2855, {
      includePatterns: false,
      includeTransits: false,
    });

    const planet = (name: string) => chart.planets.find((p) => p.name === name);

    console.log('Placements:', {
      asc: chart.ascendant.sign,
      mc: chart.mc.sign,
      sun: planet('Sun')?.sign,
      moon: planet('Moon')?.sign,
      mercury: planet('Mercury')?.sign,
      mars: planet('Mars')?.sign,
      saturn: planet('Saturn')?.sign,
      uranus: planet('Uranus')?.sign,
      neptune: planet('Neptune')?.sign,
      sunHouse: planet('Sun')?.house,
      marsHouse: planet('Mars')?.house,
      mercuryHouse: planet('Mercury')?.house,
      moonHouse: planet('Moon')?.house,
    });

    const dual = computeMBTIDual(chart);

    console.log('Hardware mask:', dual.hardware.type, dual.hardware.confidence);
    console.log('Hardware breakdown:', dual.hardware.breakdown);
    console.log('Hardware reasoning:', dual.hardware.breakdown.reasoning);
    console.log('Firmware core:', dual.firmware.type, dual.firmware.confidence);
    console.log('Final type:', dual.type);

    expect(dual.hardware.type).toMatch(/^[EI][SN][TF][JP]$/);
    // Scorpio rising + Virgo Mercury mask should read introverted and analytical.
    expect(dual.hardware.breakdown.e_i).toBe('I');
    expect(dual.hardware.breakdown.t_f).toBe('T');
    expect(dual.hardware.type).toBe('INTP');
    expect(dual.firmware.type).toBe('INFJ');
    expect(dual.type).toBe('INFJ');
  });

  it('retrograde overlay changes Core type when natal Rx planets exist', () => {
    const chart = calculateBirthChart('1983-08-14', '16:21', 36.8468, -76.2855, {
      includePatterns: false,
      includeTransits: false,
    });
    const rx = (chart.planets || []).filter((p) => p.retrograde || (typeof p.speed === 'number' && p.speed < 0));
    console.log(
      'Rx planets:',
      rx.map((p) => `${p.name} speed=${p.speed} rx=${p.retrograde}`),
    );

    const off = computeMBTIDual(chart);
    const on = computeMBTIDual(chart, { retrogradeOverlay: true });
    console.log('Overlay off:', off.firmware.type, off.firmware.breakdown);
    console.log('Overlay on:', on.firmware.type, on.firmware.breakdown);

    expect(on.hardware.type).toBe(off.hardware.type);
    expect(rx.length).toBeGreaterThan(0);
    expect(off.firmware.type).toBe('INFJ');
    expect(on.firmware.type).toBe('INFP');
    expect(on.firmware.breakdown.reasoning.judging.join(' ')).toMatch(/Retrograde overlay/);
  });
});