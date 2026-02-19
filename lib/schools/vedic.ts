// Vedic Astrology Insights (Jyotish)
import { BirthChartData } from "@/types/astrology";

export interface SchoolInsight {
  insight: string;
  themes: string[];
}

export function getVedicInsight(
  natal: BirthChartData,
  _transits: any[], // eslint-disable-line no-unused-vars
  _date: Date // eslint-disable-line no-unused-vars
): SchoolInsight {
  const themes: string[] = [];
  let insight = "";

  // Check Mars in 1st house (lagna)
  const mars = natal.positions?.find((p) => p.name === "Mars");
  if (mars && mars.house === 1) {
    insight = "Mars in lagna. Fire rises. Channel, don't suppress.";
    themes.push("action", "presence", "stillness");
  }

  // Check Moon nakshatra (simplified - just use sign for now)
  const moon = natal.positions?.find((p) => p.name === "Moon");
  if (moon) {
    themes.push("emotion", "intuition");
  }

  // Check Saturn's influence (karmic lessons)
  const saturn = natal.positions?.find((p) => p.name === "Saturn");
  if (saturn) {
    themes.push("karma", "discipline");
  }

  // Default insight
  if (!insight) {
    insight = "The dharma wheel turns. Align, don't resist.";
    themes.push("alignment", "flow");
  }

  return { insight, themes };
}
