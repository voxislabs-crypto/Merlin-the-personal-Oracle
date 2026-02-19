// Natal Voice Layer - Transform raw chart data into narrative soul readings
import { PlanetPosition, Aspect, BirthChartData } from "@/types/astrology";

export interface SoulReading {
  coreIdentity: string;
  emotionalLandscape: string;
  intellectualStyle: string;
  loveLanguage: string;
  willAndAction: string;
  soulPurpose: string;
  shadowWork: string;
  trialByFire?: string; // Only appears for heavy aspects
}

// Planet-Sign voice templates (narrative, mythic, personal)
const planetSignVoice: Record<string, Record<string, string[]>> = {
  Sun: {
    Aries: [
      "You are the spark that starts the fire. People feel your presence before you speak — an unmistakable electricity that demands nothing and commands everything.",
      "Your identity is forged in motion. Stillness feels like death. You were born to initiate, to break ground, to say yes when others hesitate.",
      "Leadership is not a role you play — it's the gravity you create. Others follow because standing still near you feels impossible.",
    ],
    Taurus: [
      "You are the oak tree in a world of saplings. Slow to grow, impossible to uproot, and worth waiting for.",
      "Your sense of self is built on bedrock — loyalty, sensuality, and an unshakeable knowing that good things take time.",
      "You radiate stability. People come to you when the world feels shaky, because you never forget what truly matters: beauty, comfort, and presence.",
    ],
    Leo: [
      "You burn bright, but only after the forge. People feel your warmth — then flinch when they see the steel underneath.",
      "Your identity is theatre, but not performance. You are radically, unapologetically yourself, and that honesty draws people like moths to flame.",
      "You were born to be seen. Not for vanity, but because your light gives others permission to shine.",
    ],
    Scorpio: [
      "You radiate depth. Small talk is torture. You want the truth beneath the truth beneath the mask.",
      "Your identity is forged in transformation. You've died and been reborn more times than most people blink.",
      "People sense you see through them. And you do. But that X-ray vision is a gift, not a weapon — use it to heal, not to wound.",
    ],
    // Add more signs as needed
  },
  Moon: {
    Cancer: [
      "Your emotions are a tidal system — vast, cyclical, and capable of pulling entire oceans toward shore.",
      "You feel everything. The room's mood, the unspoken tension, the grief no one names. This is not weakness. This is your radar.",
      "Home is not a place. It's a feeling you carry, and you give it to people who've forgotten what safety tastes like.",
    ],
    Pisces: [
      "Your emotional world has no borders. You absorb joy and pain with equal ease, which makes boundaries your greatest spiritual practice.",
      "You feel what others cannot name. Intuition isn't mystical for you — it's just Tuesday.",
      "The challenge: learning that not every wave is yours to carry. Some grief belongs to the ocean, not your cup.",
    ],
    Scorpio: [
      "Your emotions are volcanic. Quiet on the surface, molten beneath. When you feel, you feel to the core.",
      "You need emotional honesty like you need air. Half-truths suffocate you. Depth is where you breathe.",
      "Vulnerability is your superpower, but you guard it like a dragon guards treasure. Only the worthy get past the gate.",
    ],
    Capricorn: [
      "Your emotions are pragmatic, structured, and fiercely loyal. You don't fall easily — but when you do, it's forever.",
      "Feelings are not chaos to be managed. They are data to be respected. You trust what endures.",
      "The world sees control. You know it's just armor. Beneath the discipline is a heart that's been tested and refuses to break.",
    ],
  },
  Mercury: {
    Gemini: [
      "Your mind is a kaleidoscope. One conversation, five tangents, zero apologies. You think in constellations, not straight lines.",
      "Boredom is your kryptonite. You need stimulation like plants need sun — constant, varied, and life-giving.",
      "You speak three languages: wit, curiosity, and velocity. People either keep up or get left behind, and that's fine by you.",
    ],
    Virgo: [
      "Your mind is a sorting algorithm. Chaos becomes clarity in your hands, and you do it so quietly people think it's magic.",
      "You see the flaw in the system, the typo in the contract, the gap in the logic. This is not nitpicking. This is precision.",
      "Your intellect is an act of service. You improve everything you touch — as long as you don't turn that laser focus on yourself.",
    ],
    Scorpio: [
      "You think in layers. Surface details bore you. You want the psychology, the motive, the hidden why.",
      "Your words cut through illusion. People either trust your insight or fear it. Often both.",
      "Silence is part of your vocabulary. You speak when it matters, and when you do, people remember.",
    ],
  },
  Venus: {
    Libra: [
      "Your love language is harmony. You create beauty in relationships, spaces, and ideas — and you do it without even trying.",
      "Conflict exhausts you, not because you're weak, but because you can already see the solution, and it's always: talk it out.  ",
      "You are the diplomat, the mediator, the one who believes love should feel easy. And when it doesn't, you wonder what you did wrong. (Hint: nothing.)",
    ],
    Scorpio: [
      "Your love is volcanic. Quiet, then all-consuming. You don't do surface connection — you merge.",
      "Loyalty is currency. Betrayal is unforgivable. You give your whole heart, and you expect the same in return.",
      "Passion without depth bores you. You want to see someone's shadows and still choose them. That's where real intimacy lives.",
    ],
    Taurus: [
      "Your love is sensory. You show affection through touch, food, presence, and loyalty that outlasts lightning.",
      "Romance for you is slow, steady, and rooted in the physical world. Grand gestures are nice. But consistency? That's everything.",
      "You build love like you build a home: with patience, with taste, and with materials that last.",
    ],
  },
  Mars: {
    Aries: [
      "You act first, think later, apologize never. Your energy is raw, direct, and unapologetic.",
      "Hesitation is not in your vocabulary. You see the goal, and you sprint. Obstacles? You go through them, not around.",
      "Your anger is a flash fire — hot, fast, and gone. You don't hold grudges. You're already three battles ahead.",
    ],
    Scorpio: [
      "Your drive is subterranean. Quiet, strategic, and relentless. You don't announce your plans. You execute them.",
      "Anger for you is not noise. It's fuel. You channel rage into transformation, revenge into mastery.",
      "You don't quit. Ever. Even when you should. Especially when you should.",
    ],
    Capricorn: [
      "Your ambition is marathon-grade. You climb slowly, steadily, and you never look back.",
      "Success is not luck. It's structure. You build empires brick by brick, and you don't need applause along the way.",
      "Your willpower is legendary. When you commit, the universe rearranges itself to meet you.",
    ],
  },
};

// Aspect voice templates (dynamic, relational language)
const aspectVoice: Record<string, { positive: string; negative: string }> = {
  "Sun-Saturn": {
    positive:
      "This aspect is your forge. Saturn teaches your Sun to burn with purpose, not just heat. Every achievement carries weight because you earned it the hard way.",
    negative:
      "Every spotlight comes with a shadow. You radiate, but Saturn whispers: 'Not enough.' The work is learning that your worth is not measured by external validation.",
  },
  "Moon-Pluto": {
    positive:
      "Your emotional depth is oceanic. You feel intensely, transformatively, and that capacity for rebirth is your superpower.",
    negative:
      "Emotions can feel like possession. The Moon-Pluto square means you experience feelings as life-or-death — and learning to ride that wave without drowning is your soul work.",
  },
  "Venus-Mars": {
    positive:
      "Passion and love speak the same language. You pursue what (and who) you want with courage, and relationships with you are never lukewarm.",
    negative:
      "Desire and affection can clash. One wants now, the other wants connection. The tension teaches you how to be both fierce and tender.",
  },
  "Mercury-Neptune": {
    positive:
      "Your mind is a portal. You think in images, symbols, and poetry. Logic is just one language — intuition is your mother tongue.",
    negative:
      "The line between insight and illusion is thin. You can see what others miss, but sometimes you see what isn't there. Discernment is your homework.",
  },
};

// House interpretation layer (life area context)
const houseVoice: Record<number, string> = {
  1: "This shapes your first impression, your raw presence, the energy you broadcast before you say a word.",
  2: "This lives in your values, your sense of worth, and the resources (inner and outer) you build your life upon.",
  3: "This colors your communication style, your curiosity, and how you move through your immediate environment.",
  4: "This is your foundation — home, family, roots, and the private self you protect from the world.",
  5: "This fuels your creativity, joy, romance, and the parts of life that feel like play rather than duty.",
  6: "This shows up in your daily habits, your work ethic, and your relationship to service and health.",
  7: "This defines your partnerships — how you show up in one-on-one relationships and what you seek in others.",
  8: "This operates in transformation, intimacy, shared resources, and the psychological depths you're willing to explore.",
  9: "This expands your worldview through travel, philosophy, belief systems, and the search for meaning.",
  10: "This is your public self — career, reputation, legacy, and how the world sees you when you're at your peak.",
  11: "This energizes your friendships, communities, ideals, and the visions you hold for collective progress.",
  12: "This whispers in solitude, dreams, the unconscious, and the spiritual dimensions you can't quite name.",
};

// Generate Sun narrative (core identity)
function generateSunNarrative(
  sun: PlanetPosition,
  aspects: Aspect[]
): string {
  const signTemplates = planetSignVoice.Sun[sun.sign];
  const baseVoice = signTemplates
    ? signTemplates[Math.floor(Math.random() * signTemplates.length)]
    : `Your Sun in ${sun.sign} defines your core identity.`;

  // Check for Saturn square/opposition
  const saturnAspect = aspects.find(
    (a) =>
      ((a.planet1.name === "Sun" && a.planet2.name === "Saturn") ||
        (a.planet1.name === "Saturn" && a.planet2.name === "Sun")) &&
      (a.type === "Square" || a.type === "Opposition")
  );

  const houseContext = sun.house
    ? ` ${houseVoice[sun.house]}`
    : "";

  let narrative = baseVoice + houseContext;

  if (saturnAspect) {
    narrative +=
      " " +
      (aspectVoice["Sun-Saturn"]?.negative ||
        "But Saturn tests your light, demanding you prove your worth through discipline.");
  }

  return narrative;
}

// Generate Moon narrative (emotional landscape)
function generateMoonNarrative(
  moon: PlanetPosition,
  aspects: Aspect[]
): string {
  const signTemplates = planetSignVoice.Moon[moon.sign];
  const baseVoice = signTemplates
    ? signTemplates[Math.floor(Math.random() * signTemplates.length)]
    : `Your Moon in ${moon.sign} governs your emotional world.`;

  const plutoAspect = aspects.find(
    (a) =>
      ((a.planet1.name === "Moon" && a.planet2.name === "Pluto") ||
        (a.planet1.name === "Pluto" && a.planet2.name === "Moon")) &&
      (a.type === "Square" || a.type === "Opposition" || a.type === "Conjunction")
  );

  const houseContext = moon.house ? ` ${houseVoice[moon.house]}` : "";

  let narrative = baseVoice + houseContext;

  if (plutoAspect) {
    narrative +=
      " " +
      (aspectVoice["Moon-Pluto"]?.negative ||
        "Pluto intensifies your emotional world to the point of transformation.");
  }

  return narrative;
}

// Generate Mercury narrative (intellectual style)
function generateMercuryNarrative(
  mercury: PlanetPosition,
  aspects: Aspect[]
): string {
  const signTemplates = planetSignVoice.Mercury[mercury.sign];
  const baseVoice = signTemplates
    ? signTemplates[Math.floor(Math.random() * signTemplates.length)]
    : `Your Mercury in ${mercury.sign} shapes how you think and communicate.`;

  const neptuneAspect = aspects.find(
    (a) =>
      ((a.planet1.name === "Mercury" && a.planet2.name === "Neptune") ||
        (a.planet1.name === "Neptune" && a.planet2.name === "Mercury")) &&
      (a.type === "Square" || a.type === "Conjunction" || a.type === "Trine")
  );

  const houseContext = mercury.house ? ` ${houseVoice[mercury.house]}` : "";

  let narrative = baseVoice + houseContext;

  if (neptuneAspect) {
    const aspectType =
      neptuneAspect.type === "Trine"
        ? aspectVoice["Mercury-Neptune"]?.positive
        : aspectVoice["Mercury-Neptune"]?.negative;
    narrative += " " + (aspectType || "Neptune adds mysticism to your mind.");
  }

  return narrative;
}

// Generate Venus narrative (love language)
function generateVenusNarrative(
  venus: PlanetPosition,
  aspects: Aspect[]
): string {
  const signTemplates = planetSignVoice.Venus[venus.sign];
  const baseVoice = signTemplates
    ? signTemplates[Math.floor(Math.random() * signTemplates.length)]
    : `Your Venus in ${venus.sign} defines how you love and what you value.`;

  const marsAspect = aspects.find(
    (a) =>
      ((a.planet1.name === "Venus" && a.planet2.name === "Mars") ||
        (a.planet1.name === "Mars" && a.planet2.name === "Venus")) &&
      (a.type === "Square" || a.type === "Conjunction" || a.type === "Opposition")
  );

  const houseContext = venus.house ? ` ${houseVoice[venus.house]}` : "";

  let narrative = baseVoice + houseContext;

  if (marsAspect) {
    const aspectType =
      marsAspect.type === "Conjunction"
        ? aspectVoice["Venus-Mars"]?.positive
        : aspectVoice["Venus-Mars"]?.negative;
    narrative += " " + (aspectType || "Mars energizes your approach to love.");
  }

  return narrative;
}

// Generate Mars narrative (will and action)
function generateMarsNarrative(
  mars: PlanetPosition,
  _aspects: Aspect[]
): string {
  const signTemplates = planetSignVoice.Mars[mars.sign];
  const baseVoice = signTemplates
    ? signTemplates[Math.floor(Math.random() * signTemplates.length)]
    : `Your Mars in ${mars.sign} drives your will, ambition, and how you assert yourself.`;

  const houseContext = mars.house ? ` ${houseVoice[mars.house]}` : "";

  return baseVoice + houseContext;
}

// Detect "Trial by Fire" signature (Saturn square Pluto, plus heavy aspects)
function detectTrialByFire(aspects: Aspect[]): string | undefined {
  const saturnPlutoHard = aspects.find(
    (a) =>
      ((a.planet1.name === "Saturn" && a.planet2.name === "Pluto") ||
        (a.planet1.name === "Pluto" && a.planet2.name === "Saturn")) &&
      (a.type === "Square" || a.type === "Opposition")
  );

  const hardAspectCount = aspects.filter(
    (a) => a.type === "Square" || a.type === "Opposition"
  ).length;

  if (saturnPlutoHard || hardAspectCount >= 5) {
    return `**You've survived the forge.** This chart doesn't ask — it demands. Saturn square Pluto. Nothing came easy. Every gift was earned through fire, every scar is proof of strength. You are not like others. You are forged steel.`;
  }

  return undefined;
}

// Main function: Generate full soul reading
export function generateSoulReading(chartData: BirthChartData): SoulReading {
  const planets = chartData.positions || [];

  const sun = planets.find((p) => p.name === "Sun");
  const moon = planets.find((p) => p.name === "Moon");
  const mercury = planets.find((p) => p.name === "Mercury");
  const venus = planets.find((p) => p.name === "Venus");
  const mars = planets.find((p) => p.name === "Mars");
  const jupiter = planets.find((p) => p.name === "Jupiter");
  const saturn = planets.find((p) => p.name === "Saturn");

  const aspects = chartData.aspects || [];

  return {
    coreIdentity: sun
      ? generateSunNarrative(sun, aspects)
      : "Your core identity awaits discovery.",
    emotionalLandscape: moon
      ? generateMoonNarrative(moon, aspects)
      : "Your emotional world is vast and unmapped.",
    intellectualStyle: mercury
      ? generateMercuryNarrative(mercury, aspects)
      : "Your mind speaks its own language.",
    loveLanguage: venus
      ? generateVenusNarrative(venus, aspects)
      : "Your heart has its own dialect.",
    willAndAction: mars
      ? generateMarsNarrative(mars, aspects)
      : "Your will is the hammer that shapes your world.",
    soulPurpose:
      jupiter && saturn
        ? `Jupiter in ${jupiter.sign} expands your vision. Saturn in ${saturn.sign} gives it form. Between expansion and discipline, your purpose takes shape.`
        : "Your purpose unfolds between vision and structure.",
    shadowWork:
      "Every chart has shadows. Yours live in the aspects that challenge, the placements that demand growth. Shadow work is not fixing yourself — it's integrating all of you.",
    trialByFire: detectTrialByFire(aspects),
  };
}

// Helper: Get soul whisper (single-line insight)
export function getSoulWhisper(planet: string, sign: string): string {
  const templates = planetSignVoice[planet]?.[sign];
  if (!templates || templates.length === 0) {
    return `${planet} in ${sign} shapes your soul in ways words struggle to capture.`;
  }
  return templates[0]; // Return first template as whisper
}
