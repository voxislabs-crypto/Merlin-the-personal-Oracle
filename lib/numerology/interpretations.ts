import type { CoreNumber } from '@/lib/numerology/pythagorean';

export type NumberInterpretation = {
  title: string;
  essence: string;
  strength: string;
  shadow: string;
  timing?: string;
};

export const CORE_NUMBER_MEANINGS: Record<CoreNumber, NumberInterpretation> = {
  1: {
    title: 'The Pioneer',
    essence: 'Initiative, independence, and the courage to begin.',
    strength: 'You move first, define direction, and claim authorship over your path.',
    shadow: 'Impatience or ego-led pushing when collaboration would serve better.',
  },
  2: {
    title: 'The Diplomat',
    essence: 'Partnership, sensitivity, and harmonizing opposing forces.',
    strength: 'You read the room, mediate tension, and build trust through presence.',
    shadow: 'Over-accommodation or waiting for permission instead of stating needs.',
  },
  3: {
    title: 'The Creator',
    essence: 'Expression, joy, and translating inner life into visible form.',
    strength: 'You inspire through language, art, humor, and emotional color.',
    shadow: 'Scattered focus or performing optimism while avoiding depth.',
  },
  4: {
    title: 'The Builder',
    essence: 'Structure, discipline, and turning vision into reliable systems.',
    strength: 'You stabilize chaos with process, patience, and practical craft.',
    shadow: 'Rigidity, over-control, or mistaking security for aliveness.',
  },
  5: {
    title: 'The Explorer',
    essence: 'Freedom, adaptability, and learning through lived experience.',
    strength: 'You thrive in change, travel, and experiments that expand perspective.',
    shadow: 'Restlessness, avoidance, or chasing novelty without integration.',
  },
  6: {
    title: 'The Nurturer',
    essence: 'Responsibility, beauty, and service to people and place.',
    strength: 'You hold space, restore balance, and protect what matters.',
    shadow: 'Martyrdom, control through care, or carrying others’ loads as identity.',
  },
  7: {
    title: 'The Seeker',
    essence: 'Analysis, mystery, and devotion to inner truth.',
    strength: 'You distill signal from noise and honor solitude as sacred.',
    shadow: 'Isolation, skepticism as armor, or analysis that delays embodiment.',
  },
  8: {
    title: 'The Sovereign',
    essence: 'Power, material mastery, and accountable leadership.',
    strength: 'You organize resources, scale impact, and stand in earned authority.',
    shadow: 'Workaholism, status fixation, or force without ethical grounding.',
  },
  9: {
    title: 'The Humanitarian',
    essence: 'Completion, compassion, and wisdom earned through release.',
    strength: 'You see the larger story and serve endings that make room for renewal.',
    shadow: 'Emotional overwhelm, savior patterns, or difficulty letting go.',
  },
  11: {
    title: 'The Illuminator',
    essence: 'Intuition, inspiration, and high-frequency insight.',
    strength: 'You channel vision that uplifts others when grounded in practice.',
    shadow: 'Nervous intensity, idealism without embodiment, or spiritual bypass.',
    timing: 'Master number — not reduced. Operates like a amplified 2 with visionary voltage.',
  },
  22: {
    title: 'The Master Builder',
    essence: 'Large-scale manifestation and legacy architecture.',
    strength: 'You can translate vision into structures that outlast you.',
    shadow: 'Pressure to perform at impossible scale, or fear of your own magnitude.',
    timing: 'Master number — not reduced. Operates like an amplified 4 with global reach.',
  },
  33: {
    title: 'The Master Teacher',
    essence: 'Compassion in action and healing through presence.',
    strength: 'You teach through example and raise the emotional frequency of rooms you enter.',
    shadow: 'Over-responsibility for others’ healing or collapsing under empathic load.',
    timing: 'Master number — not reduced. Operates like an amplified 6 with transpersonal service.',
  },
};

export function getNumberMeaning(number: CoreNumber | null | undefined): NumberInterpretation | null {
  if (!number) return null;
  return CORE_NUMBER_MEANINGS[number] ?? null;
}

export function buildAstroNumerologyBlend(params: {
  lifePath: CoreNumber | null;
  sunSign?: string;
  moonSign?: string;
  personalYear?: CoreNumber | null;
}): string {
  const { lifePath, sunSign, moonSign, personalYear } = params;
  if (!lifePath) {
    return 'Add your birth date and full name to generate a numerical blueprint.';
  }

  const lifePathMeaning = CORE_NUMBER_MEANINGS[lifePath];
  const parts = [
    `Life Path ${lifePath} (${lifePathMeaning.title}) sets your core curriculum: ${lifePathMeaning.essence}`,
  ];

  if (sunSign) {
    parts.push(`Your ${sunSign} Sun expresses that path outwardly — identity and will color how the number shows up in daily life.`);
  }

  if (moonSign) {
    parts.push(`Your ${moonSign} Moon handles the emotional tone — how the same number feels from the inside.`);
  }

  if (personalYear) {
    const yearMeaning = CORE_NUMBER_MEANINGS[personalYear];
    parts.push(
      `This ${personalYear} Personal Year (${yearMeaning.title}) emphasizes ${yearMeaning.essence.toLowerCase()} — a useful lens alongside current transits.`
    );
  }

  return parts.join(' ');
}