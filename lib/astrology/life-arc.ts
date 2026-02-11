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
 * Calculate Neptune square (~40-42) - dissolution of illusions
 */
function getNeptuneSquare(birthDate: string, currentAge: number): LifeBeat | null {
  const squareAge = 41;
  const year = addYears(birthDate, squareAge).getFullYear();
  
  if (currentAge >= squareAge - 3 && currentAge <= squareAge + 3) {
    const narrative = currentAge < squareAge
      ? `Around ${year} — Neptune square. The fog rolls in. What you thought was solid starts dissolving. This isn't confusion. This is clarity demanding you look deeper.`
      : currentAge <= squareAge + 1
      ? `Neptune square hit. The illusions are gone. What felt like losing your grip was actually letting go of the lies. Now you see what's real.`
      : `You survived Neptune's fog. The spiritual crisis became awakening. What dissolved needed to dissolve. What remains is true.`;
    
    return {
      age: squareAge,
      year,
      title: 'The Dissolution',
      transit: 'Neptune Square',
      narrative,
      intensity: 'burn'
    };
  }
  
  return null;
}

/**
 * Calculate Nodal Return/Opposition (~18.6 year cycle)
 */
function getNodalReturns(birthDate: string, currentAge: number): LifeBeat[] {
  const beats: LifeBeat[] = [];
  const nodalCycle = 18.6;
  
  // First opposition (~9), First return (~19), Second opposition (~28), Second return (~37), etc.
  // Focus on the most significant: ages 19, 37, 56
  
  const significantAges = [19, 37, 56];
  
  significantAges.forEach((age, idx) => {
    if (Math.abs(currentAge - age) <= 2) {
      const year = addYears(birthDate, age).getFullYear();
      const isReturn = idx % 2 === 1 || idx === 0; // Simplified: 19 and 37 are returns
      
      let narrative: string;
      let title: string;
      
      if (age === 19) {
        narrative = currentAge < age
          ? `At ${age} (${year}) — first Nodal return. The path reveals itself. Not the one you imagined. The one you're meant for.`
          : `At ${age} — the Nodes aligned. You saw the path. Whether you took it or resisted it shaped everything after.`;
        title = 'The Path Appears';
      } else if (age === 37) {
        narrative = currentAge < age
          ? `At ${age} (${year}) — second Nodal return. Karmic redirection. The choice: comfort zone or destiny. Choose carefully. The Nodes remember.`
          : `At ${age} — the Nodes came back. The path demanded attention again. This time you knew what it meant to ignore destiny.`;
        title = 'The Karmic Choice';
      } else {
        narrative = currentAge < age
          ? `At ${age} (${year}) — third Nodal return. You've walked this path twice. Now you teach it. The karmic cycle completes.`
          : `At ${age} — the Nodes returned a third time. You're no longer the student. You're the guide.`;
        title = 'The Elder Path';
      }
      
      beats.push({
        age,
        year,
        title,
        transit: 'Nodal Return',
        narrative,
        intensity: 'shift'
      });
    }
  });
  
  return beats;
}

/**
 * Calculate early life Jupiter returns (setup phase)
 */
function getEarlyJupiterReturns(birthDate: string, currentAge: number): LifeBeat[] {
  const beats: LifeBeat[] = [];
  
  // First Jupiter return at 12 - first real door
  if (Math.abs(currentAge - 12) <= 2 || (currentAge < 12 && currentAge >= 8)) {
    const year = addYears(birthDate, 12).getFullYear();
    const narrative = currentAge < 12
      ? `At 12 (${year}) — first Jupiter return. The first real door opens. You don't know what's on the other side yet. Walk through anyway.`
      : `At 12 — Jupiter came the first time. That door you walked through changed everything. You just didn't know it yet.`;
    
    beats.push({
      age: 12,
      year,
      title: 'The First Door',
      transit: 'First Jupiter Return',
      narrative,
      intensity: 'build'
    });
  }
  
  // Second Jupiter return at 24 - identity expansion
  if (Math.abs(currentAge - 24) <= 2) {
    const year = addYears(birthDate, 24).getFullYear();
    const narrative = currentAge < 24
      ? `At 24 (${year}) — second Jupiter return. Your world expands. Not externally. Internally. You realize you're bigger than you thought.`
      : `At 24 — Jupiter returned. The world got bigger. You got bolder. The preparation phase ended.`;
    
    beats.push({
      age: 24,
      year,
      title: 'The Expansion',
      transit: 'Second Jupiter Return',
      narrative,
      intensity: 'build'
    });
  }
  
  return beats;
}

/**
 * Generate life arc narrative from birth chart
 */
export function calculateLifeArc(chart: BirthChartData, birthDate: string): LifeArc {
  const currentAge = getAge(birthDate);
  
  // Collect all potential beats
  const allBeats: LifeBeat[] = [
    ...getEarlyJupiterReturns(birthDate, currentAge),
    ...getSaturnReturns(birthDate, currentAge),
    getUranusOpposition(birthDate, currentAge),
    getNeptuneSquare(birthDate, currentAge),
    getChironReturn(birthDate, currentAge),
    getPlutoTransit(chart, birthDate, currentAge),
    ...getNodalReturns(birthDate, currentAge),
    getProgressedMoonReturn(birthDate, currentAge),
  ].filter((beat): beat is LifeBeat => beat !== null);

  // Sort by age
  allBeats.sort((a, b) => a.age - b.age);

  // Select beats based on user's life phase
  let selectedBeats: LifeBeat[];
  
  if (currentAge < 28) {
    // Young users: 1 past/present + 2 near future (emphasize what's coming)
    const past = allBeats.filter(b => b.age <= currentAge).slice(-1);
    const future = allBeats.filter(b => b.age > currentAge).slice(0, 2);
    selectedBeats = [...past, ...future];
  } else if (currentAge >= 50) {
    // Mature users: 2 past defining moments + 1 integration/legacy beat
    const past = allBeats.filter(b => b.age <= currentAge && ['break', 'burn'].includes(b.intensity)).slice(-2);
    const integration = allBeats.filter(b => b.age > currentAge || (b.age <= currentAge && b.intensity === 'build')).slice(-1);
    selectedBeats = [...past, ...integration];
  } else {
    // Midlife: Classic 3-beat structure prioritizing proximity and intensity
    const priorityOrder = ['break', 'burn', 'build', 'shift'];
    selectedBeats = allBeats
      .sort((a, b) => {
        const aProximity = Math.abs(a.age - currentAge);
        const bProximity = Math.abs(b.age - currentAge);
        const aRelevant = aProximity <= 5 ? 0 : 1;
        const bRelevant = bProximity <= 5 ? 0 : 1;
        
        if (aRelevant !== bRelevant) return aRelevant - bRelevant;
        
        const aPriority = priorityOrder.indexOf(a.intensity);
        const bPriority = priorityOrder.indexOf(b.intensity);
        if (aPriority !== bPriority) return aPriority - bPriority;
        
        return a.age - b.age;
      })
      .slice(0, 3);
  }
  
  // Ensure we have at least 3 beats, fill with most significant if needed
  if (selectedBeats.length < 3) {
    const remaining = allBeats.filter(b => !selectedBeats.includes(b)).slice(0, 3 - selectedBeats.length);
    selectedBeats = [...selectedBeats, ...remaining];
  }
  
  // Final sort by age for display
  selectedBeats.sort((a, b) => a.age - b.age);

  // Generate summary
  const summary = generateSummary(selectedBeats, currentAge);
  const currentPhase = getCurrentPhase(currentAge, selectedBeats, allBeats);

  return {
    beats: selectedBeats,
    summary,
    currentPhase
  };
}

/**
 * Generate overall summary from selected beats with age-aware narrative
 */
function generateSummary(beats: LifeBeat[], currentAge: number): string {
  if (beats.length === 0) {
    return "Your chart is quiet right now. The major arcs are distant. This is the in-between. Build quietly.";
  }

  const pastBeats = beats.filter(b => currentAge >= b.age);
  const futureBeats = beats.filter(b => currentAge < b.age);
  
  // Age-aware narrative framing
  let summary = "";
  
  if (currentAge < 28) {
    // Young users: Emphasize preparation and upcoming tests
    if (futureBeats.length > 0) {
      const nextMajor = futureBeats[0];
      const yearsAway = nextMajor.age - currentAge;
      summary = `You're in the setup phase. ${nextMajor.title} arrives in ${yearsAway} year${yearsAway === 1 ? '' : 's'} at age ${nextMajor.age}. `;
      
      if (pastBeats.length > 0) {
        summary += `You've already felt ${pastBeats[0].title.toLowerCase()}—that was the preview. `;
      }
      
      summary += `What's coming: ${futureBeats.slice(0, 2).map(b => `${b.title.toLowerCase()} (age ${b.age})`).join(', ')}. Build your foundation. The tests are coming.`;
    } else {
      summary = "You're gathering strength. The major story beats lie ahead. This quiet time matters—everything you build now becomes ammunition later.";
    }
  } else if (currentAge >= 50) {
    // Mature users: Emphasize wisdom, integration, legacy
    if (pastBeats.length >= 2) {
      const majorPast = pastBeats.filter(b => ['break', 'burn'].includes(b.intensity));
      if (majorPast.length > 0) {
        summary = `You've walked through fire: ${majorPast.map(b => b.title.toLowerCase()).join(', ')}. `;
      }
    }
    
    if (futureBeats.length > 0) {
      const upcoming = futureBeats[0];
      summary += `What's ahead isn't more breaking—it's ${upcoming.title.toLowerCase()}. Integration. Wisdom. The harvest time. `;
    } else {
      summary += `The tests are behind you. This is harvest time. What you're building now is legacy, not survival.`;
    }
    
    summary += "You're no longer the student. You're the one who remembers.";
  } else {
    // Midlife (28-50): Classic hero's journey structure
    if (pastBeats.length > 0 && futureBeats.length > 0) {
      const recentPast = pastBeats[pastBeats.length - 1];
      const nearFuture = futureBeats[0];
      
      summary = `You survived ${recentPast.title.toLowerCase()} at age ${recentPast.age}. That's the proof you were built for this. `;
      
      const yearsUntilNext = nearFuture.age - currentAge;
      if (yearsUntilNext <= 3) {
        summary += `${nearFuture.title} is ${yearsUntilNext} year${yearsUntilNext === 1 ? '' : 's'} away. The ground is already trembling. `;
      } else {
        summary += `${nearFuture.title} arrives at ${nearFuture.age}. `;
      }
      
      summary += futureBeats.length > 1 
        ? `After that: ${futureBeats.slice(1, 2).map(b => b.title.toLowerCase()).join(', ')}. This is your crucible phase. The myth gets written here.`
        : "The next chapter is already taking shape. You're ready.";
    } else if (pastBeats.length > 0) {
      const battles = pastBeats.filter(b => ['break', 'burn'].includes(b.intensity));
      if (battles.length > 0) {
        summary = `You've survived ${battles.map(b => b.title.toLowerCase()).join(', ')}. The heavy transits are behind you. What you're in now is the integration phase—using what the fire forged.`;
      } else {
        summary = `The major building phases: ${pastBeats.map(b => b.title.toLowerCase()).join(', ')}. You're past the setup. The foundation is set. Now you build the temple.`;
      }
    } else {
      const upcoming = futureBeats.slice(0, 3);
      summary = `The story is about to get intense. Ahead: ${upcoming.map(b => `${b.title.toLowerCase()} (age ${b.age})`).join(', ')}. This is the calm before. Use it.`;
    }
  }
  
  return summary;
}

/**
 * Determine current life phase with age-aware emphasis
 */
function getCurrentPhase(currentAge: number, beats: LifeBeat[], allBeats: LifeBeat[]): string {
  // Life stage context
  let stageContext = "";
  if (currentAge < 12) {
    stageContext = "Childhood — the seeds are being planted. ";
  } else if (currentAge < 28) {
    stageContext = "Formation — becoming who you'll be when the tests arrive. ";
  } else if (currentAge < 50) {
    stageContext = "Crucible — this is where the myth gets written. ";
  } else if (currentAge < 65) {
    stageContext = "Integration — the battles are won. Now comes the harvest. ";
  } else {
    stageContext = "Legacy — what you leave behind is already taking shape. ";
  }
  
  // Find the most recent beat
  const pastBeats = beats.filter(b => currentAge >= b.age);
  if (pastBeats.length === 0) {
    return stageContext + "The major tests lie ahead.";
  }

  const mostRecent = pastBeats[pastBeats.length - 1];
  const yearsSince = currentAge - mostRecent.age;

  if (yearsSince <= 2) {
    return stageContext + `Fresh out of ${mostRecent.title.toLowerCase()} — the wound is still raw, the lesson still sinking in.`;
  } else if (yearsSince <= 5) {
    return stageContext + `Post-${mostRecent.title.toLowerCase()} — you're using what it taught you.`;
  } else {
    // Check if next beat is approaching
    const futureBeats = allBeats.filter(b => currentAge < b.age).sort((a, b) => a.age - b.age);
    if (futureBeats.length > 0) {
      const next = futureBeats[0];
      const yearsUntil = next.age - currentAge;
      if (yearsUntil <= 1) {
        return stageContext + `${next.title} arrives THIS YEAR. The ground is already trembling.`;
      } else if (yearsUntil <= 3) {
        return stageContext + `Approaching ${next.title.toLowerCase()} — the pressure is building. Prepare.`;
      } else if (yearsUntil <= 5) {
        return stageContext + `${next.title} on the horizon. You have time. Use it.`;
      }
    }
    return stageContext + "Between major arcs. This is the quiet work. It matters.";
  }
}
