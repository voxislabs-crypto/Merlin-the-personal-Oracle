/**
 * Stable “default operating system” — who the person is across days.
 * Not transit weather. Safe to surface on Self, Oracle context, and share.
 */

export interface OperatingSystemTrait {
  id:
    | 'decision'
    | 'stress'
    | 'communication'
    | 'recharge'
    | 'blind_spots'
    | 'strengths';
  label: string;
  /** Short headline */
  value: string;
  /** Optional one-line detail */
  detail?: string;
}

export interface BuildOperatingSystemInput {
  /** Inner core type (preferred) */
  coreType?: string | null;
  /** Outer mask type when dual */
  maskType?: string | null;
}

function parseType(type?: string | null): {
  raw: string;
  e_i: 'E' | 'I';
  s_n: 'S' | 'N';
  t_f: 'T' | 'F';
  j_p: 'J' | 'P';
} | null {
  const raw = (type || '').trim().toUpperCase();
  if (raw.length !== 4) return null;
  const e_i = raw[0] as 'E' | 'I';
  const s_n = raw[1] as 'S' | 'N';
  const t_f = raw[2] as 'T' | 'F';
  const j_p = raw[3] as 'J' | 'P';
  if (!'EI'.includes(e_i) || !'SN'.includes(s_n) || !'TF'.includes(t_f) || !'JP'.includes(j_p)) {
    return null;
  }
  return { raw, e_i, s_n, t_f, j_p };
}

function decisionStyle(core: NonNullable<ReturnType<typeof parseType>>, mask: ReturnType<typeof parseType>): OperatingSystemTrait {
  if (mask && mask.t_f !== core.t_f) {
    if (core.t_f === 'F' && mask.t_f === 'T') {
      return {
        id: 'decision',
        label: 'Decision style',
        value: 'Heart first, proof second',
        detail: 'Inside you weigh values; outwardly you may argue with logic. Trust the felt read, then pressure-test.',
      };
    }
    return {
      id: 'decision',
      label: 'Decision style',
      value: 'Analysis first, warmth second',
      detail: 'Core runs on systems and clarity; the room often meets your softer filter. Don’t outsource hard calls to charm alone.',
    };
  }
  if (core.t_f === 'F') {
    return {
      id: 'decision',
      label: 'Decision style',
      value: 'Values-led',
      detail: 'You choose based on people impact and integrity — then build the rationale.',
    };
  }
  return {
    id: 'decision',
    label: 'Decision style',
    value: 'Logic-led',
    detail: 'You clarify the system first. Emotion is data, not the final vote.',
  };
}

function stressResponse(core: NonNullable<ReturnType<typeof parseType>>, mask: ReturnType<typeof parseType>): OperatingSystemTrait {
  const inward = core.e_i === 'I';
  const structured = core.j_p === 'J';
  if (mask && mask.e_i !== core.e_i) {
    return {
      id: 'stress',
      label: 'Stress response',
      value: inward ? 'Looks fine, goes quiet inside' : 'Looks busy, needs solitude later',
      detail: 'Under load, outer presentation and inner need diverge — protect recovery before the mask cracks.',
    };
  }
  if (inward && structured) {
    return {
      id: 'stress',
      label: 'Stress response',
      value: 'Withdraw and re-plan',
      detail: 'Pressure makes you tighten control and go private. Give yourself a clean plan before re-entering.',
    };
  }
  if (inward) {
    return {
      id: 'stress',
      label: 'Stress response',
      value: 'Withdraw and process',
      detail: 'You go quiet to sort signal from noise. Don’t force social performance mid-storm.',
    };
  }
  if (structured) {
    return {
      id: 'stress',
      label: 'Stress response',
      value: 'Mobilize and organize',
      detail: 'Stress becomes a checklist. Watch for over-controlling people when the list fails.',
    };
  }
  return {
    id: 'stress',
    label: 'Stress response',
    value: 'Talk it out / move',
    detail: 'You metabolize pressure through action and conversation. Leave room to change the plan mid-flight.',
  };
}

function communicationStyle(core: NonNullable<ReturnType<typeof parseType>>, mask: ReturnType<typeof parseType>): OperatingSystemTrait {
  if (mask && (mask.e_i !== core.e_i || mask.t_f !== core.t_f)) {
    return {
      id: 'communication',
      label: 'Communication style',
      value: 'Dual channel',
      detail: `Core speaks as ${core.raw}; the room often hears ${mask.raw}. Say the real thing once, then translate for the audience.`,
    };
  }
  if (core.e_i === 'E' && core.t_f === 'F') {
    return {
      id: 'communication',
      label: 'Communication style',
      value: 'Warm and expressive',
      detail: 'You think out loud with people in mind. Clarity comes through dialogue, not isolation.',
    };
  }
  if (core.e_i === 'E') {
    return {
      id: 'communication',
      label: 'Communication style',
      value: 'Direct and external',
      detail: 'You process by talking. Written drafts help when stakes are high.',
    };
  }
  if (core.t_f === 'F') {
    return {
      id: 'communication',
      label: 'Communication style',
      value: 'Considered and relational',
      detail: 'You choose words carefully for impact. Silence often means processing, not disinterest.',
    };
  }
  return {
    id: 'communication',
    label: 'Communication style',
    value: 'Precise and private',
    detail: 'You speak when the idea is ready. Incomplete thoughts stay internal until they hold.',
  };
}

function rechargeStyle(core: NonNullable<ReturnType<typeof parseType>>): OperatingSystemTrait {
  if (core.e_i === 'I') {
    return {
      id: 'recharge',
      label: 'Recharge style',
      value: 'Alone time is fuel',
      detail: core.s_n === 'N'
        ? 'Quiet + idea space restores you. Noise without meaning drains fast.'
        : 'Quiet + familiar rhythm restores you. Protect unscheduled blocks.',
    };
  }
  return {
    id: 'recharge',
    label: 'Recharge style',
    value: 'People and motion',
    detail: 'Connection and stimulation refill the tank — then you need a clean off-ramp so you don’t crash.',
  };
}

function strengths(core: NonNullable<ReturnType<typeof parseType>>): OperatingSystemTrait {
  const bits: string[] = [];
  if (core.s_n === 'N') bits.push('pattern recognition');
  else bits.push('practical realism');
  if (core.t_f === 'F') bits.push('empathic calibration');
  else bits.push('clear analysis');
  if (core.e_i === 'I') bits.push('depth focus');
  else bits.push('catalyzing others');
  if (core.j_p === 'J') bits.push('follow-through');
  else bits.push('adaptive improvisation');

  return {
    id: 'strengths',
    label: 'Strengths',
    value: bits.slice(0, 3).join(' · '),
    detail: `Stable ${core.raw} assets — weather changes intensity, not this baseline.`,
  };
}

function blindSpots(core: NonNullable<ReturnType<typeof parseType>>, mask: ReturnType<typeof parseType>): OperatingSystemTrait {
  const spots: string[] = [];
  if (core.t_f === 'F') spots.push('avoiding hard truths to keep harmony');
  else spots.push('under-weighting how decisions land emotionally');
  if (core.e_i === 'I') spots.push('going dark when people needed a signal');
  else spots.push('over-sharing or over-committing mid-energy');
  if (core.j_p === 'J') spots.push('locking plans too early');
  else spots.push('delaying closure when a call is already clear');
  if (mask && mask.raw !== core.raw) {
    spots.unshift('being misread — mask ≠ core');
  }

  return {
    id: 'blind_spots',
    label: 'Blind spots',
    value: spots[0],
    detail: spots.slice(1, 3).join(' · ') || undefined,
  };
}

/**
 * Evergreen operating system from chart personality types.
 * Pure — no transits, no day rating.
 */
export function buildOperatingSystemProfile(
  input: BuildOperatingSystemInput,
): OperatingSystemTrait[] {
  const core = parseType(input.coreType) || parseType(input.maskType);
  if (!core) return [];

  const mask =
    input.maskType && input.maskType.toUpperCase() !== core.raw
      ? parseType(input.maskType)
      : null;

  return [
    decisionStyle(core, mask),
    stressResponse(core, mask),
    communicationStyle(core, mask),
    rechargeStyle(core),
    strengths(core),
    blindSpots(core, mask),
  ];
}
