import type { LifeRiskDayScore } from '@/lib/atmosphere/types';
import {
  buildHorizonCurvePaths,
  clusterHorizonPeaks,
  collectHorizonPeaks,
  HORIZON_CURVE_LAYOUT,
  placeHorizonGlyphs,
  signedHorizonIntensity,
  type HorizonPeakSource,
} from '@/lib/atmosphere/horizon-curve';

const AS_OF = '2026-10-01';

function day(
  date: string,
  friction: number,
  ease = 0,
  extra: Partial<LifeRiskDayScore> = {},
): LifeRiskDayScore {
  return { date, scored: true, friction, ease, ...extra };
}

function october(count = 30): LifeRiskDayScore[] {
  return Array.from({ length: count }, (_, index) =>
    day(`2026-10-${String(index + 1).padStart(2, '0')}`, 0, 0),
  );
}

describe('horizon curve', () => {
  it('maps the bar signal onto one signed line', () => {
    expect(signedHorizonIntensity(day('2026-10-01', 80, 0))).toBe(80);
    expect(signedHorizonIntensity(day('2026-10-01', 20, 70))).toBe(-70);
    expect(signedHorizonIntensity(day('2026-10-01', 0, 0))).toBe(0);
    expect(signedHorizonIntensity({ date: '2026-10-01', scored: false, friction: 0, ease: 0 })).toBeNull();
  });

  it('draws one continuous curve and the same path every time', () => {
    const days = [
      day('2026-10-01', 0, 0),
      day('2026-10-02', 80, 0),
      day('2026-10-03', 0, 0),
    ];
    const first = buildHorizonCurvePaths(days);
    const second = buildHorizonCurvePaths(days);
    expect(second).toEqual(first);
    expect(first.strokes).toHaveLength(1);
    expect(first.unscored).toHaveLength(0);
    expect(first.strokes[0]).toBe(
      'M 172.00 118.00 C 223.33 109.20, 377.33 65.20, 480.00 65.20 C 582.67 65.20, 736.67 109.20, 788.00 118.00',
    );
    expect(first.strokes[0]).toContain('C');
    expect(HORIZON_CURVE_LAYOUT.plotTop).toBeLessThan(65.2);
    expect(HORIZON_CURVE_LAYOUT.plotBottom).toBeGreaterThan(118);
  });

  it('breaks the line across days that are not scored', () => {
    const days = [
      day('2026-10-01', 40, 0),
      day('2026-10-02', 60, 0),
      { date: '2026-10-03', scored: false, friction: 0, ease: 0 },
      { date: '2026-10-04', scored: false, friction: 0, ease: 0 },
      day('2026-10-05', 55, 0),
    ];
    const paths = buildHorizonCurvePaths(days);
    expect(paths.strokes).toHaveLength(2);
    expect(paths.unscored).toHaveLength(1);
    expect(paths.unscored[0].width).toBeGreaterThan(0);
  });

  it('follows the month instead of a flat line', () => {
    const flat = buildHorizonCurvePaths([
      day('2026-10-01', 0, 0),
      day('2026-10-02', 0, 0),
      day('2026-10-03', 0, 0),
    ]);
    const peaked = buildHorizonCurvePaths([
      day('2026-10-01', 0, 0),
      day('2026-10-02', 80, 0),
      day('2026-10-03', 0, 0),
    ]);
    expect(flat.strokes[0]).not.toEqual(peaked.strokes[0]);
    expect(flat.strokes[0]).not.toContain('65.20');
    expect(peaked.strokes[0]).toContain('65.20');
  });
});

describe('horizon peak glyphs', () => {
  const saturn: HorizonPeakSource = {
    id: 'sat',
    label: 'Saturn Square Moon',
    kind: 'friction',
    friction: 80,
    ease: 0,
    startsAt: '2026-10-04T12:00:00',
    peakAt: '2026-10-07T12:00:00',
    daysToPeak: 6,
    domains: ['career'],
  };
  const mars: HorizonPeakSource = {
    id: 'mars',
    label: 'Mars Opposition Venus',
    kind: 'friction',
    friction: 60,
    ease: 0,
    startsAt: '2026-10-08T12:00:00',
    peakAt: '2026-10-08T12:00:00',
    daysToPeak: 7,
    domains: ['love'],
  };
  const jupiter: HorizonPeakSource = {
    id: 'jup',
    label: 'Jupiter Trine Sun',
    kind: 'support',
    friction: 20,
    ease: 70,
    startsAt: '2026-10-15T12:00:00',
    peakAt: '2026-10-15T12:00:00',
    daysToPeak: 14,
    domains: ['self'],
  };

  it('anchors a spreading transit one day before exactness', () => {
    const peaks = collectHorizonPeaks(october(), [saturn], AS_OF);
    expect(peaks).toHaveLength(1);
    expect(peaks[0]).toMatchObject({
      planet: 'Saturn',
      glyph: '♄',
      kind: 'friction',
      intensity: 80,
      theme: 'Work',
      peakDate: '2026-10-07',
      anchorDate: '2026-10-06',
      peakIndex: 6,
      anchorIndex: 5,
      startIndex: 3,
    });
  });

  it('keeps a same-day peak on its exact date', () => {
    const peaks = collectHorizonPeaks(october(), [mars], AS_OF);
    expect(peaks[0].anchorDate).toBe('2026-10-08');
    expect(peaks[0].peakDate).toBe('2026-10-08');
  });

  it('drops quiet peaks and peaks outside the window', () => {
    const peaks = collectHorizonPeaks(october(), [
      { ...mars, id: 'mild', friction: 30, label: 'Mercury Square Mars' },
      {
        ...jupiter,
        id: 'later',
        peakAt: '2026-11-05T12:00:00',
        startsAt: '2026-11-05T12:00:00',
        daysToPeak: 35,
      },
    ], AS_OF);
    expect(peaks).toHaveLength(0);
  });

  it('clusters peaks a couple of days apart and keeps the louder planet', () => {
    const days = october();
    const forward = clusterHorizonPeaks(collectHorizonPeaks(days, [saturn, mars, jupiter], AS_OF));
    const reversed = clusterHorizonPeaks(collectHorizonPeaks(days, [jupiter, mars, saturn], AS_OF));
    expect(reversed).toEqual(forward);

    expect(forward).toHaveLength(2);
    expect(forward[0].members.map((member) => member.planet)).toEqual(['Saturn', 'Mars']);
    expect(forward[1].members[0].planet).toBe('Jupiter');

    const placed = placeHorizonGlyphs(forward);
    const saturnGlyph = placed.find((glyph) => glyph.member.planet === 'Saturn');
    const marsGlyph = placed.find((glyph) => glyph.member.planet === 'Mars');
    const jupiterGlyph = placed.find((glyph) => glyph.member.planet === 'Jupiter');
    expect(saturnGlyph?.xIndex).toBe(5);
    expect(marsGlyph?.xIndex).toBe(7);
    expect(saturnGlyph?.lane).not.toBe(marsGlyph?.lane);
    expect(jupiterGlyph?.extraCount).toBe(0);
    expect(jupiterGlyph?.xIndex).toBe(14);
  });

  it('stacks glyphs that would land on the same day and collapses a crowd', () => {
    const days = october();
    const close = collectHorizonPeaks(days, [
      { ...saturn, startsAt: '2026-10-10T12:00:00', peakAt: '2026-10-10T12:00:00', daysToPeak: 9 },
      { ...mars, startsAt: '2026-10-11T12:00:00', peakAt: '2026-10-11T12:00:00', daysToPeak: 10 },
    ], AS_OF);
    const stacked = placeHorizonGlyphs(clusterHorizonPeaks(close));
    expect(stacked).toHaveLength(2);
    expect(stacked[0].xIndex).toBe(stacked[1].xIndex);
    expect(stacked.map((glyph) => glyph.lane).sort()).toEqual([0, 1]);

    const crowd = collectHorizonPeaks(days, [
      { ...saturn, id: 'a', friction: 90, startsAt: '2026-10-10T12:00:00', peakAt: '2026-10-10T12:00:00', daysToPeak: 9 },
      { ...mars, id: 'b', friction: 70, startsAt: '2026-10-11T12:00:00', peakAt: '2026-10-11T12:00:00', daysToPeak: 10 },
      {
        ...jupiter,
        id: 'c',
        kind: 'friction',
        friction: 55,
        ease: 0,
        label: 'Venus Square Mercury',
        startsAt: '2026-10-12T12:00:00',
        peakAt: '2026-10-12T12:00:00',
        daysToPeak: 11,
        domains: ['money'],
      },
    ], AS_OF);
    const collapsed = placeHorizonGlyphs(clusterHorizonPeaks(crowd));
    expect(collapsed).toHaveLength(1);
    expect(collapsed[0].member.planet).toBe('Saturn');
    expect(collapsed[0].extraCount).toBe(2);
    expect(clusterHorizonPeaks(crowd)[0].members).toHaveLength(3);
  });

  it('uses a day-score run when the transit is not in the window list', () => {
    const days = october();
    days[4] = day('2026-10-05', 48, 0, { frictionDriver: 'Uranus Square Venus' });
    days[5] = day('2026-10-06', 76, 0, { frictionDriver: 'Uranus Square Venus' });
    days[6] = day('2026-10-07', 50, 0, { frictionDriver: 'Uranus Square Venus' });
    const peaks = collectHorizonPeaks(days, [], AS_OF);
    expect(peaks).toHaveLength(1);
    expect(peaks[0]).toMatchObject({
      planet: 'Uranus',
      glyph: '♅',
      peakDate: '2026-10-06',
      anchorDate: '2026-10-05',
      theme: 'square Venus',
    });
  });
});
