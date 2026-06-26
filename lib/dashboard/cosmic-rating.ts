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

export function getDayRatingPresentation(dayRating: string): DayRatingPresentation {
  const normalized = dayRating.toLowerCase();

  if (normalized === 'green') {
    return {
      label: 'Green',
      badgeClass: 'border-emerald-400/45 bg-emerald-500/15 text-emerald-200',
      tooltip:
        'Supportive transits outweigh friction today. Good energy for starting, building, and leaning into momentum.',
    };
  }

  if (normalized === 'yellow') {
    return {
      label: 'Yellow',
      badgeClass: 'border-yellow-400/55 bg-yellow-500/20 text-yellow-200',
      tooltip:
        'Mixed cosmic signals — challenging and supportive transits are roughly balanced. Pace yourself, stay flexible, and avoid forcing big moves.',
    };
  }

  if (normalized === 'red') {
    return {
      label: 'Red',
      badgeClass: 'border-rose-400/50 bg-rose-500/15 text-rose-200',
      tooltip: 'Heavier transits are louder today. Simplify your plate, ground your nervous system, and protect your energy.',
    };
  }

  if (normalized === 'very positive') {
    return {
      label: 'Very Positive',
      badgeClass: 'border-emerald-400/45 bg-emerald-500/15 text-emerald-200',
      tooltip: 'Strongly favorable sky tone. Momentum is on your side — initiate, create, and act with confidence.',
    };
  }

  if (normalized === 'positive') {
    return {
      label: 'Positive',
      badgeClass: 'border-teal-400/45 bg-teal-500/15 text-teal-200',
      tooltip: 'Generally supportive energy. Take one meaningful step forward and let progress compound.',
    };
  }

  if (normalized === 'neutral') {
    return {
      label: 'Neutral',
      badgeClass: 'border-yellow-400/55 bg-yellow-500/20 text-yellow-200',
      tooltip: 'Even cosmic pressure — neither strongly pushing nor blocking. Observe, reflect, and move deliberately.',
    };
  }

  if (normalized === 'challenging') {
    return {
      label: 'Challenging',
      badgeClass: 'border-orange-400/50 bg-orange-500/15 text-orange-200',
      tooltip: 'Friction is elevated. Slow down, reduce load, and treat setbacks as information rather than verdicts.',
    };
  }

  if (normalized === 'very challenging') {
    return {
      label: 'Very Challenging',
      badgeClass: 'border-rose-400/50 bg-rose-500/15 text-rose-200',
      tooltip:
        'High-intensity sky weather. Minimize commitments, prioritize recovery, and defer non-essential battles.',
    };
  }

  return {
    label: dayRating,
    badgeClass: 'border-white/15 bg-black/20 text-slate-200',
    tooltip: "Merlin's read on today's overall cosmic tone for your chart.",
  };
}