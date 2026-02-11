/**
 * Life Arc - Biographical narrative from birth chart
 * Calculates major life transits and generates story beats
 */

import { BirthChartData } from '@/types/astrology';

export interface LifeBeat {
  age: number;
  year: number;
  title: string;
  transit: string;
  narrative: string;
  intensity: 'break' | 'burn' | 'build' | 'shift';
}

export interface LifeArc {
  beats: LifeBeat[];
  summary: string;
  currentPhase: string;
}

/**
 * Calculate age from birth date
 */
function getAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Add years to a date
 */
function addYears(date: string, years: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

/**
 * Calculate Saturn return ages (every ~29 years)
 */
function getSaturnReturns(birthDate: string, currentAge: number): LifeBeat[] {
  const beats: LifeBeat[] = [];
  
  // First Saturn Return (28-30)
  const firstReturn = 29;
  if (currentAge >= firstReturn - 5) {
    const year = addYears(birthDate, firstReturn).getFullYear();
    const narrative = currentAge < firstReturn
      ? `The floor is about to give out. Everything you built on borrowed time collapses. What survives this becomes foundation.`
      : currentAge < firstReturn + 3
      ? `The floor gave out. You're standing in the rubble. This isn't failure. This is the foundation revealing itself.`
      : `You survived the first Saturn return. What died then needed to die. What you built after is real.`;
    
    beats.push({
      age: firstReturn,
      year,
      title: 'The First Test',
      transit: 'Saturn Return',
      narrative,
      intensity: 'break'
    });
  }

  // Second Saturn Return (57-59)
  const secondReturn = 58;
  if (currentAge >= secondReturn - 5 || currentAge < 35) {
    const year = addYears(birthDate, secondReturn).getFullYear();
    const narrative = currentAge < secondReturn
      ? `Around ${year} — the second reckoning. Not about building anymore. About legacy. What did you do with the foundation?`
      : `You faced Saturn twice. The first time broke you open. The second time made you whole.`;
    
    beats.push({
      age: secondReturn,
      year,
      title: 'The Reckoning',
      transit: 'Second Saturn Return',
      narrative,
      intensity: 'build'
    });
  }

  return beats;
}

/**
 * Calculate Uranus opposition (~41-42) - midlife crisis energy
 */
function getUranusOpposition(birthDate: string, currentAge: number): LifeBeat | null {
  const oppositionAge = 42;
  const year = addYears(birthDate, oppositionAge).getFullYear();
  
  if (currentAge >= oppositionAge - 5 && currentAge <= oppositionAge + 5) {
    const narrative = currentAge < oppositionAge
      ? `Around ${year} — Uranus opposition. The cage you built starts shaking. You feel the urge to break everything. Do it carefully.`
      : `Uranus came through. You broke something. Good. That's what it's for. Now build what's actually yours.`;
    
    return {
      age: oppositionAge,
      year,
      title: 'The Rebellion',
      transit: 'Uranus Opposition',
      narrative,
      intensity: 'burn'
    };
  }
  
  return null;
}

/**
 * Calculate Chiron return (~50-51) - the healing
 */
function getChironReturn(birthDate: string, currentAge: number): LifeBeat | null {
  const returnAge = 50;
  const year = addYears(birthDate, returnAge).getFullYear();
  
  if (currentAge >= returnAge - 3 && currentAge <= returnAge + 5) {
    const narrative = currentAge < returnAge
      ? `Around ${year} — Chiron return. The wound you've been running from becomes the teacher. You stop hiding it. You start using it.`
      : `Chiron came home. The wound didn't close. It became wisdom. Now you teach what hurt you.`;
    
    return {
      age: returnAge,
      year,
      title: 'The Healing',
      transit: 'Chiron Return',
      narrative,
      intensity: 'build'
    };
  }
  
  return null;
}

/**
 * Calculate Pluto square/opposition based on natal Pluto position
 */
function getPlutoTransit(chart: BirthChartData, birthDate: string, currentAge: number): LifeBeat | null {
  const pluto = chart.planets.find(p => p.name === 'Pluto');
  if (!pluto) return null;

  // Pluto takes ~248 years for full cycle
  // Square happens at ~1/4 and 3/4 of cycle
  // For most people born after 1930s, first square is around 36-46 depending on sign
  
  // Approximate age based on sign
  const signAges: Record<string, number> = {
    'Leo': 38,
    'Virgo': 40,
    'Libra': 42,
    'Scorpio': 44,
    'Sagittarius': 46,
    'Capricorn': 36,
    'Aquarius': 34,
    'Pisces': 32
  };

  const transitAge = signAges[pluto.sign] || 40;
  const year = addYears(birthDate, transitAge).getFullYear();

  if (currentAge >= transitAge - 5 && currentAge <= transitAge + 5) {
    const narrative = currentAge < transitAge
      ? `Around ${year} — Pluto square. The mask comes off. Not gently. Everything you pretended stops working. What's underneath is real.`
      : `Pluto tore through. The old self died. Not metaphorically. You don't recognize who you were before. Good. That means it worked.`;

    return {
      age: transitAge,
      year,
      title: 'The Death',
      transit: 'Pluto Square',
      narrative,
      intensity: 'burn'
    };
  }

  return null;
}

/**
 * Calculate Jupiter returns (every ~12 years) - expansion moments
 */
function getJupiterReturns(birthDate: string, currentAge: number): LifeBeat[] {
  const beats: LifeBeat[] = [];
  const jupiterCycle = 12;
  
  // Get relevant Jupiter returns (only show upcoming or recent ones)
  for (let cycle = 1; cycle <= 7; cycle++) {
    const age = jupiterCycle * cycle;
    if (Math.abs(currentAge - age) <= 3) {
      const year = addYears(birthDate, age).getFullYear();
      const narrative = currentAge < age
        ? `At ${age} (${year}) — Jupiter return. A door opens. Not luck. Recognition. Walk through.`
        : `At ${age} — Jupiter came back. You walked through the door. What you found there changes everything.`;
      
      beats.push({
        age,
        year,
        title: `The Opening (${cycle}${cycle === 1 ? 'st' : cycle === 2 ? 'nd' : cycle === 3 ? 'rd' : 'th'})`,
        transit: 'Jupiter Return',
        narrative,
        intensity: 'build'
      });
    }
  }
  
  return beats;
}

/**
 * Calculate progressed Moon return (~27-28 years) - emotional reset
 */
function getProgressedMoonReturn(birthDate: string, currentAge: number): LifeBeat | null {
  const returnAge = 27;
  const year = addYears(birthDate, returnAge).getFullYear();
  
  if (currentAge >= returnAge - 2 && currentAge <= returnAge + 2) {
    const narrative = currentAge < returnAge
      ? `Around ${year} — progressed Moon return. Everything you felt becomes clear. The emotional cycle completes. You start over, wiser.`
      : `The progressed Moon came home. You feel different. More yourself. The emotional chaos settled into knowing.`;
    
    return {
      age: returnAge,
      year,
      title: 'The Emotional Return',
      transit: 'Progressed Moon Return',
      narrative,
      intensity: 'shift'
    };
  }
  
  return null;
}

/**
 * Generate life arc narrative from birth chart
 */
export function calculateLifeArc(chart: BirthChartData, birthDate: string): LifeArc {
  const currentAge = getAge(birthDate);
  
  // Collect all potential beats
  const allBeats: LifeBeat[] = [
    ...getSaturnReturns(birthDate, currentAge),
    getUranusOpposition(birthDate, currentAge),
    getChironReturn(birthDate, currentAge),
    getPlutoTransit(chart, birthDate, currentAge),
    ...getJupiterReturns(birthDate, currentAge),
    getProgressedMoonReturn(birthDate, currentAge),
  ].filter((beat): beat is LifeBeat => beat !== null);

  // Sort by age
  allBeats.sort((a, b) => a.age - b.age);

  // Select the 3 most significant beats
  // Priority: major outer planets > Jupiter > progressed Moon
  const priorityOrder = ['break', 'burn', 'build', 'shift'];
  const selectedBeats = allBeats
    .sort((a, b) => {
      // First sort by proximity to current age (within 5 years is most relevant)
      const aProximity = Math.abs(a.age - currentAge);
      const bProximity = Math.abs(b.age - currentAge);
      const aRelevant = aProximity <= 5 ? 0 : 1;
      const bRelevant = bProximity <= 5 ? 0 : 1;
      
      if (aRelevant !== bRelevant) return aRelevant - bRelevant;
      
      // Then by intensity priority
      const aPriority = priorityOrder.indexOf(a.intensity);
      const bPriority = priorityOrder.indexOf(b.intensity);
      if (aPriority !== bPriority) return aPriority - bPriority;
      
      // Finally by age (earlier first)
      return a.age - b.age;
    })
    .slice(0, 3);

  // Generate summary
  const summary = generateSummary(selectedBeats, currentAge);
  const currentPhase = getCurrentPhase(currentAge, selectedBeats);

  return {
    beats: selectedBeats,
    summary,
    currentPhase
  };
}

/**
 * Generate overall summary from selected beats
 */
function generateSummary(beats: LifeBeat[], currentAge: number): string {
  if (beats.length === 0) {
    return "Your chart is quiet right now. The major arcs are distant. This is the in-between. Build quietly.";
  }

  const pastBeats = beats.filter(b => currentAge >= b.age);
  const futureBeats = beats.filter(b => currentAge < b.age);

  let summary = "";

  if (pastBeats.length > 0 && futureBeats.length > 0) {
    summary = `You've already survived ${pastBeats.map(b => b.title.toLowerCase()).join(', ')}. What's coming: ${futureBeats.map(b => b.title.toLowerCase()).join(', ')}. You're ready.`;
  } else if (pastBeats.length > 0) {
    summary = `You've walked through ${pastBeats.map(b => b.title.toLowerCase()).join(', ')}. The next major shift is still years away. This is the harvest time.`;
  } else {
    summary = `Ahead of you: ${futureBeats.map(b => b.title.toLowerCase()).join(', ')}. The tests are coming. You're in the preparation phase. Build your foundation.`;
  }

  return summary;
}

/**
 * Determine current life phase
 */
function getCurrentPhase(currentAge: number, beats: LifeBeat[]): string {
  // Find the most recent beat
  const pastBeats = beats.filter(b => currentAge >= b.age);
  if (pastBeats.length === 0) {
    return "Pre-initiation — building the self that will be tested.";
  }

  const mostRecent = pastBeats[pastBeats.length - 1];
  const yearsSince = currentAge - mostRecent.age;

  if (yearsSince <= 2) {
    return `Fresh out of ${mostRecent.title.toLowerCase()} — integrating the lesson.`;
  } else if (yearsSince <= 5) {
    return `Post-${mostRecent.title.toLowerCase()} — applying what you learned.`;
  } else {
    // Check if next beat is approaching
    const futureBeats = beats.filter(b => currentAge < b.age);
    if (futureBeats.length > 0) {
      const next = futureBeats[0];
      const yearsUntil = next.age - currentAge;
      if (yearsUntil <= 3) {
        return `Approaching ${next.title.toLowerCase()} — the pressure is building.`;
      }
    }
    return "Between major arcs — the quiet work matters most right now.";
  }
}
