import {
  classifyPassKind,
  detectExactPasses,
  inferPassKind,
  resolveTransitPass,
} from '@/lib/astrology/transit-passes';

describe('transit passes', () => {
  it('treats fast planets as a single pass', () => {
    const pass = inferPassKind({ transitingPlanet: 'Mars', phase: 'peaking' });
    expect(pass.kind).toBe('single');
    expect(pass.passCount).toBe(1);
  });

  it('treats a retrograde slow planet as the review pass', () => {
    const pass = inferPassKind({
      transitingPlanet: 'Saturn',
      retrograde: true,
      phase: 'peaking',
    });
    expect(pass.kind).toBe('retrograde');
    expect(pass.meaning).toMatch(/review/i);
  });

  it('treats a separating direct slow planet as the final pass', () => {
    const pass = inferPassKind({
      transitingPlanet: 'Pluto',
      retrograde: false,
      phase: 'releasing',
    });
    expect(pass.kind).toBe('final');
  });

  it('detects three exact minima as first / rx / final', () => {
    const detected = detectExactPasses([
      { date: '2026-04-10', orb: 0.2, retrograde: false },
      { date: '2026-04-17', orb: 1.4, retrograde: false },
      { date: '2026-08-02', orb: 0.3, retrograde: true },
      { date: '2026-08-09', orb: 1.5, retrograde: true },
      { date: '2027-01-12', orb: 0.1, retrograde: false },
    ]);
    expect(detected).toHaveLength(3);
    expect(classifyPassKind({ passIndex: 1, passCount: 3, retrograde: false })).toBe('first');
    expect(classifyPassKind({ passIndex: 2, passCount: 3, retrograde: true })).toBe('retrograde');
    expect(classifyPassKind({ passIndex: 3, passCount: 3, retrograde: false })).toBe('final');

    const now = resolveTransitPass({
      transitingPlanet: 'Saturn',
      today: '2026-08-02',
      samples: [
        { date: '2026-04-10', orb: 0.2, retrograde: false },
        { date: '2026-04-17', orb: 1.4, retrograde: false },
        { date: '2026-08-02', orb: 0.3, retrograde: true },
        { date: '2026-08-09', orb: 1.5, retrograde: true },
        { date: '2027-01-12', orb: 0.1, retrograde: false },
      ],
    });
    expect(now.kind).toBe('retrograde');
    expect(now.heuristic).toBe(false);
    expect(now.passIndex).toBe(2);
  });
});
