import type { DualOverlay } from '@/lib/personality/dual-overlay';

type DimensionKey = 'e_i' | 's_n' | 't_f' | 'j_p';

const DIMENSION_META: Record<
  DimensionKey,
  { label: string; left: string; right: string; leftName: string; rightName: string }
> = {
  e_i: { label: 'Energy', left: 'E', right: 'I', leftName: 'Extraversion', rightName: 'Introversion' },
  s_n: { label: 'Perception', left: 'S', right: 'N', leftName: 'Sensing', rightName: 'Intuition' },
  t_f: { label: 'Decision', left: 'T', right: 'F', leftName: 'Thinking', rightName: 'Feeling' },
  j_p: { label: 'Structure', left: 'J', right: 'P', leftName: 'Judging', rightName: 'Perceiving' },
};

const DIMENSION_BLEND: Record<DimensionKey, Record<string, string>> = {
  e_i: {
    'E-I': 'You broadcast outward energy while your inner world runs on solitude — charisma on the surface, depth underneath.',
    'I-E': 'You recharge in private but can project warmth when the room needs you — quiet core, selective spotlight.',
    'E-E': 'Both layers lean outward — you are seen as engaged, expressive, and socially alive.',
    'I-I': 'Both layers lean inward — you process privately and reveal yourself in measured doses.',
  },
  s_n: {
    'S-N': 'You present as grounded and concrete while your inner mind tracks patterns, symbols, and what comes next.',
    'N-S': 'You may seem abstract or future-oriented outwardly, but privately you trust facts, memory, and what has worked.',
    'S-S': 'Both layers favor the tangible — facts, precedent, and what can be verified.',
    'N-N': 'Both layers favor patterns — meaning, possibility, and the story behind the facts.',
  },
  t_f: {
    'T-F': 'You project logic and structure while your core weighs values, empathy, and what feels right.',
    'F-T': 'You may seem warm or values-led outwardly, but inside you run a precise, analytical engine.',
    'T-T': 'Both layers decide with logic — clarity, systems, and honest assessment.',
    'F-F': 'Both layers decide with values — empathy, integrity, and human impact.',
  },
  j_p: {
    'J-P': 'You appear organized and decisive while your inner self prefers flexibility and room to adapt.',
    'P-J': 'You may seem spontaneous outwardly, but privately you crave closure, order, and a plan that holds.',
    'J-J': 'Both layers prefer structure — plans, closure, and clear expectations.',
    'P-P': 'Both layers prefer flow — openness, improvisation, and keeping options alive.',
  },
};

export function getDimensionMeta(key: DimensionKey) {
  return DIMENSION_META[key];
}

export interface BlendSynthesis {
  headline: string;
  summary: string;
  alignedDimensions: DimensionKey[];
  splitDimensions: Array<{ key: DimensionKey; mask: string; core: string; note: string }>;
  sameType: boolean;
}

export function buildBlendSynthesis(dualOverlay: DualOverlay): BlendSynthesis {
  const maskType = dualOverlay.hardware.mbtiType;
  const coreType = dualOverlay.firmware.mbtiType;
  const finalType = dualOverlay.finalType;
  const sameType = maskType === coreType;

  const alignedDimensions: DimensionKey[] = [];
  const splitDimensions: BlendSynthesis['splitDimensions'] = [];

  (Object.keys(DIMENSION_META) as DimensionKey[]).forEach((key) => {
    const mask = dualOverlay.hardware.breakdown[key];
    const core = dualOverlay.firmware.breakdown[key];
    if (mask === core) {
      alignedDimensions.push(key);
    } else {
      const pairKey = `${mask}-${core}`;
      splitDimensions.push({
        key,
        mask,
        core,
        note: DIMENSION_BLEND[key][pairKey] ?? `Mask leans ${mask}, core leans ${core}.`,
      });
    }
  });

  let headline: string;
  let summary: string;

  if (sameType) {
    headline = `${maskType} — aligned inside and out`;
    summary = `Your Mask and Core share the same four-letter type. What people see matches what drives you — with ${dualOverlay.firmware.confidence}% inner confidence and ${dualOverlay.hardware.confidence}% outer projection.`;
  } else if (splitDimensions.length === 4) {
    headline = `${maskType} meets ${coreType}`;
    summary = `Every dimension splits between layers — you are a full dual architecture. Merlin reads your lived type as ${finalType}, blending outer performance with inner truth.`;
  } else if (splitDimensions.length >= 2) {
    headline = `${maskType} mask · ${coreType} core`;
    const splitLabels = splitDimensions.map((d) => DIMENSION_META[d.key].label.toLowerCase()).join(', ');
    summary = `You diverge on ${splitLabels}. Shared dimensions anchor your identity; the splits explain why people sometimes misread you. Final blend: ${finalType}.`;
  } else {
    headline = `${maskType} → ${coreType}`;
    const split = splitDimensions[0];
    const dimLabel = split ? DIMENSION_META[split.key].label.toLowerCase() : 'one dimension';
    summary = `Nearly aligned — only ${dimLabel} shifts between what they see and what you feel. ${split?.note ?? ''} Merlin's integrated read: ${finalType}.`;
  }

  return {
    headline,
    summary,
    alignedDimensions,
    splitDimensions,
    sameType,
  };
}