export interface Quest {
  id: string;
  title: string;
  description: string;
  category: "mind" | "heart" | "body" | "spirit" | "shadow";
  difficulty: 1 | 2 | 3;
  xp: number;
  cosmicSource: string;
  completed?: boolean;
}

const TRANSIT_QUEST_TEMPLATES: Record<string, Quest[]> = {
  moon: [
    {
      id: "",
      title: "Track your emotional weather",
      description:
        "For the next three days, write one sentence each morning about what you feel before you check your phone.",
      category: "mind",
      difficulty: 1,
      xp: 30,
      cosmicSource: "Moon transit",
    },
    {
      id: "",
      title: "One honest conversation",
      description:
        "Tell someone something you've been holding. Not to fix anything, just to let it exist outside you.",
      category: "heart",
      difficulty: 2,
      xp: 60,
      cosmicSource: "Lunar activation",
    },
  ],
  mercury: [
    {
      id: "",
      title: "Write the unsent letter",
      description:
        "Write a letter you will never send. Say everything, then decide what matters.",
      category: "mind",
      difficulty: 1,
      xp: 40,
      cosmicSource: "Mercury transit",
    },
    {
      id: "",
      title: "Digital silence for 2 hours",
      description:
        "Pick a 2-hour window today and operate without screens. Notice what thoughts arise in the quiet.",
      category: "mind",
      difficulty: 1,
      xp: 35,
      cosmicSource: "Mercury activation",
    },
  ],
  venus: [
    {
      id: "",
      title: "Beauty inventory",
      description:
        "List five things you find beautiful right now, one for each sense, then create or obtain one of them deliberately.",
      category: "heart",
      difficulty: 1,
      xp: 30,
      cosmicSource: "Venus transit",
    },
    {
      id: "",
      title: "Repair one relationship",
      description:
        "Reach out to someone you've let drift. No agenda, just presence.",
      category: "heart",
      difficulty: 2,
      xp: 80,
      cosmicSource: "Venus activation",
    },
  ],
  mars: [
    {
      id: "",
      title: "Do the hard thing first",
      description:
        "Identify the task you've been avoiding. Do it within the hour, before anything else.",
      category: "body",
      difficulty: 1,
      xp: 50,
      cosmicSource: "Mars transit",
    },
    {
      id: "",
      title: "Set one clear boundary",
      description:
        "Identify something you've been tolerating. Say no to it today, clearly and without apology.",
      category: "shadow",
      difficulty: 2,
      xp: 90,
      cosmicSource: "Mars activation",
    },
  ],
  jupiter: [
    {
      id: "",
      title: "Expand your map",
      description:
        "Learn about one topic you know nothing about. Read for 30 minutes with no goal beyond curiosity.",
      category: "mind",
      difficulty: 1,
      xp: 40,
      cosmicSource: "Jupiter transit",
    },
    {
      id: "",
      title: "Ask for more",
      description:
        "Identify one area where you've been settling and make one move toward what you actually want this week.",
      category: "spirit",
      difficulty: 2,
      xp: 70,
      cosmicSource: "Jupiter expansion",
    },
  ],
  saturn: [
    {
      id: "",
      title: "The 30-day commitment",
      description:
        "Choose one discipline and commit to a small daily practice for 30 days. Write it down and track day one today.",
      category: "body",
      difficulty: 3,
      xp: 150,
      cosmicSource: "Saturn transit",
    },
    {
      id: "",
      title: "Audit what costs you",
      description:
        "List your three biggest time or energy drains. Pick one and remove it, or reduce it by half, this week.",
      category: "shadow",
      difficulty: 2,
      xp: 80,
      cosmicSource: "Saturn structure",
    },
  ],
  uranus: [
    {
      id: "",
      title: "Break one pattern",
      description:
        "Identify a routine you run on autopilot and change it deliberately today.",
      category: "spirit",
      difficulty: 1,
      xp: 45,
      cosmicSource: "Uranus transit",
    },
  ],
  neptune: [
    {
      id: "",
      title: "Dream record for 3 days",
      description:
        "Keep a notebook by your bed and write down whatever you remember on waking without analyzing it.",
      category: "spirit",
      difficulty: 2,
      xp: 60,
      cosmicSource: "Neptune activation",
    },
    {
      id: "",
      title: "Create without purpose",
      description:
        "Make something today with no audience and no goal. Let it be imperfect.",
      category: "spirit",
      difficulty: 1,
      xp: 40,
      cosmicSource: "Neptune transit",
    },
  ],
  pluto: [
    {
      id: "",
      title: "The shadow interview",
      description:
        "Write about a trait in others that irritates you most, then ask where it lives in you.",
      category: "shadow",
      difficulty: 3,
      xp: 120,
      cosmicSource: "Pluto transit",
    },
    {
      id: "",
      title: "Release one possession",
      description:
        "Let go of one physical thing that represents an old identity or chapter.",
      category: "shadow",
      difficulty: 2,
      xp: 75,
      cosmicSource: "Pluto transformation",
    },
  ],
};

const MBTI_QUEST_OVERRIDES: Partial<Record<string, Quest>> = {
  INFJ: {
    id: "",
    title: "Surface one prophetic knowing",
    description:
      "Write down something you've sensed but not said out loud, just to acknowledge that you already know it.",
    category: "spirit",
    difficulty: 2,
    xp: 90,
    cosmicSource: "INFJ inner sight",
  },
  INFP: {
    id: "",
    title: "Write your personal myth",
    description:
      "In 200 words, describe your life as a story of becoming. Who are you becoming, and at what cost?",
    category: "spirit",
    difficulty: 2,
    xp: 85,
    cosmicSource: "INFP inner world",
  },
  INTJ: {
    id: "",
    title: "Stress-test one belief",
    description:
      "Pick a conviction you haven't questioned in a while and find one compelling argument against it.",
    category: "mind",
    difficulty: 2,
    xp: 80,
    cosmicSource: "INTJ precision",
  },
  ENFJ: {
    id: "",
    title: "Receive without deflecting",
    description:
      "Ask someone what they appreciate about you and receive it without minimizing or redirecting.",
    category: "heart",
    difficulty: 2,
    xp: 75,
    cosmicSource: "ENFJ relational depth",
  },
};

function createQuestId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function extractTransitPlanets(transits?: unknown, forecast?: unknown): string[] {
  const transitPlanets: string[] = [];

  const significant = (transits as { significant?: Array<{ transitingPlanet?: string }> } | undefined)
    ?.significant;

  if (significant?.length) {
    for (const transit of significant) {
      const planet = transit.transitingPlanet?.toLowerCase();
      if (planet && !transitPlanets.includes(planet)) {
        transitPlanets.push(planet);
      }
    }
  }

  const highlights = (forecast as { planetaryHighlights?: string[] } | undefined)
    ?.planetaryHighlights;

  if (transitPlanets.length === 0 && highlights?.length) {
    for (const highlight of highlights) {
      const match = highlight.match(
        /^(Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto)/i
      );
      const planet = match?.[1]?.toLowerCase();
      if (planet && !transitPlanets.includes(planet)) {
        transitPlanets.push(planet);
      }
    }
  }

  if (transitPlanets.length === 0) {
    transitPlanets.push("moon", "mars", "saturn");
  }

  return transitPlanets;
}

export function generateQuestsFromInputs(input: {
  transits?: unknown;
  forecast?: unknown;
  mbtiType?: string;
}): Quest[] {
  const selected: Quest[] = [];
  const usedCategories = new Set<string>();
  const transitPlanets = extractTransitPlanets(input.transits, input.forecast);

  for (const planet of transitPlanets.slice(0, 4)) {
    const pool = TRANSIT_QUEST_TEMPLATES[planet];
    if (!pool) {
      continue;
    }

    const quest = pool.find((item) => !usedCategories.has(item.category)) || pool[0];
    selected.push({ ...quest, id: createQuestId(`quest_${planet}`) });
    usedCategories.add(quest.category);
  }

  const mbtiQuest = input.mbtiType ? MBTI_QUEST_OVERRIDES[input.mbtiType] : undefined;
  if (mbtiQuest && !usedCategories.has(mbtiQuest.category)) {
    selected.push({ ...mbtiQuest, id: createQuestId("quest_mbti") });
  }

  if (selected.length < 3) {
    for (const fallbackPlanet of ["moon", "mars", "saturn"]) {
      if (selected.length >= 3) {
        break;
      }

      const fallbackQuest = TRANSIT_QUEST_TEMPLATES[fallbackPlanet]?.[0];
      if (fallbackQuest && !selected.some((item) => item.title === fallbackQuest.title)) {
        selected.push({ ...fallbackQuest, id: createQuestId(`quest_fb_${fallbackPlanet}`) });
      }
    }
  }

  return selected.slice(0, 5);
}