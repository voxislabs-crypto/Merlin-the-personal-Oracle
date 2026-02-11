// Daily Whisper Tone Library - Personalized guidance beyond MBTI
// Factors: age, gender, mood, life phase, energy level

import { MBTIType } from "@/lib/mbti-overlay";

export type LifePhase =
  | "exploration" // 18-25
  | "building" // 26-35
  | "mastery" // 36-50
  | "wisdom" // 51-65
  | "integration"; // 66+

export type Mood =
  | "energized"
  | "exhausted"
  | "anxious"
  | "peaceful"
  | "restless"
  | "grieving"
  | "inspired"
  | "lost";

export type Gender = "male" | "female" | "non-binary" | "prefer-not-to-say";

export interface WhisperContext {
  age: number;
  gender?: Gender;
  mbti?: MBTIType;
  mood?: Mood;
  theme: string; // e.g., "Relationships", "Career", "Transformation"
}

export interface SoulWhisper {
  message: string;
  tone: "gentle" | "firm" | "playful" | "reverent" | "raw";
  source: "Saturn" | "Jupiter" | "Moon" | "Venus" | "Mars" | "Merlin";
}

// Determine life phase from age
function getLifePhase(age: number): LifePhase {
  if (age < 26) return "exploration";
  if (age < 36) return "building";
  if (age < 51) return "mastery";
  if (age < 66) return "wisdom";
  return "integration";
}

// Get age-appropriate guidance
function getAgeGuidance(age: number, theme: string): string {
  const phase = getLifePhase(age);

  const ageWisdom: Record<
    LifePhase,
    Record<string, string>
  > = {
    exploration: {
      Career: "You're not locked in. Try, fail, pivot. Your 20s are for discovery, not决定.",
      Relationships:
        "Don't rush permanence. Learn what you need by learning what you don't.",
      Transformation:
        "Change is your birthright at this age. Shapeshift freely.",
      Spirituality:
        "Question everything. Your spirituality is being built, not inherited.",
    },
    building: {
      Career:
        "Now is the time to commit. Not forever — but for now. Build something real.",
      Relationships:
        "Partnership deepens in this phase. Choose someone who grows with you, not for you.",
      Transformation:
        "You're shedding old skins. It's uncomfortable. That's the point.",
      Spirituality:
        "Your beliefs are tested by reality now. Keep what withstands fire.",
    },
    mastery: {
      Career:
        "You've built the foundation. Now refine it. Mastery is in the details.",
      Relationships:
        "Love at this stage is less about passion, more about partnership. Both matter.",
      Transformation:
        "Mid-life isn't crisis — it's reckoning. Face what you've ignored.",
      Spirituality:
        "You know what you believe. Now live it, not just speak it.",
    },
    wisdom: {
      Career:
        "Your work now is about legacy. What do you leave behind?",
      Relationships:
        "Relationships deepen or dissolve. Both are necessary. Choose wisely.",
      Transformation:
        "Transformation at this age is about integration. Gather all your selves.",
      Spirituality:
        "Your spirituality becomes embodied wisdom. You teach by being.",
    },
    integration: {
      Career: "Work becomes service. You give what only a lifetime could teach.",
      Relationships:
        "Love becomes spacious. You hold others without needing to possess.",
      Transformation:
        "You are becoming essence. The non-essential falls away naturally.",
      Spirituality:
        "You are the elder. Your presence is the teaching.",
    },
  };

  return (
    ageWisdom[phase]?.[theme] ||
    `At ${age}, you're in the ${phase} phase. Trust the timing.`
  );
}

// Get mood-specific guidance
function getMoodGuidance(mood: Mood, planet: string): string {
  const moodWhispers: Record<Mood, Record<string, string>> = {
    exhausted: {
      Saturn:
        "You're not weak. You're depleted. Rest is not retreat — it's strategy.",
      Moon: "Your body is asking for care. Listen before it screams.",
      Mars: "Even warriors rest between battles. Recover. Then return.",
      Jupiter:
        "Exhaustion is information. Something in your life is taking more than it gives.",
      Venus: "Treat yourself like someone you love. Softness is strength.",
    },
    anxious: {
      Saturn:
        "Anxiety is fear of the future meeting doubt about the past. Come back to now.",
      Moon: "Your nervous system is overstimulated. Breathe. Ground. Repeat.",
      Mercury:
        "Your mind is spinning scenarios. Write them down. Most won't happen.",
      Jupiter:
        "Zoom out. This moment is not your whole life. Perspective heals.",
      Venus:
        "Soothe yourself first. Answers come easier when you're calm.",
    },
    peaceful: {
      Moon: "This peace is real. Don't wait for the other shoe to drop. Just be here.",
      Venus:
        "Savor this. Peace is not the absence of challenge — it's presence in the now.",
      Jupiter:
        "From this calm center, your next steps will reveal themselves.",
      Saturn:
        "You earned this peace through discipline. Don't apologize for it.",
      Merlin:
        "Peace is not a destination. It's a frequency. You're tuned in right now.",
    },
    restless: {
      Mars: "That restlessness is energy seeking direction. Channel it. Create something.",
      Jupiter:
        "You're outgrowing something. The discomfort is the chrysalis cracking.",
      Mercury:
        "Restlessness in the mind means you need new input. Read. Learn. Explore.",
      Moon: "Emotional restlessness means something needs to be expressed. Speak or create.",
      Merlin:
        "Restlessness is the soul's way of saying: 'It's time to move.' Listen.",
    },
    grieving: {
      Moon: "Grief is love with nowhere to go. Let it move through you — don't dam it.",
      Saturn:
        "Loss teaches you what mattered. And mattering is never wasted.",
      Venus:
        "You're allowed to fall apart. Healing isn't linear. It's tidal.",
      Merlin:
        "Grief cracks you open. And in that opening, more light gets in.",
      Jupiter:
        "One day, this grief will alchemize into wisdom. Not yet. But one day.",
    },
    inspired: {
      Jupiter:
        "Inspiration is divine electricity. Capture it before it fades. Create now.",
      Mars: "Channel this fire into action. Inspiration without execution is just daydreaming.",
      Mercury:
        "Your mind is blazing. Write it down. All of it. Even the weird parts.",
      Venus:
        "Inspiration is beauty trying to enter the world through you. Let it.",
      Merlin:
        "You are a conduit right now. Don't question it. Just let it flow.",
    },
    lost: {
      Saturn:
        "Lost is not failure. It's the space between maps. And in that space, you find yourself.",
      Moon: "You're not lost. You're in the dark. Different thing. Stay still. You'll adjust.",
      Jupiter:
        "Being lost is the beginning of discovery. Wandering is holy.",
      Mercury:
        "Your mind wants a plan. Your soul says: trust the uncertainty.",
      Merlin:
        "Every hero's journey starts here: lost, unsure, and walking anyway.",
    },
    energized: {
      Mars: "You're on fire. Use it. Build, create, or destroy what needs destroying.",
      Jupiter:
        "This energy is abundance. Share it. Momentum multiplies when given away.",
      Sun: "You're radiating. People feel it. Lead from this place.",
      Venus:
        "Use this vitality to connect. Energy is magnetic. Draw people in.",
      Merlin:
        "This energy is temporary. Don't hoard it. Spend it on what matters.",
    },
  };

  return (
    moodWhispers[mood]?.[planet] ||
    `When you're ${mood}, ${planet} says: feel it fully, then act from clarity.`
  );
}

// Get gender-aware guidance (subtle, not stereotypical)
function getGenderGuidance(gender: Gender, theme: string): string {
  // Only add context where culturally relevant, avoid stereotypes
  const genderContext: Partial<Record<Gender, Partial<Record<string, string>>>> = {
    female: {
      Career:
        "You don't have to be twice as good to deserve the same space. Your presence is enough.",
    },
    male: {
      Transformation:
        "Vulnerability is not weakness. It's the doorway to your full self.",
    },
    "non-binary": {
      Relationships:
        "Your fluidity is not confusion — it's wholeness. Find those who see that.",
    },
  };

  return genderContext[gender]?.[theme] || "";
}

// Main function: Get soul whisper
export function getSoulWhisper(
  context: WhisperContext
): SoulWhisper {
  const { age, mood, gender, theme, mbti } = context;

  // Start with age guidance
  let message = getAgeGuidance(age, theme);

  // Layer mood guidance if present
  if (mood) {
    const moodPlanet = pickPlanetForMood(mood);
    const moodMessage = getMoodGuidance(mood, moodPlanet);
    message = moodMessage; // Mood takes priority in soul whispers
  }

  // Add gender context if relevant
  if (gender) {
    const genderMessage = getGenderGuidance(gender, theme);
    if (genderMessage) {
      message += " " + genderMessage;
    }
  }

  // Add MBTI flavor if provided (subtle)
  if (mbti) {
    const mbtiTone = getMBTITone(mbti);
    message = mbtiTone + " " + message;
  }

  // Determine tone
  const tone = determineTone(mood, theme);

  // Determine source (which archetype speaks)
  const source = mood ? pickPlanetForMood(mood) : "Merlin";

  return {
    message,
    tone,
    source,
  };
}

// Pick planetary voice based on mood
function pickPlanetForMood(
  mood: Mood
): "Saturn" | "Jupiter" | "Moon" | "Venus" | "Mars" | "Merlin" {
  const moodPlanetMap: Record<Mood, SoulWhisper["source"]> = {
    exhausted: "Saturn",
    anxious: "Moon",
    peaceful: "Venus",
    restless: "Mars",
    grieving: "Moon",
    inspired: "Jupiter",
    lost: "Merlin",
    energized: "Mars",
  };

  return moodPlanetMap[mood] || "Merlin";
}

// Determine tone based on mood and theme
function determineTone(
  mood: Mood | undefined,
  theme: string
): SoulWhisper["tone"] {
  if (mood === "grieving" || mood === "lost") return "gentle";
  if (mood === "exhausted") return "firm";
  if (mood === "inspired" || mood === "energized") return "playful";
  if (theme === "Spirituality") return "reverent";
  return "raw";
}

// Get MBTI opening tone (one sentence max)
function getMBTITone(mbti: MBTIType): string {
  const mbtiOpeners: Record<MBTIType, string> = {
    INFJ: "You feel this deeply.",
    INFP: "Your ideals are not naive — they're north stars.",
    INTJ: "You see the pattern others miss.",
    INTP: "Your mind is solving this even now.",
    ISFJ: "Your loyalty is your superpower.",
    ISFP: "Your sensitivity reads the room before it speaks.",
    ISTJ: "You trust what endures.",
    ISTP: "You solve by doing.",
    ENFJ: "You feel the collective mood.",
    ENFP: "Your enthusiasm is contagious.",
    ENTJ: "You organize chaos into systems.",
    ENTP: "You see ten paths where others see one.",
    ESFJ: "You hold space for others.",
    ESFP: "You bring energy to every room.",
    ESTJ: "You get it done.",
    ESTP: "You act while others hesitate.",
  };

  return mbtiOpeners[mbti] || "";
}

// Extended: Get detailed guidance with all factors
export function getDetailedSoulWhisper(
  context: WhisperContext
): { whisper: SoulWhisper; ageContext: string; moodContext?: string } {
  const whisper = getSoulWhisper(context);
  const ageContext = getAgeGuidance(context.age, context.theme);
  const moodContext = context.mood
    ? getMoodGuidance(context.mood, whisper.source)
    : undefined;

  return {
    whisper,
    ageContext,
    moodContext,
  };
}
