// Weekly Whisper - Seven days of transit whispers
import { calculateBirthChart } from '../engine-fallback';
import { BirthChartData, PlanetPosition } from '../../types/astrology';

export interface DayWhisper {
  day: string; // "Monday", "Tuesday", etc.
  date: string; // YYYY-MM-DD
  whisper: string; // One-line guidance
}

export interface WeeklyForecast {
  week: DayWhisper[];
  startDate: string;
  endDate: string;
}

/**
 * Generate transit-based whispers for the week ahead
 * Each day gets one line. No fluff. Just the compass.
 */
export function getWeeklyWhispers(birthChart: BirthChartData): WeeklyForecast {
  const week: DayWhisper[] = [];
  const today = new Date();
  
  // Start from tomorrow (or today if preferred)
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate());
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  for (let i = 0; i < 7; i++) {
    const currentDay = new Date(startDate);
    currentDay.setDate(currentDay.getDate() + i);
    
    const dayName = dayNames[currentDay.getDay()];
    const dateString = currentDay.toISOString().split('T')[0];
    
    // Calculate transit chart for this day
    const transitChart = calculateBirthChart(
      dateString,
      '12:00:00',
      birthChart.birthData.coordinates?.lat || 0,
      birthChart.birthData.coordinates?.lon || 0
    );
    
    // Generate whisper based on transits
    const whisper = generateDayWhisper(birthChart, transitChart, dayName);
    
    week.push({
      day: dayName,
      date: dateString,
      whisper
    });
  }
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  
  return {
    week,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
}

/**
 * Generate a single-line whisper for one day
 * Based on transit Moon, aspects, and planetary positions
 */
function generateDayWhisper(
  natalChart: BirthChartData,
  transitChart: BirthChartData,
  dayName: string
): string {
  // Get transit Moon sign
  const transitMoon = transitChart.positions.find(p => p.name === 'Moon');
  const moonSign = transitMoon?.sign || 'Unknown';
  
  // Get transit Sun
  const transitSun = transitChart.positions.find(p => p.name === 'Sun');
  
  // Get natal Sun and Moon for aspect checks
  const natalSun = natalChart.positions.find(p => p.name === 'Sun');
  const natalMoon = natalChart.positions.find(p => p.name === 'Moon');
  const natalMercury = natalChart.positions.find(p => p.name === 'Mercury');
  
  // Moon sign whispers (primary guidance)
  const moonWhispers: Record<string, string> = {
    'Aries': 'Fire wants motion. Let it burn.',
    'Taurus': 'Ground yourself. Feel the earth.',
    'Gemini': 'Words scatter. Pick one truth.',
    'Cancer': 'Home calls. Answer it.',
    'Leo': 'The stage is yours. Own it.',
    'Virgo': 'Details matter. Clean the lens.',
    'Libra': 'Balance wobbles. Find center.',
    'Scorpio': 'Dive deep. Trust the dark.',
    'Sagittarius': 'Aim higher. Risk the leap.',
    'Capricorn': 'Build the mountain. Climb it.',
    'Aquarius': 'Break the pattern. Breathe different.',
    'Pisces': 'Dream the ocean. Swim across.'
  };
  
  // Check for challenging transits
  if (transitMoon && natalMoon) {
    const orb = Math.abs(transitMoon.longitude - natalMoon.longitude);
    const normalizedOrb = ((orb % 360) + 360) % 360;
    
    // Square (90° or 270°)
    if (Math.abs(normalizedOrb - 90) < 10 || Math.abs(normalizedOrb - 270) < 10) {
      if (natalMercury) return 'Mercury square Moon. Write it, burn it.';
      return 'Old itch. Say no.';
    }
    
    // Opposition (180°)
    if (Math.abs(normalizedOrb - 180) < 10) {
      return 'Moon opposite Pluto. Dive.';
    }
    
    // Trine (120° or 240°)
    if (Math.abs(normalizedOrb - 120) < 10 || Math.abs(normalizedOrb - 240) < 10) {
      return 'Venus trine Mars. Let the heat be quiet.';
    }
    
    // Sextile (60° or 300°)
    if (Math.abs(normalizedOrb - 60) < 10 || Math.abs(normalizedOrb - 300) < 10) {
      return 'Jupiter sextile Sun. Say yes to the small.';
    }
  }
  
  // Check if Sun is changing signs (ingress)
  if (transitSun && natalSun) {
    const sunDegree = transitSun.longitude % 30;
    if (sunDegree < 1 || sunDegree > 29) {
      return `Sun into ${transitSun.sign}. New chapter.`;
    }
  }
  
  // Special day-specific whispers
  const dayWhispers: Record<string, string[]> = {
    'Monday': [
      'Monday holds the Moon. Start slow.',
      'New week. Old wounds. Choose light.',
      'Moon in {sign}. {moonWhisper}'
    ],
    'Tuesday': [
      'Mars rules this day. Act or rest.',
      'Tuesday friction. Use it or lose it.',
      '{moonWhisper}'
    ],
    'Wednesday': [
      'Mercury speaks. Listen twice, say once.',
      'Midweek mirror. What do you see?',
      '{moonWhisper}'
    ],
    'Thursday': [
      'Jupiter expands. Let something grow.',
      'Thursday threshold. Step through.',
      '{moonWhisper}'
    ],
    'Friday': [
      'Venus whispers. Answer with softness.',
      'Friday feels good. Trust it.',
      '{moonWhisper}'
    ],
    'Saturday': [
      'Saturn teaches. Learn the lesson.',
      'Weekend starts. Rest is work.',
      '{moonWhisper}'
    ],
    'Sunday': [
      'Sun day. Shine or hide. Both holy.',
      'The week ends. Let it go.',
      '{moonWhisper}'
    ]
  };
  
  // Pick a whisper for this day
  const options = dayWhispers[dayName] || ['{moonWhisper}'];
  const baseWhisper = moonWhispers[moonSign] || 'Quiet sky. Breathe.';
  
  // Choose randomly or based on degree
  const index = (transitMoon?.degree || 0) % options.length;
  let whisper = options[index];
  
  // Replace placeholders
  whisper = whisper.replace('{moonWhisper}', baseWhisper);
  whisper = whisper.replace('{sign}', moonSign);
  
  return whisper;
}
