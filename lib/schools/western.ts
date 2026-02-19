// Western Astrology Insights
import { BirthChartData, Aspect } from "@/types/astrology";

export interface SchoolInsight {
  insight: string;
  themes: string[];
}

export function getWesternInsight(
  natal: BirthChartData,
  transits: any[]
): SchoolInsight {
  const themes: string[] = [];
  let insight = "";

  // Check for Mercury retrograde
  const mercuryTransit = transits.find((t) => t.planet === "Mercury");
  if (mercuryTransit && mercuryTransit.retrograde) {
    insight = "Mercury retrograde. Don't sign. Review, don't launch.";
    themes.push("communication", "review");
  }

  // Check for Saturn aspects
  const saturnAspects = natal.aspects?.filter(
    (a: Aspect) =>
      a.planet1.name === "Saturn" || a.planet2.name === "Saturn"
  );
  if (saturnAspects && saturnAspects.length > 0) {
    themes.push("discipline", "structure");
  }

  // Check for Mars energy
  const marsAspects = natal.aspects?.filter(
    (a: Aspect) => a.planet1.name === "Mars" || a.planet2.name === "Mars"
  );
  if (marsAspects && marsAspects.length > 0) {
    themes.push("action", "energy");
  }

  // Default insight if no specific patterns
  if (!insight) {
    insight = "The planets move. You decide what motion means.";
    themes.push("choice", "timing");
  }

  return { insight, themes };
}
