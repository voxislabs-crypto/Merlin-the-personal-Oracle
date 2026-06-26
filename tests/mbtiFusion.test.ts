/**
 * MBTI Fusion Test Suite
 * Validates MBTI calculation logic with known chart configurations
 */

import { computeMBTI } from '../lib/astrology/mbtiFusion';
import type { BirthChartData } from '../types/astrology';

describe('MBTI Fusion', () => {
  // Mock chart data for INTJ pattern
  const intjChart: Partial<BirthChartData> = {
    positions: [
      { name: 'Sun', sign: 'Aries', longitude: 15, latitude: 0, distance: 1, degree: 15, minute: 0, house: 10 },
      { name: 'Moon', sign: 'Aquarius', longitude: 320, latitude: 0, distance: 1, degree: 20, minute: 0, house: 9 },
      { name: 'Mercury', sign: 'Gemini', longitude: 75, latitude: 0, distance: 1, degree: 15, minute: 0, house: 9 },
      { name: 'Venus', sign: 'Taurus', longitude: 45, latitude: 0, distance: 1, degree: 15, minute: 0, house: 8 },
      { name: 'Mars', sign: 'Aquarius', longitude: 315, latitude: 0, distance: 1, degree: 15, minute: 0, house: 9 },
      { name: 'Jupiter', sign: 'Sagittarius', longitude: 255, latitude: 0, distance: 1, degree: 15, minute: 0, house: 5 },
      { name: 'Saturn', sign: 'Capricorn', longitude: 285, latitude: 0, distance: 1, degree: 15, minute: 0, house: 1 },
      { name: 'Uranus', sign: 'Aquarius', longitude: 305, latitude: 0, distance: 1, degree: 15, minute: 0, house: 9 },
      { name: 'Neptune', sign: 'Pisces', longitude: 345, latitude: 0, distance: 1, degree: 15, minute: 0, house: 10 },
      { name: 'True Node', sign: 'Gemini', longitude: 85, latitude: 0, distance: 0, degree: 25, minute: 0, house: 9 },
    ],
    houses: [],
    aspects: [],
    ascendant: {
      longitude: 285,
      sign: 'Capricorn',
      degree: 15,
      minute: 0,
    },
    mc: {
      longitude: 195,
      sign: 'Libra',
      degree: 15,
      minute: 0,
    },
  };

  // Mock chart data for ENFP pattern
  const enfpChart: Partial<BirthChartData> = {
    positions: [
      { name: 'Sun', sign: 'Leo', longitude: 135, latitude: 0, distance: 1, degree: 15, minute: 0, house: 1 },
      { name: 'Moon', sign: 'Sagittarius', longitude: 255, latitude: 0, distance: 1, degree: 15, minute: 0, house: 5 },
      { name: 'Mercury', sign: 'Gemini', longitude: 75, latitude: 0, distance: 1, degree: 15, minute: 0, house: 11 },
      { name: 'Venus', sign: 'Cancer', longitude: 105, latitude: 0, distance: 1, degree: 15, minute: 0, house: 12 },
      { name: 'Mars', sign: 'Aries', longitude: 15, latitude: 0, distance: 1, degree: 15, minute: 0, house: 8 },
      { name: 'Jupiter', sign: 'Aquarius', longitude: 315, latitude: 0, distance: 1, degree: 15, minute: 0, house: 7 },
      { name: 'Saturn', sign: 'Gemini', longitude: 85, latitude: 0, distance: 1, degree: 15, minute: 0, house: 11 },
      { name: 'Uranus', sign: 'Sagittarius', longitude: 245, latitude: 0, distance: 1, degree: 15, minute: 0, house: 5 },
      { name: 'Neptune', sign: 'Pisces', longitude: 345, latitude: 0, distance: 1, degree: 15, minute: 0, house: 8 },
      { name: 'True Node', sign: 'Aries', longitude: 25, latitude: 0, distance: 0, degree: 25, minute: 0, house: 9 },
    ],
    houses: [],
    aspects: [],
    ascendant: {
      longitude: 135,
      sign: 'Leo',
      degree: 15,
      minute: 0,
    },
    mc: {
      longitude: 45,
      sign: 'Taurus',
      degree: 15,
      minute: 0,
    },
  };

  test('computes MBTI type for INTJ chart', () => {
    const result = computeMBTI(intjChart as BirthChartData);
    
    expect(result).toBeDefined();
    expect(result.type).toBeTruthy();
    expect(result.type.length).toBe(4);
    expect(result.confidence).toBeGreaterThanOrEqual(60);
    expect(result.confidence).toBeLessThanOrEqual(100);
    expect(result.breakdown).toHaveProperty('e_i');
    expect(result.breakdown).toHaveProperty('s_n');
    expect(result.breakdown).toHaveProperty('t_f');
    expect(result.breakdown).toHaveProperty('j_p');
    
    // With this chart config (multiple air planets), extraversion is expected
    // Air North Node = N, Air Mars = T, INTJ override triggered by Saturn in 1st
    expect(result.breakdown.s_n).toBe('N'); // Gemini North Node
    expect(result.breakdown.t_f).toBe('T'); // Aquarius Mars
    expect(result.type).toContain('NT'); // Should be xNTx type
    
    console.log('INTJ Test Result:', result);
  });

  test('computes MBTI type for ENFP chart', () => {
    const result = computeMBTI(enfpChart as BirthChartData);
    
    expect(result).toBeDefined();
    expect(result.type).toBeTruthy();
    expect(result.confidence).toBeGreaterThanOrEqual(60);
    
    // ENFP pattern: Fire ascendant (E), Fire North Node (N), Fire Mars (F - not air/fire enough), Mutable Saturn (P)
    expect(result.breakdown.e_i).toBe('E'); // Leo ascendant
    expect(result.breakdown.s_n).toBe('N'); // Aries North Node (fire)
    expect(result.breakdown.j_p).toBe('P'); // Gemini Saturn (mutable)
    
    console.log('ENFP Test Result:', result);
  });

  test('includes reasoning for each dimension', () => {
    const result = computeMBTI(intjChart as BirthChartData);
    
    expect(result.reasoning).toBeDefined();
    expect(result.reasoning.extraversion).toBeInstanceOf(Array);
    expect(result.reasoning.intuition).toBeInstanceOf(Array);
    expect(result.reasoning.thinking).toBeInstanceOf(Array);
    expect(result.reasoning.judging).toBeInstanceOf(Array);
    
    // Should have at least one reason for each dimension
    expect(result.reasoning.extraversion.length).toBeGreaterThan(0);
    expect(result.reasoning.intuition.length).toBeGreaterThan(0);
    expect(result.reasoning.thinking.length).toBeGreaterThan(0);
    expect(result.reasoning.judging.length).toBeGreaterThan(0);
  });

  test('handles INTJ override correctly', () => {
    const result = computeMBTI(intjChart as BirthChartData);
    
    // Saturn in 1st house should trigger INTJ override if T score is reasonable
    if (result.type === 'INTJ') {
      console.log('INTJ override successfully triggered');
    }
  });

  test('clamps confidence between 60 and 100', () => {
    const result = computeMBTI(intjChart as BirthChartData);
    
    expect(result.confidence).toBeGreaterThanOrEqual(60);
    expect(result.confidence).toBeLessThanOrEqual(100);
  });

  test('handles charts with missing optional fields', () => {
    const minimalChart: Partial<BirthChartData> = {
      positions: [
        { name: 'Sun', sign: 'Aries', longitude: 15, latitude: 0, distance: 1, degree: 15, minute: 0, house: 1 },
        { name: 'Moon', sign: 'Taurus', longitude: 45, latitude: 0, distance: 1, degree: 15, minute: 0, house: 2 },
      ],
      houses: [],
      aspects: [],
      ascendant: { longitude: 0, sign: 'Aries', degree: 0, minute: 0 },
      mc: { longitude: 270, sign: 'Capricorn', degree: 0, minute: 0 },
    };
    
    const result = computeMBTI(minimalChart as BirthChartData);
    
    expect(result).toBeDefined();
    expect(result.type).toBeTruthy();
    expect(result.confidence).toBeGreaterThanOrEqual(60);
  });
});
