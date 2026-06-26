import {
  blendSentimentScore,
  computeCheckinSentimentScore,
  computeFeltIntensity,
  computeReadinessModifier,
  computeRealityCheck,
  resolveGuidanceBranch,
  scoreJournalSentiment,
} from '@/lib/atmosphere/reality-check';
import { computeAtmosphere } from '@/lib/atmosphere/compute';

describe('reality-check', () => {
  it('maps calm check-in to lower felt intensity under storm sky', () => {
    const reality = computeRealityCheck(82, {
      checkin: { mood: 8, stress: 3, energy: 8 },
    });

    expect(reality.sentimentScore).toBeGreaterThan(70);
    expect(reality.readinessModifier).toBeLessThan(0.95);
    expect(reality.feltIntensity).toBeLessThan(82);
    expect(reality.guidanceBranch).toBe('storm_calm');
    expect(reality.guidanceNote.length).toBeGreaterThan(20);
  });

  it('maps heavy check-in to higher felt intensity under storm sky', () => {
    const reality = computeRealityCheck(78, {
      checkin: { mood: 3, stress: 9, energy: 2 },
    });

    expect(reality.sentimentScore).toBeLessThan(35);
    expect(reality.readinessModifier).toBeGreaterThan(1.05);
    expect(reality.feltIntensity).toBeGreaterThan(78);
    expect(reality.guidanceBranch).toBe('storm_heavy');
  });

  it('blends journal sentiment with check-in signal', () => {
    const checkinScore = computeCheckinSentimentScore({ mood: 6, stress: 5, energy: 6 });
    const journalScore = scoreJournalSentiment('Feeling calm and focused today');
    const blended = blendSentimentScore(checkinScore, journalScore);

    expect(blended.source).toBe('checkin+journal');
    expect(blended.score).toBeGreaterThan(checkinScore - 5);
  });

  it('clamps felt intensity between 15 and 100', () => {
    expect(computeFeltIntensity(90, 1.3)).toBe(100);
    expect(computeFeltIntensity(10, 0.7)).toBe(15);
  });

  it('nudges readiness modifier when calibration is active', () => {
    const withoutCalibration = computeReadinessModifier(50, undefined);
    const withCalibration = computeReadinessModifier(50, {
      feedbackCount: 5,
      strongestPlanet: 'Mars',
      strongestMultiplier: 1.2,
    });

    expect(withCalibration).toBeGreaterThan(withoutCalibration);
  });

  it('defaults to neutral guidance without sentiment input', () => {
    expect(resolveGuidanceBranch(80, null, 80, 1)).toBe('neutral');
    const reality = computeRealityCheck(80, null);
    expect(reality.feltIntensity).toBe(80);
    expect(reality.readinessModifier).toBe(1);
    expect(reality.source).toBe('none');
  });
});

describe('computeAtmosphere reality check integration', () => {
  it('adds felt intensity and guidance branch to the packet', () => {
    const packet = computeAtmosphere({
      explainability: {
        globalPressure: 72,
        confidence: 70,
        topDrivers: [
          {
            transitId: 'mars-square-moon',
            label: 'Mars square natal Moon',
            strength: 72,
            confidence: 70,
            reason: 'You might notice emotional reactivity rise under this transit.',
          },
        ],
        windowStartIso: '2026-06-24T00:00:00.000Z',
        windowEndIso: '2026-06-25T00:00:00.000Z',
        weightingBreakdown: {},
        personalizationBreakdown: {},
        domainScores: [],
        archetypes: [],
        safety: { grounding: [], caution: [], agency: [] },
      },
      realityCheck: {
        checkin: { mood: 8, stress: 2, energy: 8 },
      },
    });

    expect(packet.feltIntensity).toBeLessThan(packet.intensity);
    expect(packet.realityCheck.guidanceBranch).toBe('storm_calm');
    expect(packet.provenance).toContain('reality-check-checkin');
    expect(packet.provenance).toContain('guidance-storm_calm');
    expect(packet.dominantDriver.rationale).toMatch(/channel the pressure/i);
  });
});