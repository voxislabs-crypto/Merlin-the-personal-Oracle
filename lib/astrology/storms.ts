// Storms Detection Engine
// Scans 7 days of transits to identify challenging astrological weather ahead
import "server-only";
import { BirthChartData, PlanetPosition } from "@/types/astrology";
import { MBTIType } from "@/shared/schema";
import mbtiStormResponses from "@/data/mbti-storm-responses.json";
import { getSweph } from '@/lib/sweph-runtime';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AstroStorm {
  id: string;
  date: string;        // YYYY-MM-DD
  dayName: string;     // "Monday" etc.
  title: string;       // e.g. "Mars Square Saturn"
  intensity: "severe" | "moderate" | "mild";
  transitingPlanet: string;
  natalPlanet: string;
  aspect: string;      // "Square" | "Opposition" | "Conjunction"
  orb: number;
  lifeArea: string;
  description: string; // What this storm means
  navigation: string;  // MBTI-personalised advice
  personalityReaction?: string;
  recoveryNote?: string;
  peakWindow?: string;
  intensityScore?: number; // 1-10 signal strength
  phase?: "brewing" | "peak";
  keywords: string[];
}

export interface StormsReport {
  storms: AstroStorm[];
  clearDays: string[];   // Day names with no storms
  weekSummary: string;
  mbtiType?: string;
}

// ─── Planet weight tables ─────────────────────────────────────────────────────

const MALEFIC_PLANETS = ["Saturn", "Mars", "Pluto", "Uranus", "Neptune"];
const PERSONAL_PLANETS = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Ascendant"];

function stormWeight(transiting: string, natal: string, aspect: string): number {
  let weight = 0;
  // Heavy outer-planet transits
  if (["Saturn", "Pluto"].includes(transiting)) weight += 3;
  else if (["Uranus", "Neptune"].includes(transiting)) weight += 2;
  else if (transiting === "Mars") weight += 2;
  else weight += 1;

  // Hitting a personal planet hurts more
  if (["Sun", "Moon", "Ascendant"].includes(natal)) weight += 2;
  else if (["Venus", "Mercury"].includes(natal)) weight += 1;

  // Aspect severity
  if (aspect === "Opposition") weight += 2;
  else if (aspect === "Square") weight += 2;
  else if (aspect === "Conjunction" && MALEFIC_PLANETS.includes(transiting)) weight += 1;

  return weight;
}

function intensityFromWeight(weight: number): "severe" | "moderate" | "mild" {
  if (weight >= 7) return "severe";
  if (weight >= 4) return "moderate";
  return "mild";
}

// ─── Life area mapping ────────────────────────────────────────────────────────

const LIFE_AREA_MAP: Record<string, string> = {
  Sun: "Identity & Confidence",
  Moon: "Emotional Wellbeing",
  Mercury: "Communication & Mind",
  Venus: "Love & Relationships",
  Mars: "Drive & Conflict",
  Jupiter: "Growth & Beliefs",
  Saturn: "Discipline & Structure",
  Uranus: "Change & Freedom",
  Neptune: "Intuition & Boundaries",
  Pluto: "Power & Transformation",
  Ascendant: "Self-Presentation",
};

function lifeAreaFor(natalPlanet: string): string {
  return LIFE_AREA_MAP[natalPlanet] || "General Life";
}

// ─── Description generator ───────────────────────────────────────────────────

interface StormTemplate {
  keywords: string[];
  descriptions: string[];
}

const STORM_TEMPLATES: Record<string, StormTemplate> = {
  "Saturn-Square-Sun": {
    keywords: ["restriction", "self-doubt", "reality check", "patience"],
    descriptions: [
      "Saturn presses hard against your solar identity, demanding you prove your worth. Ambitions may feel blocked, criticism feels personal. This is not a sign to quit—it's a forging.",
      "The taskmaster squares your core self. Plans stall. Authority figures test you. Saturn only blocks what isn't built on solid ground.",
    ],
  },
  "Saturn-Opposition-Sun": {
    keywords: ["confrontation", "external pressure", "limits", "responsibility"],
    descriptions: [
      "Saturn stands opposite your Sun—the world mirrors back every unresolved obligation. Relationships may carry weight; someone or something holds you accountable.",
      "The tension between who you want to be and who life is asking you to be peaks. Real commitments surface.",
    ],
  },
  "Saturn-Square-Moon": {
    keywords: ["emotional suppression", "isolation", "discipline", "grief"],
    descriptions: [
      "Saturn squares the Moon, putting a lid on emotions. You may feel numb, heavy, or lonely. Sensitivity is muted by duty.",
      "This transit asks you to function despite feeling. Grief, duty, and obligation interweave. Push through without bypassing.",
    ],
  },
  "Mars-Square-Sun": {
    keywords: ["aggression", "frustration", "impulsiveness", "ego clash"],
    descriptions: [
      "Mars fires a tense angle at your Sun. Ego collisions are likely—with others or within yourself. Energy runs hot, and patience runs short.",
      "Conflict seeks you out. The urge to act fast may cause friction. Choose your battles with surgical care.",
    ],
  },
  "Mars-Opposition-Sun": {
    keywords: ["confrontation", "opposition", "competition", "burnout"],
    descriptions: [
      "Mars opposes your Sun directly. Challenges from others arrive. Competition stiffens. Energy is high but direction is hard to find.",
      "Someone or something pushes back against your will. Meet it with precision, not brute force.",
    ],
  },
  "Mars-Square-Moon": {
    keywords: ["emotional reactivity", "conflict at home", "irritability"],
    descriptions: [
      "Mars agitates your emotional core. Knee-jerk reactions are likely. Minor frustrations can escalate if unchecked.",
      "Emotional boundaries are tested. Home or family may be the arena. Slow down before responding.",
    ],
  },
  "Pluto-Square-Sun": {
    keywords: ["power struggle", "deep change", "control battles", "transformation"],
    descriptions: [
      "Pluto squares your Sun in a deep reckoning. Power dynamics—internal and external—are shaken loose. Something must be surrendered.",
      "The underworld presses on your identity. Control issues surface. Resistance intensifies the pressure. Yielding opens the door.",
    ],
  },
  "Pluto-Opposition-Sun": {
    keywords: ["power opposition", "identity crisis", "deep transformation"],
    descriptions: [
      "Pluto stands opposite your Sun. External forces of control or change confront you directly. Identity is in flux.",
      "Someone or a situation demands you transform how you show up. Old power structures crack.",
    ],
  },
  "Saturn-Square-Venus": {
    keywords: ["relationship strain", "cold distances", "love tested", "financial pressure"],
    descriptions: [
      "Saturn casts a cold square on Venus. Relationships feel heavy, transactional, or distant. Affection doesn't flow freely.",
      "Love and connection face a stress test. What endures this period is worth keeping.",
    ],
  },
  "Saturn-Square-Mercury": {
    keywords: ["mental weight", "communication blocks", "slow thinking"],
    descriptions: [
      "Saturn weighs on Mercury. Thinking feels sluggish, conversations carry responsibility, and mental output requires extra effort.",
      "Communication may be fraught or formal. Words carry consequences now—choose them slowly.",
    ],
  },
  "Uranus-Square-Sun": {
    keywords: ["disruption", "sudden change", "restlessness", "unpredictability"],
    descriptions: [
      "Uranus shocks the solar core. Sudden shifts in plans, identity, or life direction come without warning.",
      "Expect the unexpected. Structures you relied on may wobble. Adaptability is not optional—it's essential.",
    ],
  },
  "Uranus-Opposition-Sun": {
    keywords: ["liberation", "upheaval", "identity revolution"],
    descriptions: [
      "Uranus in opposition rips at the seams of routine. A radical break in a key life area becomes unavoidable.",
      "Freedom calls louder than comfort. The life you've built is being audited.",
    ],
  },
  "Neptune-Square-Sun": {
    keywords: ["confusion", "disillusionment", "spiritual fog", "escapism"],
    descriptions: [
      "Neptune fogs the Sun's path. Clarity is elusive. Motivations are murky. It's easy to drift or be deceived.",
      "What seemed solid dissolves. Trust is tested. Boundaries with others demand reinforcement.",
    ],
  },
};

function getTemplate(transiting: string, aspect: string, natal: string): StormTemplate | null {
  const key = `${transiting}-${aspect}-${natal}`;
  if (STORM_TEMPLATES[key]) return STORM_TEMPLATES[key];

  // Generic fallback by aspect type
  if (aspect === "Square") {
    return {
      keywords: ["tension", "friction", "challenge", "pressure"],
      descriptions: [
        `${transiting} squares your natal ${natal}, creating significant friction in ${lifeAreaFor(natal).toLowerCase()}. This is a forcing function—pressure that produces change.`,
        `A challenging angle between ${transiting} and your ${natal} demands adjustment. Resistance only intensifies the friction.`,
      ],
    };
  }
  if (aspect === "Opposition") {
    return {
      keywords: ["confrontation", "balance", "tension", "external pressure"],
      descriptions: [
        `${transiting} opposes your natal ${natal}. What you want and what the world requires diverge sharply. Find the middle line.`,
        `The opposition between ${transiting} and your ${natal} brings external forces into direct conflict with your inner landscape.`,
      ],
    };
  }
  if (aspect === "Conjunction") {
    return {
      keywords: ["intensity", "activation", "power surge", "volatility"],
      descriptions: [
        `${transiting} merges with your natal ${natal}. The themes of both planets fuse—powerfully and sometimes uncomfortably.`,
        `A conjunction amplifies everything ${natal} represents in your chart. The energy needs a conscious outlet.`,
      ],
    };
  }
  return null;
}

// ─── MBTI Navigation Advice ───────────────────────────────────────────────────

const MBTI_NAVIGATION: Record<MBTIType, Record<string, string>> = {
  INFJ: {
    "Identity & Confidence":
      "Retreat inward before reacting. Your intuition has the answer—external pressure won't. Journal the theme, not just the feeling.",
    "Emotional Wellbeing":
      "Your depth is an asset here, not a liability. Seek solitude without isolating. One anchor person is enough.",
    "Communication & Mind":
      "Precision over speed. You'll feel every word—use that. Silence is not avoidance; it's accuracy.",
    "Love & Relationships":
      "Speak from vision, not fear. If something needs to change, your foresight makes you the one to name it first.",
    "Drive & Conflict":
      "You avoid direct conflict instinctively. This storm may force your hand. Choose one clear conversation over prolonged tension.",
    "General Life":
      "Trust your long-view clarity. You've seen this storm forming. What does your gut say about the lesson?",
  },
  INFP: {
    "Identity & Confidence":
      "This transit attacks self-worth—your most vulnerable point. Anchor in what you know is true about yourself, not what the storm says.",
    "Emotional Wellbeing":
      "You feel this deeply. Let it move through you rather than building a dam. Art, movement, or music can metabolise the pressure.",
    "Communication & Mind":
      "Don't over-explain or over-apologise. Say what you mean once, clearly, then release the need for validation.",
    "Love & Relationships":
      "Connection matters to you enormously—don't catastrophise a temporary cold spell. Hold your values without demanding others share them immediately.",
    "Drive & Conflict":
      "Conflict activates your defence mechanisms. Name what you're actually protecting before engaging.",
    "General Life":
      "Your authenticity is your shield. When the storm hits, return to your values as compass.",
  },
  INTJ: {
    "Identity & Confidence":
      "Analyse the pressure objectively. External resistance often signals you're on the right path. Adjust the strategy, not the goal.",
    "Emotional Wellbeing":
      "You may dismiss this emotionally—don't. The feeling has data in it. Schedule time to process rather than suppress.",
    "Communication & Mind":
      "Recalibrate your communication model. Efficiency isn't always effectiveness. Slow down for one difficult conversation.",
    "Love & Relationships":
      "Map the relational dynamics with your systems mind. What pattern is repeating? Break it deliberately.",
    "Drive & Conflict":
      "A tactical retreat is not defeat. Choose your engagement point with precision.",
    "General Life":
      "Build contingency plans before the peak. Your forecasting ability is your greatest asset right now.",
  },
  INTP: {
    "Identity & Confidence":
      "Intellectualising this transit won't dissolve it. There's a felt reality that needs more than analysis.",
    "Emotional Wellbeing":
      "You may try to logic your way out of the heaviness. Some of it requires simply sitting with.",
    "Communication & Mind":
      "Slow your conclusions. This transit can trigger mental spirals. One hypothesis at a time.",
    "Love & Relationships":
      "Emotional inconsistency may frustrate others. Ground your engagement—presence matters more than perfect reasoning.",
    "Drive & Conflict":
      "Conflict is a data point, not a failure of logic. Stay curious about the other position.",
    "General Life":
      "Use your analytical edge to map the terrain before moving.",
  },
  ENTJ: {
    "Identity & Confidence":
      "Your instinct is to push harder. Resist. This transit rewards patience and strategic withdrawal over force.",
    "Emotional Wellbeing":
      "Vulnerability isn't inefficiency. The team needs to see you navigate difficulty, not just win.",
    "Communication & Mind":
      "Deliver your words with deliberation. Bluntness now lands harder than you intend.",
    "Love & Relationships":
      "Control tendencies will flare. The storm is asking you to lead through openness, not authority.",
    "Drive & Conflict":
      "Pick one battle worth winning. Spread too thin and the storm wins.",
    "General Life":
      "Your command instinct is an asset—direct its force toward solving, not reacting.",
  },
  ENTP: {
    "Identity & Confidence":
      "Don't argue your way through this one. The storm needs integration, not a rebuttal.",
    "Emotional Wellbeing":
      "Humour is a good first layer of defence, but eventually you'll need to go deeper.",
    "Communication & Mind":
      "Your ideas are powerful. This storm tests whether you can make one of them real under pressure.",
    "Love & Relationships":
      "Emotional consistency is what's needed right now—not cleverness.",
    "Drive & Conflict":
      "You love the sparring. Ensure there's a real purpose behind the provocation.",
    "General Life":
      "Channel your adaptive mind into genuine problem-solving. Skip the pivot and stay the course.",
  },
  ENFJ: {
    "Identity & Confidence":
      "You will want to help others through this. First, tend to yourself. Your wellbeing enables theirs.",
    "Emotional Wellbeing":
      "People-pleasing spikes under pressure. Hold your needs as legitimate, not optional.",
    "Communication & Mind":
      "Your eloquence can be used to smooth over something that actually needs confronting.",
    "Love & Relationships":
      "Don't absorb everyone else's storm. Maintain your own centre.",
    "Drive & Conflict":
      "Stand in your own ground before standing in someone else's corner.",
    "General Life":
      "Lead by example through the storm. Your composure is collective medicine.",
  },
  ENFP: {
    "Identity & Confidence":
      "You won't tolerate a cage—even a temporary one. Channel the restlessness into creation.",
    "Emotional Wellbeing":
      "Emotional intensity is normal for you. This transit amplifies it. Ground before rising.",
    "Communication & Mind":
      "Your ideas are infectious but this isn't the moment to scatter. Focus one signal.",
    "Love & Relationships":
      "Your warmth can bypass your own needs. Make sure you're included in your care.",
    "Drive & Conflict":
      "You'll want to escape the tension. Stay—this one is worth resolving.",
    "General Life":
      "The storm is releasing something stale. Trust the clearing.",
  },
  ISTJ: {
    "Identity & Confidence":
      "Stay rooted in track record and evidence. The storm is noise around something solid you've built.",
    "Emotional Wellbeing":
      "Duty-first instincts may override self-care. Schedule recovery as obligation.",
    "Communication & Mind":
      "Say less but mean what you say. Precision carries weight now.",
    "Love & Relationships":
      "Stability is your love language. Express it in small, consistent acts during the storm.",
    "Drive & Conflict":
      "You are the rock. Just don't expect the rock to handle everything alone.",
    "General Life":
      "Protocols and routines are your armour. Reinforce them rather than abandoning them under pressure.",
  },
  ISFJ: {
    "Identity & Confidence":
      "Self-sacrifice is instinctive but watch the cost. Your needs are not optional extras.",
    "Emotional Wellbeing":
      "You carry others' weight quietly. Set one boundary this week—specifically because of this storm.",
    "Communication & Mind":
      "Indirect communication may not land. Risk one clear, direct statement.",
    "Love & Relationships":
      "Your devotion is real. Make sure it's reciprocated—at least partly—before pouring more.",
    "Drive & Conflict":
      "Avoiding conflict isn't peace. Name the one thing that needs addressing.",
    "General Life":
      "Your caring nature is your strength. Make sure it's not being exploited.",
  },
  ESTJ: {
    "Identity & Confidence":
      "Defend your standards without defending your ego. There's a difference—find it.",
    "Emotional Wellbeing":
      "Efficiency culture may be masking something. Schedule one real conversation this week.",
    "Communication & Mind":
      "Instructions work in systems but not in storms. Listen before directing.",
    "Love & Relationships":
      "Loyalty is your currency. Make sure it flows in both directions.",
    "Drive & Conflict":
      "Win the war, not just the argument. Think three moves ahead.",
    "General Life":
      "Your organisational power is a resource—deploy it on your own behalf as readily as for others.",
  },
  ESFJ: {
    "Identity & Confidence":
      "External validation may dry up in this storm. Find your value from within for this period.",
    "Emotional Wellbeing":
      "Social harmony is your anchor. If the social environment destabilises, create one safe relationship to centre you.",
    "Communication & Mind":
      "Don't spread the storm socially. Process with one trusted person, not many.",
    "Love & Relationships":
      "Your care for others is profound. Weather this by investing that care in yourself too.",
    "Drive & Conflict":
      "Harmony-seeking may lead you to false resolution. Let one conflict be real before it's fixed.",
    "General Life":
      "Your community strength matters. Lean on it wisely—not excessively.",
  },
  ISTP: {
    "Identity & Confidence":
      "You solve problems mechanically. This one needs more than fixing—it needs acknowledging.",
    "Emotional Wellbeing":
      "Detachment is your default—useful, but not indefinitely. One moment of genuine engagement.",
    "Communication & Mind":
      "Brevity serves you. Deliver the point without the buffer zone of silence.",
    "Love & Relationships":
      "Presence over performance. The storm passes faster when someone knows you're with them.",
    "Drive & Conflict":
      "You move fast under pressure. Make sure speed serves accuracy here.",
    "General Life":
      "Your autonomy instinct kicks in. Preserve it via clear boundaries, not disappearing.",
  },
  ISFP: {
    "Identity & Confidence":
      "Your authenticity is your foundation. The storm can't hollow that out unless you let it.",
    "Emotional Wellbeing":
      "Sensory anchors—beauty, movement, art—are literal medicine right now.",
    "Communication & Mind":
      "Express what you're experiencing. Your silence may puzzle those who want to help.",
    "Love & Relationships":
      "Show up in your own way but show up. Physical presence or a small gesture speaks your language.",
    "Drive & Conflict":
      "You'd rather walk than fight. But walking without addressing the source leaves a residue.",
    "General Life":
      "Live in the present tense. The storm is a moment, not a permanent climate.",
  },
  ESTP: {
    "Identity & Confidence":
      "Act—but not impulsively. Short-term wins can undermine the long game this week.",
    "Emotional Wellbeing":
      "The physical world is your reset. Use movement and sense experience to discharge the storm's intensity.",
    "Communication & Mind":
      "Blunt delivery may trigger collateral damage. Aim with precision.",
    "Love & Relationships":
      "Commitment under pressure is how trust is built. Stay in the ring.",
    "Drive & Conflict":
      "Your risk appetite can be a weapon or a liability right now. Calibrate.",
    "General Life":
      "The storm is solvable. Your real-world agility is perfectly suited—don't overthink it.",
  },
  ESFP: {
    "Identity & Confidence":
      "The spotlight dims temporarily. Use the quieter moment to consolidate, not spiral.",
    "Emotional Wellbeing":
      "Your warmth and energy can mask deeper distress. Check in with yourself honestly.",
    "Communication & Mind":
      "Not everything needs to be lightened. Sit with the weight for a moment.",
    "Love & Relationships":
      "Your generosity is magnetic. Make sure the storm isn't exposing an imbalance.",
    "Drive & Conflict":
      "Avoidance through fun is still avoidance. One real conversation.",
    "General Life":
      "Your vitality is a resource. Protect it by being selective about where you pour energy.",
  },
};

function getNavigation(mbtiType: MBTIType | undefined, lifeArea: string): string {
  if (!mbtiType) {
    return `When this storm approaches, slow down. Reflect on what this area of life has been asking of you, and choose one deliberate action rather than reacting.`;
  }

  const fromJson = (mbtiStormResponses as Record<string, { advice?: string }>)[mbtiType];
  if (fromJson?.advice) {
    return fromJson.advice;
  }

  const typeGuidance = MBTI_NAVIGATION[mbtiType];
  if (!typeGuidance) return "Navigate with patience and intentionality.";
  return typeGuidance[lifeArea] || typeGuidance["General Life"] || "Navigate with patience and intentionality.";
}

function getPersonalityReaction(mbtiType: MBTIType | undefined): string | undefined {
  if (!mbtiType) return undefined;
  return (mbtiStormResponses as Record<string, { reaction?: string }>)[mbtiType]?.reaction;
}

function getRecoveryPattern(mbtiType: MBTIType | undefined): string | undefined {
  if (!mbtiType) return undefined;
  return (mbtiStormResponses as Record<string, { recovery?: string }>)[mbtiType]?.recovery;
}

function getPeakWindow(intensity: "severe" | "moderate" | "mild", orb: number): string {
  if (orb < 1) return "Storm peak likely around 2pm local time, easing by midnight.";
  if (intensity === "severe") return "Pressure builds through afternoon, easing late evening.";
  if (intensity === "moderate") return "Most noticeable in midday-to-evening window.";
  return "Low-grade friction; monitor reactivity windows in late day.";
}

const PLANET_STORM_BASE: Record<string, number> = {
  Mars: 8,
  Saturn: 6,
  Uranus: 9,
  Pluto: 8,
  Neptune: 7,
  Sun: 5,
  Moon: 5,
  Mercury: 4,
  Venus: 4,
  Jupiter: 4,
};

function getIntensityScore(transitingPlanet: string, aspect: string, orbDiff: number): number {
  const planetBase = PLANET_STORM_BASE[transitingPlanet] ?? 5;
  const aspectBoost = aspect === "Opposition" ? 2 : aspect === "Square" ? 2 : 1;
  const orbBoost = Math.max(0, 2 - orbDiff); // 0..2
  const raw = planetBase + aspectBoost + orbBoost - 2;
  return Math.max(1, Math.min(10, Math.round(raw)));
}

// ─── Sweph helpers (mirror of transits.ts pattern) ────────────────────────────

const SIGN_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

function normalizeAngle(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function toLocalDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getJulianDay(sweph: any, momentUtc: Date): number {
  const y = momentUtc.getUTCFullYear();
  const m = momentUtc.getUTCMonth() + 1;
  const d = momentUtc.getUTCDate();
  const h = momentUtc.getUTCHours();
  const min = momentUtc.getUTCMinutes();
  const sec = momentUtc.getUTCSeconds();

  if (typeof sweph.julday === "function") {
    const hourDecimal = h + min / 60 + sec / 3600;
    return sweph.julday(y, m, d, hourDecimal, sweph.constants.SE_GREG_CAL);
  }

  const jdResult = sweph.utc_to_jd(y, m, d, h, min, sec, sweph.constants.SE_GREG_CAL);
  if (jdResult.flag !== sweph.constants.OK) {
    throw new Error("Failed to compute Julian day");
  }
  return jdResult.data[0];
}

function diffDegrees(a: number, b: number, sweph: any): number {
  // Preferred precise diff if available in sweph bindings
  try {
    if (typeof sweph?.swe_difdeg === "function") {
      return Math.abs(sweph.swe_difdeg(a, b));
    }
    if (typeof sweph?.difdeg2n === "function") {
      return Math.abs(sweph.difdeg2n(a, b));
    }
    if (typeof sweph?.difdeg === "function") {
      return Math.abs(sweph.difdeg(a, b));
    }
  } catch {
    // fallback below
  }

  let d = Math.abs(normalizeAngle(a) - normalizeAngle(b));
  if (d > 180) d = 360 - d;
  return d;
}

function calculatePlanetsForMoment(momentUtc: Date): PlanetPosition[] {
  const sweph = getSweph();
  if (!sweph) return [];

  try {
    const jd = getJulianDay(sweph, momentUtc);

    const planets = [
      { id: sweph.constants.SE_SUN, name: "Sun" },
      { id: sweph.constants.SE_MOON, name: "Moon" },
      { id: sweph.constants.SE_MERCURY, name: "Mercury" },
      { id: sweph.constants.SE_VENUS, name: "Venus" },
      { id: sweph.constants.SE_MARS, name: "Mars" },
      { id: sweph.constants.SE_JUPITER, name: "Jupiter" },
      { id: sweph.constants.SE_SATURN, name: "Saturn" },
      { id: sweph.constants.SE_URANUS, name: "Uranus" },
      { id: sweph.constants.SE_NEPTUNE, name: "Neptune" },
      { id: sweph.constants.SE_PLUTO, name: "Pluto" },
    ];

    return planets.map((planet) => {
      const result = sweph.calc_ut(jd, planet.id, sweph.constants.SEFLG_SWIEPH);
      if (result.flag < 1) throw new Error(`Calc failed ${planet.name}`);
      const longitude = normalizeAngle(result.data[0]);
      const signIndex = Math.floor(longitude / 30);
      const degreeInSign = longitude % 30;
      return {
        name: planet.name,
        longitude,
        latitude: result.data[1],
        distance: result.data[2],
        speed: result.data[3],
        retrograde: result.data[3] < 0,
        sign: SIGN_NAMES[signIndex],
        degree: Math.floor(degreeInSign),
        minute: Math.floor((degreeInSign - Math.floor(degreeInSign)) * 60),
        house: 0,
      };
    });
  } catch {
    return [];
  }
}

function calculatePlanetsForDate(dateString: string): PlanetPosition[] {
  const [year, month, day] = dateString.split("-").map(Number);
  const m = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return calculatePlanetsForMoment(m);
}

// Fallback: simple mean-motion approximation when sweph unavailable
function approximatePlanetsForDate(dateString: string, seedPositions: PlanetPosition[]): PlanetPosition[] {
  const refDate = new Date();
  const targetDate = new Date(dateString);
  const daysDelta = (targetDate.getTime() - refDate.getTime()) / 86_400_000;

  // Mean daily motions (degrees/day)
  const meanMotion: Record<string, number> = {
    Sun: 0.9856,
    Moon: 13.176,
    Mercury: 1.383,
    Venus: 1.2,
    Mars: 0.524,
    Jupiter: 0.083,
    Saturn: 0.033,
    Uranus: 0.012,
    Neptune: 0.006,
    Pluto: 0.004,
  };

  return seedPositions.map((p) => {
    const motion = meanMotion[p.name] ?? 0;
    const longitude = normalizeAngle(p.longitude + motion * daysDelta);
    const signIndex = Math.floor(longitude / 30);
    const degreeInSign = longitude % 30;
    return {
      ...p,
      longitude,
      sign: SIGN_NAMES[signIndex],
      degree: Math.floor(degreeInSign),
      minute: Math.floor((degreeInSign - Math.floor(degreeInSign)) * 60),
    };
  });
}

// ─── Storm detection for a single day ────────────────────────────────────────

const HARD_ASPECTS = [
  { type: "Square", angle: 90, orb: 8 },
  { type: "Opposition", angle: 180, orb: 10 },
];

const MALEFIC_CONJUNCTION = { type: "Conjunction", angle: 0, orb: 7 };

function findStormsForDay(
  dateString: string,
  dayName: string,
  natalPositions: PlanetPosition[],
  transitPositions: PlanetPosition[],
  mbtiType: MBTIType | undefined,
  options?: { maxOrb?: number; minOrb?: number }
): AstroStorm[] {
  const storms: AstroStorm[] = [];
  const seenPairs = new Set<string>();
  const maxOrb = options?.maxOrb ?? 2; // "storm brewing" window default
  const minOrb = options?.minOrb ?? 0;
  const sweph = getSweph();
  const venusRetrograde = transitPositions.find((p) => p.name === "Venus")?.retrograde === true;

  for (const transit of transitPositions) {
    for (const natal of natalPositions) {
      let angularDiff = Math.abs(transit.longitude - natal.longitude);
      if (angularDiff > 180) angularDiff = 360 - angularDiff;

      const aspects = [...HARD_ASPECTS];

      // Only flag Conjunctions if the transiting body is a malefic
      if (MALEFIC_PLANETS.includes(transit.name)) {
        aspects.push(MALEFIC_CONJUNCTION);
      }

      for (const asp of aspects) {
        const orbDiff = diffDegrees(angularDiff, asp.angle, sweph);
        if (orbDiff <= asp.orb && orbDiff <= maxOrb && orbDiff >= minOrb) {
          const pairKey = `${transit.name}-${asp.type}-${natal.name}-${dateString}`;
          if (seenPairs.has(pairKey)) continue;
          seenPairs.add(pairKey);

          const weight = stormWeight(transit.name, natal.name, asp.type);
          let intensity = intensityFromWeight(weight);
          const lifeArea = lifeAreaFor(natal.name);
          const template = getTemplate(transit.name, asp.type, natal.name);
          const descIdx = Math.floor(Math.random() * (template?.descriptions.length ?? 1));
          const description =
            template?.descriptions[descIdx] ??
            `${transit.name} ${asp.type} natal ${natal.name} creates significant tension in ${lifeArea.toLowerCase()}.`;

          let intensityScore = getIntensityScore(transit.name, asp.type, orbDiff);
          let navigation = getNavigation(mbtiType, lifeArea);
          let personalityReaction = getPersonalityReaction(mbtiType);

          // Mood modifier: Venus retrograde dampens social/emotional drama escalation
          if (venusRetrograde && ["Love & Relationships", "Emotional Wellbeing"].includes(lifeArea)) {
            intensityScore = Math.max(1, intensityScore - 1);
            if (intensity === "severe") intensity = "moderate";
            navigation = `${navigation} Venus retrograde modifier: lower reactivity, defer emotionally charged decisions 24h.`;
            if (personalityReaction) {
              personalityReaction = `${personalityReaction} Mood modifier active: emotional spikes may be less theatrical but more internalized.`;
            }
          }
          const phase: "brewing" | "peak" = orbDiff < 1 ? "peak" : "brewing";

          storms.push({
            id: `${dateString}-${transit.name}-${asp.type}-${natal.name}`,
            date: dateString,
            dayName,
            title: `${transit.name} ${asp.type} ${natal.name}`,
            intensity,
            transitingPlanet: transit.name,
            natalPlanet: natal.name,
            aspect: asp.type,
            orb: Math.round(orbDiff * 10) / 10,
            lifeArea,
            description,
            navigation,
            personalityReaction,
            recoveryNote: getRecoveryPattern(mbtiType),
            peakWindow: getPeakWindow(intensity, orbDiff),
            intensityScore,
            phase,
            keywords: template?.keywords ?? ["tension", "challenge"],
          });
        }
      }
    }
  }

  // Sort: severe first, then moderate, then mild
  storms.sort((a, b) => {
    const order = { severe: 0, moderate: 1, mild: 2 };
    return order[a.intensity] - order[b.intensity];
  });

  return storms;
}

// ─── Main export ──────────────────────────────────────────────────────────────

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function detectWeeklyStorms(
  birthChart: BirthChartData,
  mbtiType?: MBTIType,
  daysAhead = 7
): StormsReport {
  return predictStorms(birthChart, daysAhead, mbtiType);
}

export function predictStorms(
  birthChart: BirthChartData,
  daysAhead = 7,
  mbtiType?: MBTIType
): StormsReport {
  const natalPositions = birthChart.positions ?? birthChart.planets ?? [];

  if (!natalPositions || natalPositions.length === 0) {
    console.warn("[storms] No natal positions available");
    return { storms: [], clearDays: [], weekSummary: "No storm data available.", mbtiType };
  }

  const allStorms: AstroStorm[] = [];
  const dayNames: string[] = [];
  const stormyDayNames = new Set<string>();

  // Seed current transit positions for fallback approximation
  const now = new Date();
  const seedPositions = calculatePlanetsForMoment(now);

  const today = new Date();

  for (let i = 0; i < daysAhead; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + i);
    const dateString = toLocalDateString(targetDate);
    const dayName = DAY_NAMES[targetDate.getDay()];
    dayNames.push(dayName);

    // Keep current clock-time precision for each day ahead (not rounded to midnight)
    const targetMoment = new Date(now);
    targetMoment.setDate(now.getDate() + i);

    let transitPositions = calculatePlanetsForMoment(targetMoment);
    if (transitPositions.length === 0 && seedPositions.length > 0) {
      console.warn(`[storms] Sweph unavailable for ${dateString}, using approximation`);
      transitPositions = approximatePlanetsForDate(dateString, seedPositions);
    }
    if (transitPositions.length === 0) continue;

    const dayStorms = findStormsForDay(dateString, dayName, natalPositions, transitPositions, mbtiType, {
      maxOrb: 2,
      minOrb: 0,
    });
    if (dayStorms.length > 0) stormyDayNames.add(dayName);
    allStorms.push(...dayStorms);
  }

  const clearDays = dayNames.filter((d) => !stormyDayNames.has(d));

  // Keep only the top storms (max 2 per day, max 8 total — avoid overwhelming the UI)
  const deduped: AstroStorm[] = [];
  const countPerDay: Record<string, number> = {};
  for (const storm of allStorms) {
    countPerDay[storm.date] = (countPerDay[storm.date] ?? 0);
    if (countPerDay[storm.date] < 2) {
      deduped.push(storm);
      countPerDay[storm.date]++;
    }
  }
  const maxStorms = Math.max(8, daysAhead + 1);
  const finalStorms = deduped.slice(0, maxStorms);

  const severeCount = finalStorms.filter((s) => s.intensity === "severe").length;
  const moderateCount = finalStorms.filter((s) => s.intensity === "moderate").length;

  let weekSummary = "";
  if (finalStorms.length === 0) {
    weekSummary = "This week's skies are relatively clear. No major storm patterns detected in your personal chart.";
  } else if (severeCount >= 2) {
    weekSummary = `A turbulent week ahead. ${severeCount} severe and ${moderateCount} moderate storm patterns cross your chart. Navigate with patience—the intensity carries purpose.`;
  } else if (severeCount === 1) {
    weekSummary = `One significant storm this week demands your full attention. The remaining friction is manageable. Focus your resources on the critical transit.`;
  } else {
    weekSummary = `Moderate cosmic friction this week. ${finalStorms.length} challenging transit${finalStorms.length > 1 ? "s" : ""} cross your chart. Awareness converts pressure into growth.`;
  }

  return { storms: finalStorms, clearDays, weekSummary, mbtiType: mbtiType || undefined };
}
