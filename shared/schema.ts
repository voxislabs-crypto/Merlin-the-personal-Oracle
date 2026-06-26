export type MBTIType = 
  | "INTJ" | "INTP" | "ENTJ" | "ENTP"
  | "INFJ" | "INFP" | "ENFJ" | "ENFP"
  | "ISTJ" | "ISFJ" | "ESTJ" | "ESFJ"
  | "ISTP" | "ISFP" | "ESTP" | "ESFP";

export interface TypeConfig {
  tone: "epic" | "action" | "logical" | "empathetic" | "adventurous" | "structured" | "introspective" | "social";
  structure: "bullets" | "paragraph" | "questions" | "commands";
  lengthMultiplier: number;
  motivators: string[];
}

export const typeConfigs: Record<MBTIType, TypeConfig> = {
  // Intuitive-Thinking types
  INTJ: {
    tone: "logical",
    structure: "bullets",
    lengthMultiplier: 0.9,
    motivators: ["precision", "strategy", "vision", "mastery", "independence"],
  },
  INTP: {
    tone: "logical",
    structure: "questions",
    lengthMultiplier: 1.1,
    motivators: ["understanding", "analysis", "curiosity", "theory", "innovation"],
  },
  ENTJ: {
    tone: "action",
    structure: "commands",
    lengthMultiplier: 0.8,
    motivators: ["leadership", "excellence", "control", "achievement", "efficiency"],
  },
  ENTP: {
    tone: "adventurous",
    structure: "questions",
    lengthMultiplier: 1.2,
    motivators: ["debate", "novelty", "possibility", "wit", "exploration"],
  },

  // Intuitive-Feeling types
  INFJ: {
    tone: "empathetic",
    structure: "paragraph",
    lengthMultiplier: 1.0,
    motivators: ["insight", "authenticity", "growth", "meaning", "connection"],
  },
  INFP: {
    tone: "introspective",
    structure: "paragraph",
    lengthMultiplier: 1.1,
    motivators: ["values", "authenticity", "self-expression", "ideal", "harmony"],
  },
  ENFJ: {
    tone: "social",
    structure: "paragraph",
    lengthMultiplier: 1.0,
    motivators: ["harmony", "inspiration", "community", "growth", "service"],
  },
  ENFP: {
    tone: "adventurous",
    structure: "questions",
    lengthMultiplier: 1.2,
    motivators: ["passion", "possibility", "creativity", "connection", "spontaneity"],
  },

  // Sensing-Thinking types
  ISTJ: {
    tone: "structured",
    structure: "bullets",
    lengthMultiplier: 0.85,
    motivators: ["duty", "order", "tradition", "responsibility", "reliability"],
  },
  ISFJ: {
    tone: "empathetic",
    structure: "paragraph",
    lengthMultiplier: 0.95,
    motivators: ["loyalty", "care", "tradition", "stability", "service"],
  },
  ESTJ: {
    tone: "action",
    structure: "commands",
    lengthMultiplier: 0.8,
    motivators: ["efficiency", "order", "leadership", "results", "tradition"],
  },
  ESFJ: {
    tone: "social",
    structure: "paragraph",
    lengthMultiplier: 1.0,
    motivators: ["harmony", "loyalty", "cooperation", "care", "belonging"],
  },

  // Sensing-Feeling types
  ISTP: {
    tone: "logical",
    structure: "bullets",
    lengthMultiplier: 0.9,
    motivators: ["competence", "logic", "independence", "problem-solving", "mastery"],
  },
  ISFP: {
    tone: "introspective",
    structure: "paragraph",
    lengthMultiplier: 1.0,
    motivators: ["aesthetics", "authenticity", "experience", "values", "harmony"],
  },
  ESTP: {
    tone: "action",
    structure: "commands",
    lengthMultiplier: 0.85,
    motivators: ["action", "excitement", "challenge", "pragmatism", "freedom"],
  },
  ESFP: {
    tone: "social",
    structure: "paragraph",
    lengthMultiplier: 1.1,
    motivators: ["experience", "fun", "engagement", "impact", "spontaneity"],
  },
};
