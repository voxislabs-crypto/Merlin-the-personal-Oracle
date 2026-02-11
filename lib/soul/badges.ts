// Trial by Fire Badge System - Detect and honor heavy aspects in natal charts
import { BirthChartData, Aspect } from "@/types/astrology";

export interface Badge {
  name: string;
  description: string;
  icon: string; // emoji or unicode symbol
  rarity: "common" | "rare" | "legendary";
  earnedBy: string; // What aspect pattern earned it
}

export interface ChartBadges {
  badges: Badge[];
  totalCount: number;
  legendary: Badge[];
}

// Detect "Trial by Fire" signature
function detectTrialByFire(aspects: Aspect[]): boolean {
  // Saturn square/opposition Pluto
  const saturnPluto = aspects.find(
    (a) =>
      ((a.planet1.name === "Saturn" && a.planet2.name === "Pluto") ||
        (a.planet1.name === "Pluto" && a.planet2.name === "Saturn")) &&
      (a.type === "Square" || a.type === "Opposition")
  );

  if (saturnPluto) return true;

  // Alternative: 5+ hard aspects (squares/oppositions)
  const hardAspectCount = aspects.filter(
    (a) => a.type === "Square" || a.type === "Opposition"
  ).length;

  return hardAspectCount >= 5;
}

// Detect "Phoenix Rising" - heavy Pluto aspects + transformative placements
function detectPhoenixRising(chartData: BirthChartData): boolean {
  const plutoAspects = chartData.aspects.filter(
    (a) =>
      (a.planet1.name === "Pluto" || a.planet2.name === "Pluto") &&
      (a.type === "Square" || a.type === "Conjunction" || a.type === "Opposition")
  );

  // 3+ hard Pluto aspects
  if (plutoAspects.length >= 3) return true;

  // Sun or Moon in Scorpio + Pluto aspect
  const sunOrMoon = chartData.positions.filter(
    (p) => (p.name === "Sun" || p.name === "Moon") && p.sign === "Scorpio"
  );

  return sunOrMoon.length > 0 && plutoAspects.length >= 2;
}

// Detect "Soul Warrior" - Mars + Saturn hard aspects
function detectSoulWarrior(aspects: Aspect[]): boolean {
  const marsSaturn = aspects.find(
    (a) =>
      ((a.planet1.name === "Mars" && a.planet2.name === "Saturn") ||
        (a.planet1.name === "Saturn" && a.planet2.name === "Mars")) &&
      (a.type === "Square" || a.type === "Opposition" || a.type === "Conjunction")
  );

  return !!marsSaturn;
}

// Detect "Mystic Heart" - Neptune + Moon/Venus in water signs
function detectMysticHeart(chartData: BirthChartData): boolean {
  const waterSigns = ["Cancer", "Scorpio", "Pisces"];

  const moonOrVenusInWater = chartData.positions.filter(
    (p) =>
      (p.name === "Moon" || p.name === "Venus") &&
      waterSigns.includes(p.sign)
  );

  const neptuneAspects = chartData.aspects.filter(
    (a) =>
      (a.planet1.name === "Neptune" || a.planet2.name === "Neptune") &&
      (a.type === "Trine" || a.type === "Conjunction")
  );

  return moonOrVenusInWater.length >= 1 && neptuneAspects.length >= 2;
}

// Detect "Lightning Rod" - Uranus prominently aspected
function detectLightningRod(aspects: Aspect[]): boolean {
  const uranusAspects = aspects.filter(
    (a) =>
      (a.planet1.name === "Uranus" || a.planet2.name === "Uranus") &&
      (a.type === "Square" || a.type === "Conjunction" || a.type === "Opposition")
  );

  return uranusAspects.length >= 3;
}

// Detect "Grand Cross" - 4 planets at 90° intervals
function detectGrandCross(aspects: Aspect[]): boolean {
  // Simplified: check for 2+ oppositions + 4+ squares
  const oppositions = aspects.filter((a) => a.type === "Opposition");
  const squares = aspects.filter((a) => a.type === "Square");

  return oppositions.length >= 2 && squares.length >= 4;
}

// Detect "Grand Trine" - 3 planets at 120° intervals (harmonious)
function detectGrandTrine(aspects: Aspect[]): boolean {
  const trines = aspects.filter((a) => a.type === "Trine");
  return trines.length >= 3;
}

// Main function: Analyze chart and award badges
export function awardBadges(chartData: BirthChartData): ChartBadges {
  const badges: Badge[] = [];

  // Legendary badges
  if (detectTrialByFire(chartData.aspects)) {
    badges.push({
      name: "Trial by Fire",
      description:
        "You've survived the forge. Saturn square Pluto. Nothing came easy. Every gift was earned. You are forged steel.",
      icon: "🔥",
      rarity: "legendary",
      earnedBy: "Saturn square/opposition Pluto or 5+ hard aspects",
    });
  }

  if (detectPhoenixRising(chartData)) {
    badges.push({
      name: "Phoenix Rising",
      description:
        "You've died and been reborn more times than most people blink. Transformation is your birthright.",
      icon: "🦅",
      rarity: "legendary",
      earnedBy: "3+ hard Pluto aspects or Scorpio luminaries with Pluto aspects",
    });
  }

  if (detectGrandCross(chartData.aspects)) {
    badges.push({
      name: "Cardinal Cross",
      description:
        "Your chart is a battlefield. Four corners pulling you in every direction. You are learning to stand in the center.",
      icon: "✨",
      rarity: "legendary",
      earnedBy: "Grand Cross aspect pattern (2 oppositions + 4 squares)",
    });
  }

  // Rare badges
  if (detectSoulWarrior(chartData.aspects)) {
    badges.push({
      name: "Soul Warrior",
      description:
        "Mars meets Saturn. Your will is tempered by discipline. You don't quit — even when you should.",
      icon: "⚔️",
      rarity: "rare",
      earnedBy: "Mars square/opposition/conjunction Saturn",
    });
  }

  if (detectLightningRod(chartData.aspects)) {
    badges.push({
      name: "Lightning Rod",
      description:
        "Uranus strikes your chart like electricity. You're wired for revolution, innovation, and shattering the old.",
      icon: "⚡",
      rarity: "rare",
      earnedBy: "3+ hard Uranus aspects",
    });
  }

  // Common (but meaningful) badges
  if (detectMysticHeart(chartData)) {
    badges.push({
      name: "Mystic Heart",
      description:
        "Your emotional world is oceanic. Neptune and water placements make you a conduit for the unseen.",
      icon: "🌊",
      rarity: "common",
      earnedBy: "Moon/Venus in water signs + 2+ Neptune trines/conjunctions",
    });
  }

  if (detectGrandTrine(chartData.aspects)) {
    badges.push({
      name: "Natural Flow",
      description:
        "Your chart contains a Grand Trine. Gifts come easily — but the challenge is using them.",
      icon: "🌀",
      rarity: "common",
      earnedBy: "Grand Trine aspect pattern (3+ trines forming triangle)",
    });
  }

  // Return results
  const legendary = badges.filter((b) => b.rarity === "legendary");

  return {
    badges,
    totalCount: badges.length,
    legendary,
  };
}

// Get badge for display
export function getBadgeDisplay(badge: Badge): {
  icon: string;
  name: string;
  description: string;
  color: string;
} {
  const colorMap: Record<typeof badge.rarity, string> = {
    legendary: "#fcd34d", // Golden
    rare: "#a78bfa", // Purple
    common: "#60a5fa", // Blue
  };

  return {
    icon: badge.icon,
    name: badge.name,
    description: badge.description,
    color: colorMap[badge.rarity],
  };
}

// Check if user has specific badge
export function hasBadge(
  chartBadges: ChartBadges,
  badgeName: string
): boolean {
  return chartBadges.badges.some((b) => b.name === badgeName);
}

// Get rarity level description
export function getRarityDescription(
  rarity: Badge["rarity"]
): string {
  const descriptions: Record<typeof rarity, string> = {
    legendary:
      "Less than 5% of charts have this. You are rare.",
    rare: "Uncommon. This aspect pattern marks you as someone who's walked through fire.",
    common:
      "Many have this, but that doesn't diminish its power. It's part of your story.",
  };

  return descriptions[rarity];
}

// Get all possible badges (for reference)
export function getAllPossibleBadges(): Badge[] {
  return [
    {
      name: "Trial by Fire",
      description: "Saturn square Pluto. Forged through discipline and transformation.",
      icon: "🔥",
      rarity: "legendary",
      earnedBy: "Saturn-Pluto hard aspect or 5+ squares/oppositions",
    },
    {
      name: "Phoenix Rising",
      description: "Multiple Pluto aspects. Death and rebirth is your cycle.",
      icon: "🦅",
      rarity: "legendary",
      earnedBy: "3+ hard Pluto aspects",
    },
    {
      name: "Cardinal Cross",
      description: "Grand Cross. Four-way tension creates diamonds.",
      icon: "✨",
      rarity: "legendary",
      earnedBy: "Grand Cross pattern",
    },
    {
      name: "Soul Warrior",
      description: "Mars-Saturn. Your will is disciplined, relentless.",
      icon: "⚔️",
      rarity: "rare",
      earnedBy: "Mars-Saturn hard aspect",
    },
    {
      name: "Lightning Rod",
      description: "Uranus-heavy. You attract change, innovation, upheaval.",
      icon: "⚡",
      rarity: "rare",
      earnedBy: "3+ hard Uranus aspects",
    },
    {
      name: "Mystic Heart",
      description: "Neptune + water. You feel what others can't even name.",
      icon: "🌊",
      rarity: "common",
      earnedBy: "Water placements + Neptune harmony",
    },
    {
      name: "Natural Flow",
      description: "Grand Trine. Gifts flow easily — use them wisely.",
      icon: "🌀",
      rarity: "common",
      earnedBy: "Grand Trine pattern",
    },
  ];
}
