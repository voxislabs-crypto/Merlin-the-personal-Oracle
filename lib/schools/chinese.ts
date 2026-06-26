// Chinese Astrology Insights
import { BirthChartData } from "@/types/astrology";

export interface SchoolInsight {
  insight: string;
  themes: string[];
}

// Chinese zodiac animals by year (simplified)
const CHINESE_ANIMALS = [
  "Rat",
  "Ox",
  "Tiger",
  "Rabbit",
  "Dragon",
  "Snake",
  "Horse",
  "Goat",
  "Monkey",
  "Rooster",
  "Dog",
  "Pig",
];

function getChineseYear(year: number): string {
  // 1924 was Rat year (base year)
  const baseYear = 1924;
  const index = (year - baseYear) % 12;
  return CHINESE_ANIMALS[index];
}

export function getChineseInsight(
  natal: BirthChartData,
  transits: any[],
  date: Date
): SchoolInsight {
  const themes: string[] = [];
  let insight = "";

  const currentYear = date.getFullYear();
  const currentAnimal = getChineseYear(currentYear);

  // Year-specific wisdom
  switch (currentAnimal) {
    case "Rat":
      insight = "Year of the Rat. New cycles. Small moves, big impact.";
      themes.push("beginnings", "resourcefulness");
      break;
    case "Ox":
      insight = "Year of the Ox. Steady. Build foundations, not castles.";
      themes.push("patience", "groundedness");
      break;
    case "Tiger":
      insight = "Year of the Tiger. Courage. Leap, but look first.";
      themes.push("bravery", "action");
      break;
    case "Rabbit":
      insight = "Year of the Rabbit. Gentleness. Soft power wins.";
      themes.push("sensitivity", "diplomacy");
      break;
    case "Dragon":
      insight = "Year of the Dragon. Power. Wield it wisely.";
      themes.push("transformation", "leadership");
      break;
    case "Snake":
      insight = "Year of the Snake. Shed. Don't cling to what's already dead.";
      themes.push("release", "wisdom");
      break;
    case "Horse":
      insight = "Year of the Horse. Freedom. Run toward, not away.";
      themes.push("independence", "courage");
      break;
    case "Goat":
      insight = "Year of the Goat. Creativity. Make beauty from chaos.";
      themes.push("artistry", "harmony");
      break;
    case "Monkey":
      insight = "Year of the Monkey. Cleverness. Adapt, improvise, thrive.";
      themes.push("intelligence", "flexibility");
      break;
    case "Rooster":
      insight = "Year of the Rooster. Honesty. Speak your truth loudly.";
      themes.push("integrity", "confidence");
      break;
    case "Dog":
      insight = "Year of the Dog. Loyalty. Protect what matters.";
      themes.push("devotion", "justice");
      break;
    case "Pig":
      insight = "Year of the Pig. Abundance. Enjoy, but don't hoard.";
      themes.push("generosity", "pleasure");
      break;
  }

  // Check for birth year animal (from natal chart birth date)
  if (natal.birthData?.birthDate) {
    const birthYear = new Date(natal.birthData.birthDate).getFullYear();
    const birthAnimal = getChineseYear(birthYear);
    themes.push(birthAnimal.toLowerCase());
  }

  return { insight, themes };
}
