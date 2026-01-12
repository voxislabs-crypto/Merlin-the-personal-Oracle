import { calculateBirthChart } from '../engine-fallback';
import { BirthChartData, PlanetPosition } from '../../types/astrology';

export interface DailyForecast {
  date: string;
  summary: string;
  planetaryHighlights: string[];
  moonPhase: string;
  transits: string[];
  advice: string;
}

export function getTodaysForecast(birthChart: BirthChartData): DailyForecast {
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];

  // Calculate today's transits
  const todaysChart = calculateBirthChart(
    dateString,
    '12:00:00', // Noon for daily transits
    birthChart.birthData.coordinates?.lat || 0,
    birthChart.birthData.coordinates?.lon || 0
  );

  // Find significant transits
  const significantTransits: string[] = [];
  const planetaryHighlights: string[] = [];

  // Check for major aspects between natal and transit planets
  birthChart.positions.forEach(natalPlanet => {
    todaysChart.positions.forEach(transitPlanet => {
      if (natalPlanet.name === transitPlanet.name) {
        // Check if planet is at a significant degree
        const degree = Math.floor(transitPlanet.longitude % 30);
        if (degree === 0 || degree === 15 || degree === 22 || degree === 29) {
          planetaryHighlights.push(`${natalPlanet.name} is at ${degree}° ${transitPlanet.sign}`);
        }
      }
    });
  });

  // Generate moon phase info
  const moonPhase = todaysChart.moonPhase?.type || 'Unknown';

  // Create summary based on dominant energies
  let summary = "Today brings ";
  const dominantPlanets = birthChart.positions.slice(0, 3).map(p => p.name);
  summary += `energies from ${dominantPlanets.join(', ')}. `;

  if (planetaryHighlights.length > 0) {
    summary += `Key highlights: ${planetaryHighlights.join(', ')}. `;
  }

  summary += `The Moon is in ${moonPhase} phase, influencing your emotional landscape.`;

  // Generate advice
  const advice = generateDailyAdvice(birthChart, todaysChart);

  return {
    date: dateString,
    summary,
    planetaryHighlights,
    moonPhase,
    transits: significantTransits,
    advice
  };
}

function generateDailyAdvice(birthChart: BirthChartData, todaysChart: BirthChartData): string {
  // Simple advice generation based on sun sign and moon phase
  const sunSign = birthChart.positions.find(p => p.name === 'Sun')?.sign || 'Unknown';
  const moonPhase = todaysChart.moonPhase?.type || 'Unknown';

  let advice = `As a ${sunSign}, today is a good day to `;

  switch (moonPhase) {
    case 'New Moon':
      advice += 'plant seeds for new beginnings and set intentions.';
      break;
    case 'Waxing Crescent':
    case 'First Quarter':
    case 'Waxing Gibbous':
      advice += 'take action on your goals and build momentum.';
      break;
    case 'Full Moon':
      advice += 'reflect on your progress and release what no longer serves you.';
      break;
    case 'Waning Gibbous':
    case 'Last Quarter':
    case 'Waning Crescent':
      advice += 'focus on completion, letting go, and inner work.';
      break;
    default:
      advice += 'trust your intuition and stay grounded.';
  }

  return advice;
}