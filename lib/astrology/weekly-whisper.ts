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
  
  // Start 3 days before today, so today is always centered
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 3);
  
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
 * Based on transit Moon sign and the day itself
 * Clear, conversational, actionable guidance
 */
function generateDayWhisper(
  natalChart: BirthChartData,
  transitChart: BirthChartData,
  dayName: string
): string {
  // Get transit Moon sign
  const transitMoon = transitChart.positions.find(p => p.name === 'Moon');
  const moonSign = transitMoon?.sign || 'Unknown';
  const transitSun = transitChart.positions.find(p => p.name === 'Sun');
  
  // Check if Sun is changing signs (major shift)
  if (transitSun) {
    const sunDegree = transitSun.longitude % 30;
    if (sunDegree < 1) {
      return `The Sun enters ${transitSun.sign} today—a new chapter begins. Set fresh intentions.`;
    } else if (sunDegree > 29) {
      return `The Sun completes its journey through ${transitSun.sign}. Reflect on what you've learned.`;
    }
  }
  
  // Moon sign guidance - clear and actionable
  const moonGuidance: Record<string, string[]> = {
    'Aries': [
      'The Moon in Aries brings bold energy. Take initiative on something you\'ve been postponing.',
      'Fiery Aries Moon fuels courage. Start that conversation or project you\'ve been avoiding.',
      'Moon in Aries says: act first, think later. Trust your instincts today.'
    ],
    'Taurus': [
      'The Moon in Taurus craves stability. Focus on comfort, good food, and simple pleasures.',
      'Grounded Taurus Moon asks you to slow down. Enjoy sensory experiences—taste, touch, beauty.',
      'Moon in Taurus favors patience. Build something tangible, even if it\'s small.'
    ],
    'Gemini': [
      'The Moon in Gemini sparks curiosity. Learn something new or have a meaningful conversation.',
      'Chatty Gemini Moon makes connections easy. Reach out, share ideas, stay mentally active.',
      'Moon in Gemini feeds your mind. Read, write, or explore a topic that intrigues you.'
    ],
    'Cancer': [
      'The Moon in Cancer calls you home. Nurture yourself and those you love today.',
      'Emotional Cancer Moon heightens sensitivity. Honor your feelings without judgment.',
      'Moon in Cancer asks: what makes you feel safe? Create that space for yourself.'
    ],
    'Leo': [
      'The Moon in Leo wants you to shine. Express yourself boldly and celebrate your uniqueness.',
      'Dramatic Leo Moon says the stage is yours. Share your talents or do something creative.',
      'Moon in Leo fuels confidence. Play, laugh, and don\'t dim your light for anyone.'
    ],
    'Virgo': [
      'The Moon in Virgo helps you organize. Tackle a task that needs attention to detail.',
      'Practical Virgo Moon brings clarity. Clean up one area of your life—physical or mental.',
      'Moon in Virgo asks: what small improvement would make a big difference? Do that.'
    ],
    'Libra': [
      'The Moon in Libra seeks harmony. Smooth over conflicts or beautify your surroundings.',
      'Diplomatic Libra Moon favors connection. Compromise where needed, but don\'t lose yourself.',
      'Moon in Libra reminds you: balance is dynamic, not static. Adjust as you go.'
    ],
    'Scorpio': [
      'The Moon in Scorpio dives deep. Face what you\'ve been avoiding—there\'s power there.',
      'Intense Scorpio Moon brings emotional truth to the surface. Don\'t fear it.',
      'Moon in Scorpio says: transformation requires letting go. What\'s ready to die?'
    ],
    'Sagittarius': [
      'The Moon in Sagittarius expands your vision. Think bigger or explore something new.',
      'Adventurous Sagittarius Moon asks: what would you do if you weren\'t afraid?',
      'Moon in Sagittarius seeks meaning. Connect your daily actions to your larger purpose.'
    ],
    'Capricorn': [
      'The Moon in Capricorn favors discipline. Do the hard thing—it will pay off later.',
      'Ambitious Capricorn Moon helps you build. Take one practical step toward a long-term goal.',
      'Moon in Capricorn reminds you: patience and persistence are their own reward.'
    ],
    'Aquarius': [
      'The Moon in Aquarius sees the future. Think outside the box or connect with your community.',
      'Innovative Aquarius Moon says: be weird, be you. Your uniqueness is your superpower.',
      'Moon in Aquarius asks: what would benefit everyone, not just you? Act on that.'
    ],
    'Pisces': [
      'The Moon in Pisces opens your intuition. Trust what you feel, even if it doesn\'t make sense.',
      'Dreamy Pisces Moon blurs boundaries. Create art, meditate, or just let yourself float.',
      'Moon in Pisces asks for compassion—for others and for yourself. Soften where you can.'
    ]
  };
  
  // Get moon guidance options
  const moonOptions = moonGuidance[moonSign] || [
    `The Moon in ${moonSign} brings its own wisdom. Stay present and observant.`
  ];
  
  // Day-specific themes
  const dayThemes: Record<string, string[]> = {
    'Monday': [
      'Monday energy is for fresh starts. What do you want this week to feel like?',
      'Monday asks you to ease in. Don\'t force—just begin.',
      moonOptions[0]
    ],
    'Tuesday': [
      'Tuesday brings momentum. Channel your energy into action, not anxiety.',
      'Tuesday is ruled by Mars—get things done today.',
      moonOptions[1] || moonOptions[0]
    ],
    'Wednesday': [
      'Wednesday is for communication. Have that important conversation.',
      'Midweek clarity arrives. What\'s become obvious now?',
      moonOptions[2] || moonOptions[0]
    ],
    'Thursday': [
      'Thursday carries expansive energy. Say yes to an opportunity.',
      'Thursday is Jupiter\'s day—let something grow.',
      moonOptions[0]
    ],
    'Friday': [
      'Friday invites pleasure. Do something that brings you joy.',
      'Friday is Venus\'s day—prioritize beauty, love, and rest.',
      moonOptions[1] || moonOptions[0]
    ],
    'Saturday': [
      'Saturday asks for structure. Complete something you started.',
      'Saturday is for catching up. Tie up loose ends before the week turns.',
      moonOptions[0]
    ],
    'Sunday': [
      'Sunday is for restoration. Rest isn\'t unproductive—it\'s essential.',
      'Sunday asks you to reflect. What worked this week? What didn\'t?',
      moonOptions[2] || moonOptions[0]
    ]
  };
  
  // Select message based on day and moon
  const dayOptions = dayThemes[dayName] || moonOptions;
  const degree = transitMoon?.degree || 0;
  const index = Math.floor(degree / 10) % dayOptions.length;
  
  return dayOptions[index];
}
