import {
  buildTransitPatternKey,
  deriveSensitivityTags,
  feedbackSignalToSensitivity,
  mergeSensitivityScores,
  parseAspectId,
  resolveAtmospherePatternsContext,
  resolvePatternModifier,
} from '@/lib/atmosphere/pattern-tags';
import { applyPatternReadinessNudge } from '@/lib/atmosphere/pattern-personalization';
import type { AtmospherePatternProfile } from '@/lib/atmosphere/pattern-types';
import { computeAtmosphere } from '@/lib/atmosphere/compute';

describe('pattern-tags', () => {
  it('parses transit thumbs ids into planet/aspect keys', () => {
    const parsed = parseAspectId('transit-sig-Mars-Moon');
    expect(parsed.transitingPlanet).toBe('Mars');
    expect(parsed.natalPlanet).toBe('Moon');
  });

  it('merges feedback signals with growing confidence', () => {
    const first = mergeSensitivityScores(0, 0, 0.8);
    const second = mergeSensitivityScores(first.score, first.count, -0.4);
    expect(second.count).toBe(2);
    expect(second.confidence).toBeGreaterThan(first.confidence);
  });

  it('maps resonated feedback to positive sensitivity', () => {
    expect(feedbackSignalToSensitivity(true, 0.85)).toBeGreaterThan(0);
    expect(feedbackSignalToSensitivity(false, 0.85)).toBeLessThan(0);
  });

  it('derives tags from planet themes', () => {
    const tags = deriveSensitivityTags(buildTransitPatternKey('Mars', 'Square', 'Moon'), 0.6, 'pressure');
    expect(tags).toContain('work_pressure');
  });
});

describe('pattern personalization', () => {
  const profile: AtmospherePatternProfile = {
    userId: 'user-1',
    patterns: [
      {
        patternKey: 'transit:Mars:Square:Moon',
        patternType: 'transit',
        sensitivityScore: 0.72,
        sampleCount: 4,
        confidence: 0.8,
        tags: ['emotional_reactivity', 'work_pressure'],
      },
      {
        patternKey: 'planet:Mars',
        patternType: 'planet',
        sensitivityScore: 0.55,
        sampleCount: 6,
        confidence: 0.9,
        tags: ['work_pressure'],
      },
    ],
    tagWeights: {},
    summary: {
      patternCount: 2,
      feedbackSamples: 10,
      checkinSamples: 0,
      strongestPatternKey: 'transit:Mars:Square:Moon',
      strongestSensitivity: 0.72,
    },
  };

  it('matches active transits and applies readiness nudge', () => {
    const context = resolveAtmospherePatternsContext(profile, [
      {
        transitingPlanet: 'Mars',
        natalPlanet: 'Moon',
        aspect: 'Square',
      },
    ]);

    expect(context.active.length).toBeGreaterThan(0);
    expect(context.modifier).toBeGreaterThan(1);
    expect(context.provenance).toContain('pattern-store-active');

    const adjusted = applyPatternReadinessNudge(1, profile, [
      {
        transitingPlanet: 'Mars',
        natalPlanet: 'Moon',
        aspect: 'Square',
      },
    ]);
    expect(adjusted.modifier).toBeGreaterThan(1);
  });

  it('returns neutral modifier when no patterns match', () => {
    expect(resolvePatternModifier([])).toBe(1);
  });
});

describe('computeAtmosphere pattern integration', () => {
  it('includes matched patterns in packet provenance', () => {
    const packet = computeAtmosphere({
      explainability: {
        globalPressure: 70,
        confidence: 70,
        topDrivers: [],
        windowStartIso: '',
        windowEndIso: '',
        weightingBreakdown: {},
        personalizationBreakdown: {},
        domainScores: [],
        archetypes: [],
        safety: { grounding: [], caution: [], agency: [] },
      },
      patterns: {
        profile: {
          userId: 'user-1',
          patterns: [
            {
              patternKey: 'planet:Saturn',
              patternType: 'planet',
              sensitivityScore: 0.65,
              sampleCount: 5,
              confidence: 0.75,
              tags: ['stress_reactivity'],
            },
          ],
          tagWeights: {},
          summary: {
            patternCount: 1,
            feedbackSamples: 5,
            checkinSamples: 0,
          },
        },
        activeTransits: [{ transitingPlanet: 'Saturn', natalPlanet: 'Sun', aspect: 'Square' }],
      },
    });

    expect(packet.patterns.active.length).toBeGreaterThan(0);
    expect(packet.provenance.some((entry) => entry.startsWith('pattern-'))).toBe(true);
  });
});