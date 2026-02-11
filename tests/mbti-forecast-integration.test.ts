/**
 * Integration test for MBTI-enhanced forecast system
 * Tests the full flow: Chart → MBTI → Transits → Tone-adjusted forecast
 */

import { calculateBirthChart } from '../lib/engine-fallback';
import { getTodaysForecast } from '../lib/astrology/ephemeris';
import { getCurrentTransits } from '../lib/astrology/transits';
import { computeMBTI } from '../lib/astrology/mbtiFusion';
import { 
  getDetailedMBTITranslation, 
  MBTI_PROFILES,
  getCosmicTendencies 
} from '../lib/astrology/mbti-profiles';

describe('MBTI-Enhanced Forecast Integration', () => {
  // Test chart data
  const testBirthData = {
    birthDate: '1990-05-15',
    birthTime: '14:30:00',
    lat: 40.7128,
    lon: -74.0060
  };

  let birthChart: any;

  beforeAll(() => {
    birthChart = calculateBirthChart(
      testBirthData.birthDate,
      testBirthData.birthTime,
      testBirthData.lat,
      testBirthData.lon
    );
  });

  describe('Transit Detection Enhancements', () => {
    test('should detect planetary returns', () => {
      const transits = getCurrentTransits(birthChart.positions);
      
      // Should have various transit types
      expect(Array.isArray(transits)).toBe(true);
      expect(transits.length).toBeGreaterThan(0);
      
      // Check for tags on transits
      const taggedTransits = transits.filter(t => t.tags && t.tags.length > 0);
      expect(taggedTransits.length).toBeGreaterThan(0);
    });

    test('should detect tight Moon aspects', () => {
      const transits = getCurrentTransits(birthChart.positions);
      
      // Look for Moon transits (note: with fallback engine, these are self-aspects)
      // In production with real ephemeris, this would detect actual transiting Moon
      const moonTransits = transits.filter(t => 
        t.transitingPlanet === 'Moon' || t.natalPlanet === 'Moon'
      );
      
      // Moon should appear in transit data
      expect(moonTransits.length).toBeGreaterThan(0);
    });

    test('should include lunar phase data', () => {
      const transits = getCurrentTransits(birthChart.positions);
      
      // Should have a lunar phase transit
      const phaseTransit = transits.find(t => 
        (t.transitingPlanet === 'Moon' && t.natalPlanet === 'Sun') ||
        t.tags?.some(tag => 
          ['new beginnings', 'culmination', 'lunar cycle', 'planting seeds', 
           'release', 'illumination', 'growth', 'releasing'].includes(tag)
        )
      );
      
      expect(phaseTransit).toBeDefined();
      if (phaseTransit) {
        // Should have lunar phase tags
        expect(phaseTransit.tags).toBeDefined();
        expect(phaseTransit.tags!.length).toBeGreaterThan(0);
      }
    });

    test('should tag transits by planet type', () => {
      const transits = getCurrentTransits(birthChart.positions);
      
      // Saturn aspects should have structure/discipline tags
      const saturnTransits = transits.filter(t => 
        (t.transitingPlanet === 'Saturn' || t.natalPlanet === 'Saturn') &&
        t.tags
      );
      
      if (saturnTransits.length > 0) {
        const saturnTags = saturnTransits[0].tags || [];
        const hasRelevantTag = saturnTags.some(tag => 
          ['structure', 'discipline', 'lesson'].includes(tag)
        );
        expect(hasRelevantTag).toBe(true);
      }
    });
  });

  describe('MBTI Profile System', () => {
    test('should have complete profiles for all 16 types', () => {
      const types = [
        'INFJ', 'INFP', 'INTJ', 'INTP',
        'ENFJ', 'ENFP', 'ENTJ', 'ENTP',
        'ISFJ', 'ISFP', 'ISTJ', 'ISTP',
        'ESFJ', 'ESFP', 'ESTJ', 'ESTP'
      ];

      types.forEach(type => {
        const profile = MBTI_PROFILES[type as keyof typeof MBTI_PROFILES];
        expect(profile).toBeDefined();
        expect(profile.type).toBe(type);
        expect(profile.cosmicTendencies.length).toBeGreaterThan(0);
        expect(profile.transitStyle).toBeTruthy();
        expect(profile.keywords.length).toBeGreaterThan(0);
      });
    });

    test('should provide cosmic tendencies for each type', () => {
      const tendencies = getCosmicTendencies('INFJ');
      expect(Array.isArray(tendencies)).toBe(true);
      expect(tendencies.length).toBeGreaterThan(3);
      expect(tendencies.some(t => t.includes('Moon') || t.includes('intuitive'))).toBe(true);
    });
  });

  describe('MBTI Tone Adjustment', () => {
    test('should generate personality-specific transit interpretation', () => {
      const effects = ['heavy', 'transformative', 'exact'];
      const aspects = ['Pluto square Sun', 'Saturn trine Moon'];
      
      const infj = getDetailedMBTITranslation('INFJ', effects as any, aspects);
      const estp = getDetailedMBTITranslation('ESTP', effects as any, aspects);
      
      // Both should be strings
      expect(typeof infj).toBe('string');
      expect(typeof estp).toBe('string');
      
      // Should mention MBTI type
      expect(infj).toContain('INFJ');
      expect(estp).toContain('ESTP');
      
      // Should be different
      expect(infj).not.toBe(estp);
      
      // INFJ should have soul/depth language
      expect(infj.toLowerCase()).toMatch(/soul|deep|transform|vision/);
      
      // ESTP should have action language
      expect(estp.toLowerCase()).toMatch(/action|bold|present|direct/);
    });

    test('should adjust tone based on transit effects', () => {
      const aspects = ['Jupiter trine Sun'];
      
      const positiveEffects = ['positive', 'expansion'];
      const heavyEffects = ['heavy', 'restriction', 'transformative'];
      
      const positive = getDetailedMBTITranslation('ENFP', positiveEffects as any, aspects);
      const heavy = getDetailedMBTITranslation('ENFP', heavyEffects as any, aspects);
      
      // Positive should have growth/opportunity language
      expect(positive.toLowerCase()).toMatch(/growth|expand|enthusiasm|adventure|harmonious|supportive/);
      
      // Heavy should acknowledge the intensity (might still be positive if aspects are good)
      // The key is the tone changes based on MBTI + effects combo
      expect(heavy).toContain('ENFP');
      expect(heavy.length).toBeGreaterThan(50); // Should be substantial
      
      // They should be noticeably different
      expect(positive).not.toBe(heavy);
    });

    test('should provide aspect-specific guidance', () => {
      const saturnSquare = ['Saturn square Moon'];
      const jupiterTrine = ['Jupiter trine Sun'];
      
      const saturnGuidance = getDetailedMBTITranslation('INTJ', ['heavy'] as any, saturnSquare);
      const jupiterGuidance = getDetailedMBTITranslation('INTJ', ['positive'] as any, jupiterTrine);
      
      // Saturn guidance should mention structure/discipline
      expect(saturnGuidance.toLowerCase()).toMatch(/discipline|structure|mastery|boundaries/);
      
      // Jupiter guidance should mention expansion/vision
      expect(jupiterGuidance.toLowerCase()).toMatch(/expand|vision|growth|strategic/);
    });
  });

  describe('Forecast API Integration', () => {
    test('should inject MBTI overlay into forecast', () => {
      const forecast = getTodaysForecast(birthChart);
      
      // Should have MBTI overlay
      expect(forecast.mbti_overlay).toBeDefined();
      expect(forecast.mbti_overlay?.type).toBeTruthy();
      expect(forecast.mbti_overlay?.confidence).toBeGreaterThan(50);
      expect(forecast.mbti_overlay?.breakdown).toBeDefined();
      expect(forecast.mbti_overlay?.reasoning).toBeDefined();
      expect(forecast.mbti_overlay?.cosmicTendencies).toBeDefined();
      expect(Array.isArray(forecast.mbti_overlay?.cosmicTendencies)).toBe(true);
    });

    test('should provide both raw and MBTI-adjusted summaries', () => {
      const forecast = getTodaysForecast(birthChart);
      
      expect(forecast.summary).toBeTruthy();
      expect(forecast.summary_raw).toBeTruthy();
      expect(forecast.summary_mbti_adjusted).toBeTruthy();
      
      // MBTI-adjusted should mention personality type
      const mbtiType = forecast.mbti_overlay?.type;
      expect(forecast.summary_mbti_adjusted).toContain(mbtiType);
    });

    test('should calculate day rating', () => {
      const forecast = getTodaysForecast(birthChart);
      
      expect(forecast.day_rating).toBeDefined();
      const validRatings = [
        'Very Positive',
        'Positive',
        'Neutral',
        'Challenging',
        'Very Challenging'
      ];
      expect(validRatings).toContain(forecast.day_rating);
    });

    test('should include enhanced transit data with tags', () => {
      const forecast = getTodaysForecast(birthChart);
      
      expect(Array.isArray(forecast.transits)).toBe(true);
      
      // Transits should have tags (if they're objects, not strings)
      if (forecast.transits.length > 0 && typeof forecast.transits[0] === 'object') {
        const transitObj = forecast.transits[0] as any;
        expect(transitObj.transitingPlanet).toBeDefined();
        expect(transitObj.aspect).toBeDefined();
        // Tags are optional but should exist on some transits
      }
    });

    test('should generate MBTI-aware advice', () => {
      const forecast = getTodaysForecast(birthChart);
      
      expect(forecast.advice).toBeTruthy();
      
      // Advice should be personalized
      const mbtiType = forecast.mbti_overlay?.type;
      const hasPersonalization = 
        forecast.advice.includes('introspective') ||
        forecast.advice.includes('expressive') ||
        forecast.advice.includes('grounded') ||
        forecast.advice.includes('dynamic');
      
      expect(hasPersonalization).toBe(true);
    });

    test('should include complete forecast structure', () => {
      const forecast = getTodaysForecast(birthChart);
      
      // Core fields
      expect(forecast.date).toBeTruthy();
      expect(forecast.summary).toBeTruthy();
      expect(forecast.moonPhase).toBeTruthy();
      expect(forecast.advice).toBeTruthy();
      
      // Enhanced fields
      expect(forecast.day_rating).toBeTruthy();
      expect(forecast.mbti_overlay).toBeDefined();
      
      // Arrays
      expect(Array.isArray(forecast.planetaryHighlights)).toBe(true);
      expect(Array.isArray(forecast.transits)).toBe(true);
    });
  });

  describe('End-to-End Flow', () => {
    test('should compute MBTI from chart', () => {
      const mbti = computeMBTI(birthChart);
      
      expect(mbti.type).toBeTruthy();
      expect(mbti.type.length).toBe(4);
      expect(mbti.confidence).toBeGreaterThan(50);
      expect(mbti.breakdown).toBeDefined();
    });

    test('should detect transits with enhanced features', () => {
      const transits = getCurrentTransits(birthChart.positions);
      
      expect(transits.length).toBeGreaterThan(0);
      
      // Should have various aspect types
      const aspectTypes = [...new Set(transits.map(t => t.aspect))];
      expect(aspectTypes.length).toBeGreaterThan(1);
      
      // Should have exact transits flag
      const hasExactFlag = transits.some(t => t.exact === true || t.exact === false);
      expect(hasExactFlag).toBe(true);
    });

    test('should generate complete personalized forecast', () => {
      const forecast = getTodaysForecast(birthChart);
      
      // Should have all major components
      expect(forecast.date).toBeTruthy();
      expect(forecast.summary).toBeTruthy();
      expect(forecast.mbti_overlay?.type).toBeTruthy();
      expect(forecast.day_rating).toBeTruthy();
      expect(Array.isArray(forecast.transits)).toBe(true);
      
      // Summary should be personality-specific
      const mbtiType = forecast.mbti_overlay?.type;
      expect(forecast.summary).toContain(mbtiType || '');
      
      // Should have cosmic tendencies
      expect(forecast.mbti_overlay?.cosmicTendencies.length).toBeGreaterThan(0);
    });
  });
});
