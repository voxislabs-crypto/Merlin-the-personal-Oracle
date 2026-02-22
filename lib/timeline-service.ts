// lib/timeline-service.ts - Time Machine: Long-range forecasts and life timeline
// Generates narrative-driven timeline of major astro events for next 24 months

import { BirthChartData } from '@/types/astrology';

export interface TimelineEvent {
  date: string; // YYYY-MM-DD
  month: string; // e.g. "March 2026"
  type: 'transit' | 'progressed' | 'return' | 'eclipse' | 'milestone';
  title: string; // e.g. "Saturn Square Sun"
  intensity: 'major' | 'moderate' | 'minor';
  description: string; // Short interpretation
  lifeArea: string; // e.g. "career", "relationships", "inner work"
  guidance: string; // Oracle advice
  affectedPlanets: string[]; // e.g. ["Saturn", "Sun"]
}

export interface TimelinePhase {
  phase: number; // 1-4 quarters
  quarter: string; // Q1, Q2, etc
  season: string; // e.g. "Spring 2026"
  theme: string; // Overall phase theme
  majorEvents: TimelineEvent[];
  phaseNarrative: string; // 2-3 sentence summary
  lifeTheme: string; // "Growth & Integration", "Clearing & Release", etc
  adviceForPhase: string; // Strategic guidance
}

export interface Timeline {
  birthData: {
    date: string;
    time: string;
    location?: string;
  };
  generatedAt: string;
  lookAheadMonths: number; // 12, 18, or 24
  startDate: string;
  endDate: string;
  phases: TimelinePhase[];
  yearlyNarrative: string; // Full interpretation of 12-month cycle
  majorTurningPoints: TimelineEvent[]; // Top 5-7 most significant events
  keyThemes: string[]; // Overarching life themes
}

// Major aspect orbs for transits
const MAJOR_ASPECTS = {
  'Saturn Return': { years: 29.5, intensity: 'major' },
  'Uranus Opposition': { years: 42, intensity: 'major' },
  'Chiron Return': { years: 50, intensity: 'major' },
};

// Planetary cycle patterns (simplified)
const PLANET_CYCLES = {
  'Mercury Retrograde': { frequency: 'every 3-4 months', duration: 'weeks' },
  'Venus Retrograde': { frequency: 'every 19 months', duration: 'weeks' },
  'Mars Retrograde': { frequency: 'every 26 months', duration: 'weeks' },
  'Saturn Transit': { frequency: '2.5 years per sign' },
  'Jupiter Transit': { frequency: '13 months per sign' },
};

/**
 * Generate a narrative-driven timeline for the next 12-24 months
 * Based on major transits, progressions, and life cycles
 */
export async function generateTimeline(
  birthChart: BirthChartData,
  lookAheadMonths: number = 12
): Promise<Timeline> {
  const now = new Date();
  const endDate = new Date(now.getTime() + lookAheadMonths * 30.44 * 24 * 60 * 60 * 1000);

  // Generate timeline phases (quarterly breakdown)
  const phases = generateTimelinePhases(birthChart, now, endDate, lookAheadMonths);

  // Identify major turning points
  const allEvents = phases.flatMap(p => p.majorEvents);
  const majorTurningPoints = allEvents
    .filter(e => e.intensity === 'major')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 7);

  // Extract key themes
  const keyThemes = extractKeyThemes(phases, allEvents);

  // Generate yearly narrative
  const yearlyNarrative = generateYearlyNarrative(phases, majorTurningPoints, keyThemes);

  return {
    birthData: {
      date: birthChart.metadata?.birthDate || 'unknown',
      time: birthChart.metadata?.birthTime || 'unknown',
      location: birthChart.metadata?.location,
    },
    generatedAt: now.toISOString(),
    lookAheadMonths,
    startDate: now.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    phases,
    yearlyNarrative,
    majorTurningPoints,
    keyThemes,
  };
}

/**
 * Generate 4 quarterly phases with major events
 */
function generateTimelinePhases(
  birthChart: BirthChartData,
  startDate: Date,
  endDate: Date,
  lookAheadMonths: number
): TimelinePhase[] {
  const phases: TimelinePhase[] = [];
  const phaseCount = lookAheadMonths <= 12 ? 4 : 8;
  const monthsPerPhase = lookAheadMonths / phaseCount;

  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  const seasonNames = ['Spring', 'Summer', 'Autumn', 'Winter'];

  for (let i = 0; i < phaseCount; i++) {
    const phaseStart = new Date(
      startDate.getTime() + i * monthsPerPhase * 30.44 * 24 * 60 * 60 * 1000
    );
    const phaseEnd = new Date(phaseStart.getTime() + monthsPerPhase * 30.44 * 24 * 60 * 60 * 1000);

    const quarterIndex = i % 4;
    const quarter = quarters[quarterIndex];
    const season = seasonNames[quarterIndex];
    const year = phaseStart.getFullYear();

    // Generate events for this phase
    const majorEvents = generatePhaseEvents(birthChart, phaseStart, phaseEnd);

    // Determine phase theme based on major events
    const theme = derivePhaseTheme(majorEvents, birthChart);
    const lifeTheme = deriveLifeTheme(majorEvents);

    // Generate narrative for phase
    const phaseNarrative = generatePhaseNarrative(theme, majorEvents);
    const adviceForPhase = generatePhaseAdvice(lifeTheme, majorEvents);

    phases.push({
      phase: i + 1,
      quarter: `${quarter} ${year}`,
      season: `${season} ${year}`,
      theme,
      majorEvents,
      phaseNarrative,
      lifeTheme,
      adviceForPhase,
    });
  }

  return phases;
}

/**
 * Generate major events for a specific phase
 */
function generatePhaseEvents(
  birthChart: BirthChartData,
  phaseStart: Date,
  phaseEnd: Date
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // Add major transit events based on planets in birth chart
  const planets = birthChart.planets || [];

  // Simulate major transits (in real implementation, would calculate actual transits)
  for (const planet of planets.slice(0, 5)) {
    // Sample 5 inner planets
    const eventDate = new Date(
      phaseStart.getTime() + Math.random() * (phaseEnd.getTime() - phaseStart.getTime())
    );

    const majorAspects = [
      { aspect: 'Conjunction', symbol: '☌' },
      { aspect: 'Square', symbol: '□' },
      { aspect: 'Trine', symbol: '△' },
      { aspect: 'Opposition', symbol: '☍' },
    ];

    const randomAspect = majorAspects[Math.floor(Math.random() * majorAspects.length)];
    const triggeringPlanets = ['Saturn', 'Jupiter', 'Uranus', 'Neptune'];
    const triggeringPlanet = triggeringPlanets[Math.floor(Math.random() * triggeringPlanets.length)];

    const isHard = ['Square', 'Opposition'].includes(randomAspect.aspect);
    const intensity = Math.random() > 0.6 ? 'major' : Math.random() > 0.3 ? 'moderate' : 'minor';

    events.push({
      date: eventDate.toISOString().split('T')[0],
      month: eventDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      type: 'transit',
      title: `${triggeringPlanet} ${randomAspect.aspect} ${planet.name}`,
      intensity: intensity as 'major' | 'moderate' | 'minor',
      description: generateEventDescription(
        triggeringPlanet,
        randomAspect.aspect,
        planet.name,
        isHard
      ),
      lifeArea: getLifeAreaForPlanet(planet.name, randomAspect.aspect),
      guidance: generateEventGuidance(
        triggeringPlanet,
        randomAspect.aspect,
        planet.name,
        isHard
      ),
      affectedPlanets: [triggeringPlanet, planet.name],
    });
  }

  // Add lunar returns (approximate monthly)
  const lunarReturnDate = new Date(phaseStart);
  lunarReturnDate.setDate(1); // Simplification

  events.push({
    date: lunarReturnDate.toISOString().split('T')[0],
    month: lunarReturnDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    type: 'return',
    title: 'Lunar Month Begins',
    intensity: 'moderate',
    description: 'New lunar cycle brings fresh emotional themes and inner movements.',
    lifeArea: 'emotional cycles',
    guidance: 'Reflect on new emotional themes emerging this month.',
    affectedPlanets: ['Moon'],
  });

  // Sort by date
  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Derive the overall theme for a phase based on events
 */
function derivePhaseTheme(events: TimelineEvent[], birthChart: BirthChartData): string {
  if (events.length === 0) return 'Consolidation & Integration';

  const majorCount = events.filter(e => e.intensity === 'major').length;
  const hardAspects = events.filter(
    e => e.title.includes('Square') || e.title.includes('Opposition')
  ).length;

  if (majorCount >= 2) {
    return hardAspects > 0 ? 'Transformation & Breakthrough' : 'Growth & Expansion';
  }
  if (hardAspects > 2) return 'Challenge & Opportunity';
  return 'Steady Progress';
}

/**
 * Derive life theme based on affected areas
 */
function deriveLifeTheme(events: TimelineEvent[]): string {
  const areas = events.map(e => e.lifeArea);
  const areaCount: Record<string, number> = {};

  areas.forEach(area => {
    areaCount[area] = (areaCount[area] || 0) + 1;
  });

  const topArea = Object.entries(areaCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'life direction';

  const themeMap: Record<string, string> = {
    career: 'Professional Evolution',
    relationships: 'Relational Deepening',
    'inner work': 'Spiritual Awakening',
    'emotional cycles': 'Emotional Maturation',
    'creative expression': 'Artistic Breakthrough',
  };

  return themeMap[topArea] || 'Personal Growth';
}

/**
 * Generate 2-3 sentence narrative for a phase
 */
function generatePhaseNarrative(theme: string, events: TimelineEvent[]): string {
  const eventSummary = events.length > 0 ? `${events.length} significant aspects` : 'mild energy';
  return `This phase brings ${theme}. With ${eventSummary}, expect a mix of growth and reflection. Trust the timing—each event serves your evolution.`;
}

/**
 * Generate strategic advice for a phase
 */
function generatePhaseAdvice(lifeTheme: string, events: TimelineEvent[]): string {
  const hardAspects = events.filter(e => ['Square', 'Opposition'].some(a => e.title.includes(a)))
    .length;

  if (hardAspects > 0) {
    return `Focus on ${lifeTheme.toLowerCase()}. Challenges this phase are catalysts for transformation—lean into them with awareness and intention.`;
  }
  return `This is an optimal time to advance ${lifeTheme.toLowerCase()}. Use this momentum to manifest what you've been envisioning.`;
}

/**
 * Generate event description
 */
function generateEventDescription(
  triggeringPlanet: string,
  aspect: string,
  natalPlanet: string,
  isHard: boolean
): string {
  const intensity = isHard ? 'challenging' : 'harmonious';
  return `${triggeringPlanet} makes a ${intensity} ${aspect} to your natal ${natalPlanet}, activating themes of growth and change.`;
}

/**
 * Generate event guidance
 */
function generateEventGuidance(
  triggeringPlanet: string,
  aspect: string,
  natalPlanet: string,
  isHard: boolean
): string {
  if (isHard) {
    return `Channel the ${triggeringPlanet} energy constructively. This square/opposition creates friction that catalyzes growth.`;
  }
  return `Flow with this ${triggeringPlanet} energy. Trine aspects open doors—take action on what matters.`;
}

/**
 * Determine life area affected by planet
 */
function getLifeAreaForPlanet(planet: string, aspect: string): string {
  const mapping: Record<string, string> = {
    Sun: 'core identity',
    Moon: 'emotional cycles',
    Mercury: 'communication',
    Venus: 'relationships',
    Mars: 'career & action',
    Jupiter: 'expansion & luck',
    Saturn: 'career',
    Uranus: 'innovation',
    Neptune: 'spiritual',
    Pluto: 'transformation',
  };
  return mapping[planet] || 'life direction';
}

/**
 * Extract key themes across all phases
 */
function extractKeyThemes(phases: TimelinePhase[], events: TimelineEvent[]): string[] {
  const themes = new Set<string>();

  // Add life themes from phases
  phases.forEach(p => themes.add(p.lifeTheme));

  // Add planetary themes
  const allPlanets = new Set<string>();
  events.forEach(e => e.affectedPlanets.forEach(p => allPlanets.add(p)));

  const planetThemes: Record<string, string> = {
    Saturn: 'Mastery & Responsibility',
    Jupiter: 'Growth & Expansion',
    Uranus: 'Innovation & Liberation',
    Neptune: 'Spirituality & Intuition',
    Pluto: 'Power & Transformation',
  };

  allPlanets.forEach(planet => {
    if (planetThemes[planet]) themes.add(planetThemes[planet]);
  });

  return Array.from(themes).slice(0, 5);
}

/**
 * Generate full yearly narrative
 */
function generateYearlyNarrative(
  phases: TimelinePhase[],
  turningPoints: TimelineEvent[],
  keyThemes: string[]
): string {
  const firstPhaseTheme = phases[0]?.theme || 'growth';
  const lastPhaseTheme = phases[phases.length - 1]?.theme || 'integration';

  const turningPointsStr = turningPoints.length > 0
    ? turningPoints.slice(0, 3).map(e => e.title).join(', ')
    : 'steady internal development';

  const themesStr = keyThemes.slice(0, 3).join(', ');

  return `Your year unfolds with ${firstPhaseTheme}, building toward ${lastPhaseTheme}. Key turning points include: ${turningPointsStr}. \n\nOverarching themes: ${themesStr}. This cycle asks you to integrate growth while honoring your authentic path. Each challenge is an initiation; each expansion is earned. Trust your timing.`;
}
