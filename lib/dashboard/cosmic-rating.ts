export type DayRating =
  | 'Very Positive'
  | 'Positive'
  | 'Neutral'
  | 'Challenging'
  | 'Very Challenging'
  | 'green'
  | 'yellow'
  | 'red';

export type DayRatingPresentation = {
  label: string;
  badgeClass: string;
  tooltip: string;
};

export function ratingToIntensity(dayRating?: DayRating | string): number {
  switch (dayRating?.toLowerCase()) {
    case 'very positive':
    case 'green':
      return 28;
    case 'positive':
      return 42;
    case 'neutral':
    case 'yellow':
      return 55;
    case 'challenging':
    case 'red':
      return 74;
    case 'very challenging':
      return 88;
    default:
      return 50;
  }
}

/**
 * High-contrast status pills: solid fill + dark text (readable on dark UI).
 * Avoid thin yellow/rose text on transparent backgrounds.
 */
export function getDayRatingPresentation(dayRating: string): DayRatingPresentation {
  const normalized = dayRating.toLowerCase();

  if (normalized === 'green') {
    return {
      label: 'Green',
      badgeClass: 'border-emerald-600/80 bg-emerald-400 text-emerald-950 shadow-sm shadow-emerald-500/25',
      tooltip:
        'Supportive transits outweigh friction today. Good energy for starting, building, and leaning into momentum.',
    };
  }

  if (normalized === 'yellow') {
    return {
      label: 'Yellow',
      badgeClass: 'border-amber-500/90 bg-amber-300 text-amber-950 shadow-sm shadow-amber-400/30',
      tooltip:
        'Mixed cosmic signals — challenging and supportive transits are roughly balanced. Pace yourself, stay flexible, and avoid forcing big moves.',
    };
  }

  if (normalized === 'red') {
    return {
      label: 'Red',
      badgeClass: 'border-rose-600/80 bg-rose-400 text-rose-950 shadow-sm shadow-rose-500/25',
      tooltip: 'Heavier transits are louder today. Simplify your plate, ground your nervous system, and protect your energy.',
    };
  }

  if (normalized === 'very positive') {
    return {
      label: 'Very Positive',
      badgeClass: 'border-emerald-600/80 bg-emerald-400 text-emerald-950 shadow-sm shadow-emerald-500/25',
      tooltip: 'Strongly favorable sky tone. Momentum is on your side — initiate, create, and act with confidence.',
    };
  }

  if (normalized === 'positive') {
    return {
      label: 'Positive',
      badgeClass: 'border-teal-600/80 bg-teal-300 text-teal-950 shadow-sm shadow-teal-400/25',
      tooltip: 'Generally supportive energy. Take one meaningful step forward and let progress compound.',
    };
  }

  if (normalized === 'neutral') {
    return {
      label: 'Neutral',
      badgeClass: 'border-amber-500/90 bg-amber-300 text-amber-950 shadow-sm shadow-amber-400/30',
      tooltip: 'Even cosmic pressure — neither strongly pushing nor blocking. Observe, reflect, and move deliberately.',
    };
  }

  if (normalized === 'challenging') {
    return {
      label: 'Challenging',
      badgeClass: 'border-orange-600/80 bg-orange-400 text-orange-950 shadow-sm shadow-orange-500/25',
      tooltip: 'Friction is elevated. Slow down, reduce load, and treat setbacks as information rather than verdicts.',
    };
  }

  if (normalized === 'very challenging') {
    return {
      label: 'Very Challenging',
      badgeClass: 'border-rose-600/80 bg-rose-400 text-rose-950 shadow-sm shadow-rose-500/25',
      tooltip:
        'High-intensity life weather. Minimize commitments, prioritize recovery, and defer non-essential battles.',
    };
  }

  return {
    label: dayRating,
    badgeClass: 'border-slate-400/50 bg-slate-300 text-slate-900 shadow-sm',
    tooltip: "Merlin's read on today's overall cosmic tone for your chart.",
  };
}