// Multi-School Whisper - Consensus across Western, Vedic, and Chinese astrology
import { BirthChartData } from "@/types/astrology";
import { getWesternInsight, SchoolInsight } from "./western";
import { getVedicInsight } from "./vedic";
import { getChineseInsight } from "./chinese";

export interface MultiSchoolWhisper {
  western: SchoolInsight;
  vedic: SchoolInsight;
  chinese: SchoolInsight;
  consensus: string[];
  whisper: string;
  agreement: "full" | "partial" | "none";
}

export function getMultiSchoolWhisper(
  natal: BirthChartData,
  transits: any[],
  date: Date
): MultiSchoolWhisper {
  // Run all three schools
  const western = getWesternInsight(natal, transits);
  const vedic = getVedicInsight(natal, transits, date);
  const chinese = getChineseInsight(natal, transits, date);

  // Find common themes
  const themes = new Set([
    ...western.themes,
    ...vedic.themes,
    ...chinese.themes,
  ]);

  // Find consensus (themes that appear in at least 2 schools)
  const consensus: string[] = Array.from(themes).filter((theme) => {
    const count =
      (western.themes.includes(theme) ? 1 : 0) +
      (vedic.themes.includes(theme) ? 1 : 0) +
      (chinese.themes.includes(theme) ? 1 : 0);
    return count >= 2;
  });

  // Determine agreement level
  let agreement: "full" | "partial" | "none";
  if (consensus.length >= 3) {
    agreement = "full";
  } else if (consensus.length >= 1) {
    agreement = "partial";
  } else {
    agreement = "none";
  }

  // Generate unified whisper
  let whisper: string;

  if (consensus.length > 0) {
    whisper = `All three schools converge: ${consensus.join(", ")}. Move with clarity on ${date.toLocaleDateString()}.`;
  } else {
    whisper = `They don't agree. But you do. Listen to that inner knowing.`;
  }

  return {
    western,
    vedic,
    chinese,
    consensus,
    whisper,
    agreement,
  };
}

// Helper: Get detailed reading with all three perspectives
export function getDetailedMultiSchoolReading(
  natal: BirthChartData,
  transits: any[],
  date: Date
): string {
  const reading = getMultiSchoolWhisper(natal, transits, date);

  const sections = [
    `🌍 Western: ${reading.western.insight}`,
    `🔯 Vedic: ${reading.vedic.insight}`,
    `🐉 Chinese: ${reading.chinese.insight}`,
    "",
    `✨ Consensus: ${reading.whisper}`,
  ];

  return sections.join("\n");
}

// Helper: Quick yes/no from all three schools
export function getMultiSchoolGuidance(
  natal: BirthChartData,
  transits: any[],
  date: Date,
  _question: string // eslint-disable-line no-unused-vars
): {
  western: "yes" | "no" | "wait";
  vedic: "yes" | "no" | "wait";
  chinese: "yes" | "no" | "wait";
  consensus: "yes" | "no" | "wait";
  reasoning: string;
} {
  const reading = getMultiSchoolWhisper(natal, transits, date);

  // Simplified yes/no logic based on themes
  const getAnswer = (themes: string[]): "yes" | "no" | "wait" => {
    if (themes.includes("action") || themes.includes("courage")) return "yes";
    if (themes.includes("review") || themes.includes("stillness")) return "wait";
    if (themes.includes("discipline") || themes.includes("patience"))
      return "wait";
    return "yes"; // Default to action
  };

  const western = getAnswer(reading.western.themes);
  const vedic = getAnswer(reading.vedic.themes);
  const chinese = getAnswer(reading.chinese.themes);

  // Find consensus
  const answers = [western, vedic, chinese];
  const yesCount = answers.filter((a) => a === "yes").length;
  const noCount = answers.filter((a) => a === "no").length;
  const waitCount = answers.filter((a) => a === "wait").length;

  let consensus: "yes" | "no" | "wait";
  if (yesCount >= 2) consensus = "yes";
  else if (noCount >= 2) consensus = "no";
  else if (waitCount >= 2) consensus = "wait";
  else consensus = "wait"; // If no majority, default to caution

  const reasoning =
    consensus === "yes"
      ? "Two or more schools say: move forward."
      : consensus === "no"
      ? "Two or more schools say: step back."
      : "Two or more schools say: wait for clarity.";

  return {
    western,
    vedic,
    chinese,
    consensus,
    reasoning,
  };
}
