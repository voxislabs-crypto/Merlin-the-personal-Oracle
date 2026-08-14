export interface TransitInterpretation {
  effect:
    | "positive"
    | "neutral"
    | "heavy"
    | "intense"
    | "volatile"
    | "chaotic"
    | "excessive"
    | "productive"
    | "frustrated"
    | "energized"
    | "expansive"
    | "serious"
    | "restrictive"
    | "midlife-shift"
    | "foggy"
    | "confusing"
    | "transformative"
    | "wounding-healing"
    | "vulnerable"
    | "emotional-healing"
    | "tense"
    | "chaotic-expansive"
  interpretation: string
  do: string[]
  dont: string[]
}

export type TransitAspectBand = "hard" | "soft" | "merge"

export interface ParsedTransitAspect {
  transiting: string
  aspect: string
  natal: string
}

/** Placeholder used when a transit had no interpretation. Never treat as a real daily move. */
export const GENERIC_TRANSIT_DO =
  "One reversible step only — talk, draft, or scout before you commit."

export const GENERIC_TRANSIT_DONT =
  "Force a permanent decision while the signal is unclear"

const KNOWN_EFFECTS = new Set<string>([
  "positive",
  "neutral",
  "heavy",
  "intense",
  "volatile",
  "chaotic",
  "excessive",
  "productive",
  "frustrated",
  "energized",
  "expansive",
  "serious",
  "restrictive",
  "midlife-shift",
  "foggy",
  "confusing",
  "transformative",
  "wounding-healing",
  "vulnerable",
  "emotional-healing",
  "tense",
  "chaotic-expansive",
])

const PLANET_CANON: Record<string, string> = {
  sun: "Sun",
  moon: "Moon",
  mercury: "Mercury",
  venus: "Venus",
  mars: "Mars",
  jupiter: "Jupiter",
  saturn: "Saturn",
  uranus: "Uranus",
  neptune: "Neptune",
  pluto: "Pluto",
  chiron: "Chiron",
  lilith: "Lilith",
  "north node": "North Node",
  "true node": "North Node",
  "south node": "South Node",
  ascendant: "Ascendant",
  rising: "Ascendant",
}

const ASPECT_CANON: Record<string, string> = {
  conjunction: "conjunction",
  conjunct: "conjunction",
  opposition: "opposition",
  oppose: "opposition",
  opposed: "opposition",
  square: "square",
  trine: "trine",
  sextile: "sextile",
  quincunx: "quincunx",
  inconjunct: "quincunx",
}

const ASPECT_KEY_RE =
  /^([a-z][a-z\s]*?)\s+(conjunction|conjunct|opposition|oppose[sd]?|square|trine|sextile|quincunx|inconjunct)\s+([a-z][a-z\s]*?)$/

export function normalizeTransitLookupKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ")
}

export function titleCasePlanet(name: string): string {
  const n = normalizeTransitLookupKey(name)
  if (PLANET_CANON[n]) return PLANET_CANON[n]
  return n.replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatTransitAspectKey(
  transiting: string,
  aspect: string,
  natal: string,
): string {
  const canonAspect = ASPECT_CANON[normalizeTransitLookupKey(aspect)] || aspect.trim().toLowerCase()
  return `${titleCasePlanet(transiting)} ${canonAspect} ${titleCasePlanet(natal)}`
}

export function parseTransitAspectKey(key: string): ParsedTransitAspect | null {
  const n = normalizeTransitLookupKey(key)
  const match = n.match(ASPECT_KEY_RE)
  if (!match) return null
  const aspect = ASPECT_CANON[match[2]] || match[2]
  return {
    transiting: match[1].trim(),
    aspect,
    natal: match[3].trim(),
  }
}

export function aspectBand(aspect: string): TransitAspectBand {
  const a = ASPECT_CANON[normalizeTransitLookupKey(aspect)] || aspect.trim().toLowerCase()
  if (a === "square" || a === "opposition" || a === "quincunx") return "hard"
  if (a === "trine" || a === "sextile") return "soft"
  return "merge"
}

export function isGenericTransitDo(text: string | null | undefined): boolean {
  const t = (text || "").trim()
  if (!t) return true
  if (t === GENERIC_TRANSIT_DO) return true
  if (/one reversible step only/i.test(t)) return true
  if (/talk,\s*draft,\s*or scout/i.test(t)) return true
  return false
}

// Hand-authored overrides for well-known transits. Keys are matched case-insensitively.
export const TRANSIT_LOOKUP: Record<string, TransitInterpretation> = {
  "Moon opposition Saturn": {
    effect: "heavy",
    interpretation: "Emotional heaviness and feelings of isolation. Your mood may be dampened by responsibilities or criticism.",
    do: [
      "Name the heavy feeling, then do one small duty — not the whole pile.",
      "Ask for the concrete need. Skip the self-trial.",
      "Protect a quiet hour before you take on anyone else's standard.",
    ],
    dont: ["Withdraw completely", "Take criticism too personally", "Ignore your emotional needs"],
  },
  "Moon opposition Pluto": {
    effect: "intense",
    interpretation: "Deep emotional intensity and power struggles. Hidden feelings may surface powerfully.",
    do: [
      "Write the raw version first. Send only the one-sentence version.",
      "Step out of the power struggle: one fact, one feeling, stop.",
      "Get a trusted person on the line before you escalate.",
    ],
    dont: ["Suppress intense feelings", "Engage in emotional manipulation", "Make impulsive relationship decisions"],
  },
  "Sun trine Jupiter": {
    effect: "expansive",
    interpretation: "Optimistic energy and growth opportunities. Lucky breaks and positive expansion.",
    do: [
      "Say yes to one real opening — a message, a pitch, a hello.",
      "Share the win or the work. Let one person in on it.",
      "Take the calculated risk you already researched.",
    ],
    dont: ["Overcommit", "Be arrogant", "Ignore details in your enthusiasm"],
  },
  "Mercury square Mars": {
    effect: "tense",
    interpretation: "Mental tension and argumentative energy. Communication may be sharp or hasty.",
    do: [
      "Draft the sharp reply. Wait twenty minutes. Then send a shorter one.",
      "Move the argument to a walk or a note — not a live pile-on.",
      "Channel the heat into one clarifying question.",
    ],
    dont: ["Start unnecessary arguments", "Make hasty decisions", "Send impulsive messages"],
  },
  "Venus conjunct Neptune": {
    effect: "foggy",
    interpretation: "Romantic idealism and creative inspiration. Boundaries may blur in relationships.",
    do: [
      "Enjoy the beauty. Sleep on any promise or purchase.",
      "Make something — a playlist, a note, a sketch — instead of a vow.",
      "Check one fact before you idealize a person or a deal.",
    ],
    dont: ["Idealize people unrealistically", "Ignore red flags", "Lose yourself in fantasy"],
  },
  "Mars square Saturn": {
    effect: "frustrated",
    interpretation: "Blocked action and frustrated ambition. Progress may feel slow or restricted.",
    do: [
      "Pick the smallest next brick and lay it. Skip the breakthrough fantasy.",
      "Work a short focused block, then stop. Endurance beats force.",
      "Rename the blocker in one sentence so you can plan around it.",
    ],
    dont: ["Force things", "Give up prematurely", "Act out in anger"],
  },
  "Jupiter opposite Uranus": {
    effect: "chaotic-expansive",
    interpretation: "Sudden opportunities mixed with instability. Exciting but unpredictable energy.",
    do: [
      "Take the exciting opening as a 48-hour trial, not a life rewrite.",
      "Say yes to the experiment. Delay the permanent exit.",
      "Write the upside and the exit ramp before you leap.",
    ],
    dont: ["Act recklessly", "Burn bridges", "Ignore consequences"],
  },
}

const LOOKUP_BY_NORM = new Map(
  Object.entries(TRANSIT_LOOKUP).map(([key, value]) => [normalizeTransitLookupKey(key), value]),
)

type PlanetMoveBank = Record<TransitAspectBand, [string, string, string]>

const TRANSIT_PLANET_DO: Record<string, PlanetMoveBank> = {
  moon: {
    hard: [
      "Name the feeling in one sentence before you reply or decide.",
      "Keep the hardest conversation under ten minutes; leave the rest.",
      "Protect a quiet hour — mood is louder than the facts today.",
    ],
    soft: [
      "Ask for the need cleanly while the mood is usable.",
      "Check in with home base, then take one kind next step.",
      "Use the softer weather to repair one small thing.",
    ],
    merge: [
      "Give the feeling a job: write it down, then pick one next step.",
      "Let the mood inform the plan — do not let it become the plan.",
      "Take a short reset, then do the one thing that actually matters.",
    ],
  },
  sun: {
    hard: [
      "Do not make an identity-level decision from a bruised ego.",
      "Shrink the stage. One honest task beats a performance.",
      "Take the feedback, keep the self. Decide tomorrow on the big call.",
    ],
    soft: [
      "Step into one visible lane: send, present, or ask.",
      "Use the easier light to finish something with your name on it.",
      "Show up once, clearly. Then stop selling.",
    ],
    merge: [
      "Pick the version of you that can finish today's work — not the whole year.",
      "Lead with one clear preference instead of a speech.",
      "Own one decision in writing and leave the rest.",
    ],
  },
  mercury: {
    hard: [
      "Draft first. Send the shorter version after a pause.",
      "Ask one clarifying question instead of winning the thread.",
      "Move the tense talk to text or a walk — not a live pile-on.",
    ],
    soft: [
      "Say the useful thing out loud. Keep it specific.",
      "Send the update you have been sitting on.",
      "Name the plan in three bullets and share it.",
    ],
    merge: [
      "Write it down before you debate it.",
      "One message, one ask. No stack of side issues.",
      "Fact-check once, then speak.",
    ],
  },
  venus: {
    hard: [
      "Keep money and affection decisions small and reversible.",
      "Say the real preference. Skip the people-pleasing yes.",
      "Do not buy peace. Sleep on the spend or the promise.",
    ],
    soft: [
      "Make one generous, concrete gesture — a note, a plan, a thank-you.",
      "Choose the option that actually feels good, not the impressive one.",
      "Invite one person into something simple and real.",
    ],
    merge: [
      "Check the value: is this worth your time, money, or warmth today?",
      "Beautify one corner or one conversation. Leave the overhaul.",
      "Be kind and specific. Vague sweetness helps no one.",
    ],
  },
  mars: {
    hard: [
      "Burn the heat in a short physical or focused block, then decide.",
      "Take the fight to the task, not the person.",
      "One assertive ask. No pile-on, no late-night launch.",
    ],
    soft: [
      "Start the thing you have been circling. Twenty focused minutes.",
      "Use the drive to finish, not to open five new fronts.",
      "Make the bold move that is still reversible by Friday.",
    ],
    merge: [
      "Pick one target and hit it. Stop at done.",
      "Move your body before you move the conflict.",
      "Act on the smallest next brick, not the whole war.",
    ],
  },
  jupiter: {
    hard: [
      "Say yes to one opening. Cap the rest so expansion does not become clutter.",
      "Write the upside and the cost before you leap.",
      "Share the idea. Delay the overcommit.",
    ],
    soft: [
      "Take the calculated yes you already researched.",
      "Teach, introduce, or ask — growth wants a conversation today.",
      "Widen one lane: a pitch, a hello, a stretch task.",
    ],
    merge: [
      "Expand by one honest step, not a life rewrite.",
      "Bet on the option you can explain in a sentence.",
      "Invite luck by shipping something unfinished-but-real.",
    ],
  },
  saturn: {
    hard: [
      "Do the overdue duty in a short block. Skip the self-trial.",
      "Rename the limit in one sentence so you can plan around it.",
      "Keep the commitment; cut the extra performance.",
    ],
    soft: [
      "Build one brick of structure: calendar, budget, or boundary.",
      "Ask for the real deadline and meet a slice of it today.",
      "Make the adult call you already know is correct.",
    ],
    merge: [
      "Choose the long-game move over the mood.",
      "Prune one obligation that is only guilt.",
      "Finish the unglamorous piece. That is the win.",
    ],
  },
  uranus: {
    hard: [
      "Change one variable, not the whole life. Keep an exit ramp.",
      "Name the restlessness. Do not torch a bridge before dinner.",
      "Try the new version as a 48-hour experiment.",
    ],
    soft: [
      "Say the true preference you have been editing.",
      "Take the unusual opening if it is reversible.",
      "Break one stale routine on purpose.",
    ],
    merge: [
      "Let one honest disruption in. Hold the rest.",
      "Update the plan; do not detonate the relationships.",
      "Write the new rule, then test it once.",
    ],
  },
  neptune: {
    hard: [
      "Verify one fact before you trust the story.",
      "Sleep on the vow, the spend, or the spiritual high.",
      "Ask a clear-eyed friend to read the situation with you.",
    ],
    soft: [
      "Make something — a note, a sketch, a playlist — instead of a promise.",
      "Use the softer focus for rest or art, not contracts.",
      "Name the ideal, then name the next practical inch.",
    ],
    merge: [
      "Keep the dream. Check the boundary.",
      "Write what you hope is true and what you can actually see.",
      "Choose rest over foggy decisions.",
    ],
  },
  pluto: {
    hard: [
      "Name the control struggle. Drop the extra leverage play.",
      "Tell the one true sentence. Do not run a full purge.",
      "If it is a power fight, pause until you can be specific.",
    ],
    soft: [
      "Compost one old habit. Keep the rest of the life standing.",
      "Have the honest conversation at half volume.",
      "Choose depth over drama: one real question.",
    ],
    merge: [
      "Change the one thing that is actually dead. Leave the rest.",
      "Get curious about the fear under the intensity.",
      "Keep the transformation small enough to finish.",
    ],
  },
}

const NATAL_PLANET_DO: Record<string, PlanetMoveBank> = {
  moon: {
    hard: [
      "Do not treat a mood spike as the whole story.",
      "Eat, rest, or step outside before you decide about people.",
      "Keep home-base needs visible: food, sleep, one safe person.",
    ],
    soft: [
      "Ask for comfort in a concrete way.",
      "Give yourself a short landing after the useful talk.",
      "Tend the nest a little, then rejoin the day.",
    ],
    merge: [
      "Check the body first, then the calendar.",
      "Let the feeling inform the next hour, not the next year.",
      "Protect evening wind-down even if the day ran hot.",
    ],
  },
  sun: {
    hard: [
      "Protect dignity. Delay any decision that feels like a verdict on you.",
      "Do one thing that is yours, then stop performing.",
      "Do not outsource your self-respect to today's reaction.",
    ],
    soft: [
      "Put your name on one finished piece.",
      "Take up an appropriate amount of space — one clear ask.",
      "Stand in the preference you already have.",
    ],
    merge: [
      "Lead with who you are today, not who you should impress.",
      "Keep the identity story small and true.",
      "Choose the work that still feels like you.",
    ],
  },
  mercury: {
    hard: [
      "Slow the words. Accuracy beats speed.",
      "Repeat back what you heard before you argue.",
      "If the thread is hot, switch to a voice note or a walk.",
    ],
    soft: [
      "Send the useful summary.",
      "Teach or explain one thing simply.",
      "Capture the idea before it evaporates.",
    ],
    merge: [
      "One inbox, one ask, done.",
      "Write the decision so future-you can read it.",
      "Leave the clever aside. Be clear.",
    ],
  },
  venus: {
    hard: [
      "Do not spend or attach to soothe the tension.",
      "Keep the conversation about this issue, not the whole relationship.",
      "Beauty later. Boundary now.",
    ],
    soft: [
      "Offer something small and real.",
      "Choose the option that respects both value and warmth.",
      "Make the plan you would actually enjoy.",
    ],
    merge: [
      "Check whether this is love, habit, or price.",
      "One kind concrete act. No grand gesture.",
      "Keep taste and money decisions reversible.",
    ],
  },
  mars: {
    hard: [
      "Do not pick the fight you cannot finish cleanly.",
      "Put the heat into a timed work sprint.",
      "Assert the boundary once. Do not reload.",
    ],
    soft: [
      "Start. Twenty minutes is enough to count.",
      "Use the energy to close a loop, not open a war.",
      "Make the ask while you have the nerve.",
    ],
    merge: [
      "Aim at one target.",
      "Move, then review — not the other way around.",
      "Leave leftover fight out of the evening.",
    ],
  },
  jupiter: {
    hard: [
      "Cap the yes. Expansion without a lid becomes mess.",
      "Do not bet the week on a maybe.",
      "Share the vision; delay the spend.",
    ],
    soft: [
      "Say the bigger yes that is still honest.",
      "Introduce two things that should meet.",
      "Take the stretch that has a floor under it.",
    ],
    merge: [
      "Grow the thing that already works.",
      "Teach one piece of what you know.",
      "Leave room after the opportunity.",
    ],
  },
  saturn: {
    hard: [
      "Meet the real constraint. Stop arguing with the clock.",
      "Do the unglamorous piece you owe.",
      "A clear no is kinder than a late yes.",
    ],
    soft: [
      "Put structure under one good thing.",
      "Schedule the follow-through before you celebrate.",
      "Ask for the terms in writing.",
    ],
    merge: [
      "Keep the long game visible on paper.",
      "Cut one empty obligation.",
      "Be the adult in the room for one decision.",
    ],
  },
  uranus: {
    hard: [
      "Change the variable you control. Leave other people's lives intact.",
      "Do not quit in a spike. Sleep first.",
      "Prototype the new rule for two days.",
    ],
    soft: [
      "Tell the truth you have been sanding down.",
      "Try the unusual option if you can undo it.",
      "Break one stale script on purpose.",
    ],
    merge: [
      "Update the system, not the identity, in one move.",
      "Let fresh air in without a demolition.",
      "Write the new preference down.",
    ],
  },
  neptune: {
    hard: [
      "Fog is not a plan. Verify before you commit.",
      "If it feels cinematic, wait a night.",
      "Ask what is actually in the contract.",
    ],
    soft: [
      "Use the softness for rest or making, not signatures.",
      "Keep the inspiration. Date-stamp the decision.",
      "Let music or water reset you, then rejoin facts.",
    ],
    merge: [
      "Hold the dream next to one measurable next step.",
      "Protect sleep. Tired brains invent meaning.",
      "Be kind, not vague.",
    ],
  },
  pluto: {
    hard: [
      "Drop the extra control move. Keep the real boundary.",
      "If it is a purge urge, wait until you can name one thing.",
      "Honesty without annihilation.",
    ],
    soft: [
      "Change the one dead piece. Leave the living parts.",
      "Ask the deeper question at half volume.",
      "Let something end without a speech.",
    ],
    merge: [
      "Stay with the discomfort long enough to see the real issue.",
      "Power used quietly is still power.",
      "Transform one habit, not the whole cast.",
    ],
  },
}

const ASPECT_DO: Record<string, string> = {
  square: "If it can wait until tomorrow without cost, let it.",
  opposition: "Get a second pair of eyes before you lock it.",
  conjunction: "Turn the volume down one notch and do the next concrete inch.",
  trine: "Use the easier lane: finish or send while it is open.",
  sextile: "The opening is real only if you take it — one small act.",
  quincunx: "Adjust the plan. Do not force the old version to fit.",
}

const ASPECT_DONT: Record<string, string> = {
  square: "Force a permanent decision in the friction spike",
  opposition: "Treat the other pole as the enemy",
  conjunction: "Assume louder means truer",
  trine: "Waste the opening on busywork",
  sextile: "Wait for a bigger sign",
  quincunx: "Pretend the mismatch is not there",
}

const DEFAULT_BANK: PlanetMoveBank = {
  hard: [
    "Shrink the plate. One reversible move, then reassess.",
    "Delay the permanent call. Handle the next hour well.",
    "Protect bandwidth. Food, pause, then one decision.",
  ],
  soft: [
    "Use the easier weather: finish one real thing.",
    "Send or schedule the useful next step.",
    "Make one clear ask while the lane is open.",
  ],
  merge: [
    "Pick one priority and give it a clean hour.",
    "Write the decision, then take the smallest step.",
    "Keep today specific. Leave the life rewrite.",
  ],
}

function bankFor(planet: string, table: Record<string, PlanetMoveBank>): PlanetMoveBank {
  const key = normalizeTransitLookupKey(planet)
  if (key === "rising" || key === "ascendant") return table.sun || DEFAULT_BANK
  if (key === "true node" || key === "north node" || key === "south node") {
    return table.saturn || DEFAULT_BANK
  }
  if (key === "chiron") return table.pluto || DEFAULT_BANK
  return table[key] || DEFAULT_BANK
}

function pickThree(a: [string, string, string], b: [string, string, string], extra: string): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const line of [a[0], b[0], extra, a[1], b[1], a[2]]) {
    const t = line.trim()
    if (!t || seen.has(t.toLowerCase())) continue
    seen.add(t.toLowerCase())
    out.push(t)
    if (out.length >= 3) break
  }
  return out
}

function composeEffect(transiting: string, aspect: string, natal: string): TransitInterpretation["effect"] {
  const band = aspectBand(aspect)
  const t = normalizeTransitLookupKey(transiting)
  const n = normalizeTransitLookupKey(natal)
  if (t === "neptune" || n === "neptune") return band === "hard" ? "foggy" : "confusing"
  if (t === "uranus" || n === "uranus") return band === "hard" ? "volatile" : "chaotic"
  if (t === "pluto" || n === "pluto") return "transformative"
  if (t === "saturn" || n === "saturn") return band === "hard" ? "restrictive" : "serious"
  if (t === "mars" && (aspectBand(aspect) === "hard" || n === "mercury")) return "tense"
  if (t === "mars") return band === "hard" ? "frustrated" : "energized"
  if (t === "jupiter") return band === "hard" ? "excessive" : "expansive"
  if (t === "moon" && band === "hard") return "heavy"
  if (band === "hard") return "intense"
  if (band === "soft") return "productive"
  return "neutral"
}

export function composeTransitInterpretation(
  transiting: string,
  aspect: string,
  natal: string,
): TransitInterpretation {
  const band = aspectBand(aspect)
  const transitBank = bankFor(transiting, TRANSIT_PLANET_DO)
  const natalBank = bankFor(natal, NATAL_PLANET_DO)
  const aspectKey = ASPECT_CANON[normalizeTransitLookupKey(aspect)] || aspect.trim().toLowerCase()
  const extra = ASPECT_DO[aspectKey] || DEFAULT_BANK[band][2]
  const tName = titleCasePlanet(transiting)
  const nName = titleCasePlanet(natal)
  const feel =
    band === "hard"
      ? "friction is asking for a smaller, clearer move"
      : band === "soft"
        ? "the lane is more open if you use it"
        : "volume is up — keep the next step specific"

  return {
    effect: composeEffect(transiting, aspect, natal),
    interpretation: `${tName} ${aspectKey} natal ${nName} — ${feel}.`,
    do: pickThree(transitBank[band], natalBank[band], extra),
    dont: [
      ASPECT_DONT[aspectKey] || GENERIC_TRANSIT_DONT,
      "Stack three issues into one conversation",
      "Treat today's weather as a life verdict",
    ],
  }
}

export function lookupTransitInterpretation(key: string): TransitInterpretation | undefined {
  return LOOKUP_BY_NORM.get(normalizeTransitLookupKey(key))
}

/**
 * Exact hand-authored hit when we have one; otherwise a planet+aspect composition
 * so every real transit gets a specific do-list (never the generic placeholder).
 */
export function resolveTransitInterpretation(key: string): TransitInterpretation {
  const hit = lookupTransitInterpretation(key)
  if (hit) return hit
  const parsed = parseTransitAspectKey(key)
  if (parsed) {
    return composeTransitInterpretation(parsed.transiting, parsed.aspect, parsed.natal)
  }
  return {
    effect: "neutral",
    interpretation: "Transit energy present",
    do: [...DEFAULT_BANK.merge],
    dont: [GENERIC_TRANSIT_DONT, "Force a permanent decision while the signal is unclear"],
  }
}

export function resolveTransitInterpretationFromParts(
  transiting: string,
  aspect: string,
  natal: string,
): TransitInterpretation {
  return resolveTransitInterpretation(formatTransitAspectKey(transiting, aspect, natal))
}

function effectFromEntry(t: unknown): string {
  if (typeof t === "string") {
    if (KNOWN_EFFECTS.has(t)) return t
    return resolveTransitInterpretation(t).effect
  }
  if (t && typeof t === "object") {
    const rec = t as { effect?: string; aspect?: string; transit_aspect?: string }
    if (rec.effect && KNOWN_EFFECTS.has(rec.effect)) return rec.effect
    const key = rec.transit_aspect || rec.aspect
    if (key) return resolveTransitInterpretation(key).effect
  }
  return "neutral"
}

export function getDayRating(
  transits: Array<string | { aspect?: string; effect?: string; transit_aspect?: string }>,
): "green" | "yellow" | "red" {
  const effects = transits.map(effectFromEntry)

  const challengingEffects = ["heavy", "intense", "frustrated", "chaotic", "volatile", "restrictive", "tense", "foggy"]
  const positiveEffects = ["positive", "expansive", "productive", "energized"]

  const challengingCount = effects.filter((e) => challengingEffects.includes(e)).length
  const positiveCount = effects.filter((e) => positiveEffects.includes(e)).length

  if (challengingCount > positiveCount) return "red"
  if (positiveCount > challengingCount) return "green"
  return "yellow"
}
