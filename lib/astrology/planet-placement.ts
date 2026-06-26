import { HOUSE_MEANINGS, PLANET_TOOLTIPS } from '@/lib/astrology/BirthChartTooltips';

const PLACEMENT_WHISPERS: Record<string, Record<string, string>> = {
  Sun: {
    Aries: "You burn to be first. Not best. First. There's a difference.",
    Taurus: "You slow everything down until it becomes solid. That's power.",
    Gemini: 'You scatter yourself across a thousand interests. Collect the pieces later.',
    Cancer: "You protect what's soft. Even if it means hiding what shines.",
    Leo: 'You burn to be seen. Not admired. Understood.',
    Virgo: "You fix what's broken. Including yourself. Especially yourself.",
    Libra: "You want peace. But you'll go to war for it if you must.",
    Scorpio: 'You dig until you hit bone. Then you keep digging.',
    Sagittarius: 'You need the horizon. Walls make you sick.',
    Capricorn: "You climb because falling isn't an option. Never was.",
    Aquarius: "You see the future. It's lonely there. You go anyway.",
    Pisces: "You dissolve boundaries. Yours first. Then everyone else's.",
  },
  Moon: {
    Aries: 'Your heart is a fist. Quick to swing, quick to heal.',
    Taurus: 'You hold on. To everything. Even what hurts.',
    Gemini: 'Your feelings are moths. Fluttering, never landing.',
    Cancer: 'You remember everything. Every slight. Every kindness.',
    Leo: "You need applause for your feelings. That's not weakness. That's honesty.",
    Virgo: 'You count your feelings like pills. Measure. Manage. Rarely express.',
    Libra: "You feel in relation to others. Alone, you don't know what you feel.",
    Scorpio: 'Your emotions are a flood. You either drown or learn to breathe underwater.',
    Sagittarius: 'You escape your feelings by running toward the next thing.',
    Capricorn: "You bury feelings like treasure. Dig them up when it's safe. Never is.",
    Aquarius: 'You detach to survive. Then wonder why you feel nothing.',
    Pisces: "You absorb everyone's pain. Call it empathy. Call it drowning.",
  },
  Mercury: {
    Aries: 'You speak fire. Regret it later. Speak fire again.',
    Taurus: 'Your words are slow. Heavy. Built to last.',
    Gemini: "You rewrite the story every time you tell it. That's not lying. That's editing.",
    Cancer: 'You speak in memories. Past tense is your native tongue.',
    Leo: "Every word is a performance. You're not fake. You're just always on stage.",
    Virgo: 'You edit as you speak. Three sentences become one. One becomes silence.',
    Libra: 'You say what keeps the peace. Truth comes second.',
    Scorpio: 'You speak in codes. Only the worthy decipher.',
    Sagittarius: "You preach. Can't help it. The truth chose you, not the other way around.",
    Capricorn: 'Your words are scaffolding. Built to hold weight, not beauty.',
    Aquarius: 'You think sideways. The rest of us play catch-up.',
    Pisces: 'You speak in metaphors. Reality is too sharp for your tongue.',
  },
  Venus: {
    Aries: 'You love like a match. Fast. Hot. Over.',
    Taurus: "You love slow and deep. Once you're in, you're in.",
    Gemini: 'You love with words. The body is secondary. The mind is everything.',
    Cancer: 'You love like home. Safe. Soft. Hard to leave.',
    Leo: "You love loudly. If it's quiet, it's not love.",
    Virgo: 'You love by fixing. Acts of service are your love language. All of them.',
    Libra: 'You love the idea of love. The person second.',
    Scorpio: "You love 'til it bleeds. Yours. Theirs. Doesn't matter.",
    Sagittarius: 'You love freedom more than the person. They need to understand that.',
    Capricorn: 'You earn love. Give love. But asking for love? Terrifying.',
    Aquarius: 'You love humanity. The individual? That\'s harder.',
    Pisces: "You love everyone. Including the ones who don't deserve it. Especially them.",
  },
  Mars: {
    Aries: 'You strike first. Ask questions later. Or never.',
    Taurus: "You move when you're ready. Not before. Pushing you makes it worse.",
    Gemini: 'You dart and weave. Fighting you is like fighting smoke.',
    Cancer: 'You fight for others. For yourself? That\'s harder.',
    Leo: "Every fight is theater. You're here to win and look good doing it.",
    Virgo: 'You sharpen the blade before you swing. Preparation is your weapon.',
    Libra: "You fight fair. Even when they don't. Especially when they don't.",
    Scorpio: "You strike from the shadows. By the time they see you, it's over.",
    Sagittarius: 'You fight for principles. People are secondary.',
    Capricorn: 'You conquer. Slowly. Methodically. Inevitably.',
    Aquarius: 'You rebel quietly. Then loudly. Then you disappear.',
    Pisces: "You avoid conflict. Until you can't. Then you dissolve.",
  },
};

export function getPlacementWhisper(planet: string, sign: string): string {
  return PLACEMENT_WHISPERS[planet]?.[sign] ?? `${planet} in ${sign}. Rare. Intense. You.`;
}

export function ordinalHouse(house: number): string {
  const suffix =
    house % 10 === 1 && house !== 11
      ? 'st'
      : house % 10 === 2 && house !== 12
        ? 'nd'
        : house % 10 === 3 && house !== 13
          ? 'rd'
          : 'th';
  return `${house}${suffix}`;
}

export function getPlanetPlacementInterpretation(
  planetName: string,
  sign: string,
  house?: number
): string {
  const whisper = PLACEMENT_WHISPERS[planetName]?.[sign];
  const tooltip = PLANET_TOOLTIPS[planetName];

  const core =
    whisper ??
    (tooltip
      ? `${planetName} in ${sign} channels ${tooltip.charAt(0).toLowerCase()}${tooltip.slice(1)}`
      : `${planetName} in ${sign} marks a distinct thread in your chart.`);

  if (house && HOUSE_MEANINGS[house]) {
    const houseTheme = HOUSE_MEANINGS[house].replace(/\.$/, '').toLowerCase();
    return `${core} In the ${ordinalHouse(house)} house, this shows up wherever ${houseTheme}.`;
  }

  return core;
}