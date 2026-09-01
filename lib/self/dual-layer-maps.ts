/**
 * Dual-layer maps for the weather card.
 *
 * Core = what feels threatened. Mask = how it shows up.
 * Advice soothes the Core and coaches the Mask.
 * Weather copy never prints type labels — profile can.
 */

export const MBTI_TYPES = [
  'INFJ',
  'INFP',
  'INTJ',
  'INTP',
  'ENFJ',
  'ENFP',
  'ENTJ',
  'ENTP',
  'ISFJ',
  'ISFP',
  'ISTJ',
  'ISTP',
  'ESFJ',
  'ESFP',
  'ESTJ',
  'ESTP',
] as const;

export type MbtiType = (typeof MBTI_TYPES)[number];

export const MBTI_LABEL_RE =
  /\b(INFJ|INFP|INTJ|INTP|ENFJ|ENFP|ENTJ|ENTP|ISFJ|ISFP|ISTJ|ISTP|ESFJ|ESFP|ESTJ|ESTP)\b/gi;

export function parseMbtiType(value?: string | null): MbtiType | null {
  const raw = (value || '').trim().toUpperCase();
  return (MBTI_TYPES as readonly string[]).includes(raw) ? (raw as MbtiType) : null;
}

export function containsMbtiLabel(text: string | null | undefined): boolean {
  MBTI_LABEL_RE.lastIndex = 0;
  return MBTI_LABEL_RE.test(text || '');
}

export function stripMbtiLabels(text: string): string {
  return text
    .replace(MBTI_LABEL_RE, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .trim();
}

export interface CoreThreatMap {
  threatened: string;
  safetyNeed: string;
  hijack: string;
  help: string;
}

export interface MaskSymptomMap {
  showsAs: string;
  misreadAs: string;
  failureMode: string;
  coach: string;
}

export type GuidanceSequence =
  | 'feel-then-test'
  | 'feel-then-strategy'
  | 'insight-then-step'
  | 'options-then-rank'
  | 'framework-then-experiment'
  | 'choices-with-cost'
  | 'outcome-first'
  | 'expression-then-duty'
  | 'why-then-how'
  | 'logic-to-impact'
  | 'ask-then-prescribe'
  | 'protect-energy'
  | 'test-in-world'
  | 'evidence-then-vision'
  | 'vision-then-evidence'
  | 'close-then-flex'
  | 'explore-then-commit'
  | 'mask-coach';

export interface NearSplitOverride {
  tension: string;
  sequence: GuidanceSequence;
  /** "not a logic problem" — what the Mask will misdiagnose */
  whyNot?: string;
  watchFor?: string;
  avoid?: string;
  move?: string;
}

export interface DualLayerCardCopy {
  threatened: string;
  showsAs: string;
  move: string;
  why: string;
  watchFor: string;
  avoid: string;
  tension: string | null;
  source: 'near-split' | 'axis' | 'core-only';
}

export const CORE_THREAT: Record<MbtiType, CoreThreatMap> = {
  INFJ: {
    threatened: 'coherence — the sense that inner vision still maps to real life',
    safetyNeed: 'one quiet block to think without performing care',
    hijack: 'absorbing other people’s chaos and calling it purpose',
    help: 'Name the pattern, then one bounded act that protects the vision',
  },
  INFP: {
    threatened: 'authenticity — the right to feel before justifying',
    safetyNeed: 'permission that the feeling is data, not a defect',
    hijack: 'rewriting the story until the pain looks noble',
    help: 'Pick one value that will not be negotiated today',
  },
  INTJ: {
    threatened: 'competence and long-range control',
    safetyNeed: 'a system that still works',
    hijack: 'isolating to perfect the plan while the window closes',
    help: 'Run one experiment with a stop time, not a new master plan',
  },
  INTP: {
    threatened: 'logical consistency and room to keep looking',
    safetyNeed: 'unanswered questions allowed to stay open',
    hijack: 'turning the whole day into a theory so nothing has to be chosen',
    help: 'Rank two options, pick one for twenty-four hours',
  },
  ENFJ: {
    threatened: 'the group staying intact and people still growing',
    safetyNeed: 'knowing care is landing, not leaking',
    hijack: 'rescuing everyone and calling it leadership',
    help: 'Name one person you will not carry today',
  },
  ENFP: {
    threatened: 'possibility and the spark that makes life feel alive',
    safetyNeed: 'a door that is still open',
    hijack: 'starting three new meanings instead of finishing one',
    help: 'One inspired act, then stop adding plots',
  },
  ENTJ: {
    threatened: 'leverage, progress, the scoreboard',
    safetyNeed: 'a move that changes the board by tonight',
    hijack: 'forcing pace on people and calling it standards',
    help: 'One outcome metric, one deadline, no extra fronts',
  },
  ENTP: {
    threatened: 'freedom to test and the right to pivot',
    safetyNeed: 'debate space without being pinned',
    hijack: 'charming a new idea so the old one never gets tested',
    help: 'One test with a kill criterion',
  },
  ISFJ: {
    threatened: 'stable bonds and the duty that keeps people safe',
    safetyNeed: 'routines that still hold',
    hijack: 'over-functioning until resentment is the only leftover',
    help: 'One care task you keep, one you hand back',
  },
  ISFP: {
    threatened: 'the right to feel the moment without being managed',
    safetyNeed: 'beauty, body, quiet sensory truth',
    hijack: 'going silent and calling it peace',
    help: 'One sensory reset, then one honest sentence',
  },
  ISTJ: {
    threatened: 'predictability, proof that the rules still work',
    safetyNeed: 'a known procedure',
    hijack: 'doubling down on the old method after the facts changed',
    help: 'Keep the standard, change one step',
  },
  ISTP: {
    threatened: 'autonomy and the ability to fix it with their own hands',
    safetyNeed: 'a problem they can touch',
    hijack: 'disappearing into the tool instead of the relationship',
    help: 'One concrete fix, then re-enter',
  },
  ESFJ: {
    threatened: 'harmony and being needed',
    safetyNeed: 'the room still liking them',
    hijack: 'smiling through the real issue until it becomes a blowup',
    help: 'One clear ask, said once, without extra sugar',
  },
  ESFP: {
    threatened: 'aliveness and belonging in the room right now',
    safetyNeed: 'a win they can feel today',
    hijack: 'chasing stimulation to outrun the dip',
    help: 'One short-term win that does not create tomorrow’s mess',
  },
  ESTJ: {
    threatened: 'order, accountability, things staying done',
    safetyNeed: 'a list that closes',
    hijack: 'controlling people instead of the process',
    help: 'One measurable close, no extra enforcement',
  },
  ESTP: {
    threatened: 'momentum and the chance in front of them',
    safetyNeed: 'a move they can make now',
    hijack: 'escalating the fight or the bet because standing still feels like losing',
    help: 'One bold action with an exit ramp written first',
  },
};

export const MASK_SYMPTOM: Record<MbtiType, MaskSymptomMap> = {
  INFJ: {
    showsAs: 'wise, composed, already understanding you',
    misreadAs: 'unshakable',
    failureMode: 'quiet over-responsibility, then sudden withdrawal',
    coach: 'Drop the counselor voice for one hour; say the actual need',
  },
  INFP: {
    showsAs: 'open, artistic, endlessly willing to explore',
    misreadAs: 'uncommitted',
    failureMode: 'soft yeses that become resentment',
    coach: 'Pick one preference and say it out loud before dinner',
  },
  INTJ: {
    showsAs: 'strategic, certain, three steps ahead',
    misreadAs: 'cold',
    failureMode: 'issuing a plan nobody asked for',
    coach: 'Ask one question before you prescribe',
  },
  INTP: {
    showsAs: 'curious, detached, poking holes',
    misreadAs: 'not caring',
    failureMode: 'turning feeling into a briefing',
    coach: 'State the feeling in one sentence before the analysis',
  },
  ENFJ: {
    showsAs: 'warm leader, holding the room',
    misreadAs: 'fine',
    failureMode: 'managing everyone’s mood',
    coach: 'Leave one problem unrescued',
  },
  ENFP: {
    showsAs: 'sparkly, game, full of new frames',
    misreadAs: 'unserious',
    failureMode: 'a new story every hour',
    coach: 'Finish the current sentence before starting a better one',
  },
  ENTJ: {
    showsAs: 'commander, outcomes first',
    misreadAs: 'harsh',
    failureMode: 'turning the day into a campaign',
    coach: 'Shrink the battlefield to one objective',
  },
  ENTP: {
    showsAs: 'clever, debating, inventing on contact',
    misreadAs: 'arguing for sport',
    failureMode: 'winning the riff and losing the decision',
    coach: 'Pick a test, not a thesis',
  },
  ISFJ: {
    showsAs: 'helpful, reliable, anticipating needs',
    misreadAs: 'content',
    failureMode: 'silent overload',
    coach: 'Name one thing you will not do today',
  },
  ISFP: {
    showsAs: 'easy, aesthetic, go-with-the-flow',
    misreadAs: 'passive',
    failureMode: 'disappearing instead of disagreeing',
    coach: 'One sensory truth said plainly',
  },
  ISTJ: {
    showsAs: 'prepared, procedural, by the book',
    misreadAs: 'rigid',
    failureMode: 'enforcing yesterday’s process on today’s mess',
    coach: 'Keep the standard, change the step',
  },
  ISTP: {
    showsAs: 'calm fixer, low words',
    misreadAs: 'checked out',
    failureMode: 'solving the object and ignoring the person',
    coach: 'One fix, then one check-in',
  },
  ESFJ: {
    showsAs: 'host, glue, everyone-okay',
    misreadAs: 'not needing anything',
    failureMode: 'harmony at the cost of honesty',
    coach: 'One direct request, no apology attached',
  },
  ESFP: {
    showsAs: 'on, fun, in the moment',
    misreadAs: 'shallow',
    failureMode: 'lighting up the room to skip the dip',
    coach: 'One real feeling before the next hit of stimulation',
  },
  ESTJ: {
    showsAs: 'organized closer',
    misreadAs: 'bossy',
    failureMode: 'managing people like tasks',
    coach: 'Close one item, stop policing the rest',
  },
  ESTP: {
    showsAs: 'bold, fast, already moving',
    misreadAs: 'reckless',
    failureMode: 'doubling the bet when restless',
    coach: 'Act once, write the exit first',
  },
};

/** 32 high-frequency three-letter splits. Only override when Core and Mask share three letters. */
export const NEAR_SPLITS: Record<string, NearSplitOverride> = {
  'INFJ>INFP': {
    tension: 'Certainty vs possibility',
    sequence: 'insight-then-step',
    watchFor: 'endless reinterpretation dressed up as depth',
    avoid: 'letting idealism drift until nothing is chosen',
  },
  'INFP>INFJ': {
    tension: 'Personal feeling vs collective mission',
    sequence: 'feel-then-strategy',
    avoid: 'self-sacrifice that looks like purpose',
  },
  'INTJ>INTP': {
    tension: 'Execution vs endless refinement',
    sequence: 'framework-then-experiment',
    watchFor: 'analysis loops that miss the window',
  },
  'INTP>INTJ': {
    tension: 'Discovery vs closure',
    sequence: 'options-then-rank',
    avoid: 'forcing certainty before the question is finished',
  },
  'ENTJ>ENTP': {
    tension: 'Focus vs novelty',
    sequence: 'outcome-first',
    avoid: 'chasing every opportunity',
  },
  'ENTP>ENTJ': {
    tension: 'Freedom vs structure',
    sequence: 'choices-with-cost',
    avoid: 'overcommitting the calendar',
  },
  'ENFJ>ENFP': {
    tension: 'Responsibility vs freedom',
    sequence: 'feel-then-strategy',
    avoid: 'rescuing everyone',
  },
  'ENFP>ENFJ': {
    tension: 'Authenticity vs expectation',
    sequence: 'expression-then-duty',
    avoid: 'role exhaustion',
  },
  'ISTJ>ISFJ': {
    tension: 'Rules vs personal care',
    sequence: 'mask-coach',
    avoid: 'rigidity under stress',
  },
  'ISFJ>ISTJ': {
    tension: 'People needs vs standards',
    sequence: 'mask-coach',
    avoid: 'over-functioning for others',
  },
  'ESTJ>ESFJ': {
    tension: 'Efficiency vs harmony',
    sequence: 'outcome-first',
    avoid: 'controlling the room instead of the process',
  },
  'ESFJ>ESTJ': {
    tension: 'Harmony vs enforcement',
    sequence: 'mask-coach',
    avoid: 'resentment from over-giving',
  },
  'ISTP>ISFP': {
    tension: 'Detachment vs feeling',
    sequence: 'mask-coach',
    avoid: 'withdrawal',
  },
  'ISFP>ISTP': {
    tension: 'Feeling vs practicality',
    sequence: 'feel-then-test',
    avoid: 'suppressing the feeling to look practical',
  },
  'ESTP>ESFP': {
    tension: 'Winning vs belonging',
    sequence: 'outcome-first',
    avoid: 'impulsive escalation',
  },
  'ESFP>ESTP': {
    tension: 'Enjoyment vs achievement',
    sequence: 'mask-coach',
    avoid: 'distraction cycles',
  },
  'INFJ>INTJ': {
    tension: 'Meaning vs optimization',
    sequence: 'why-then-how',
    whyNot: 'an optimization problem',
    avoid: 'emotional neglect in the name of efficiency',
  },
  'INTJ>INFJ': {
    tension: 'Efficiency vs humanity',
    sequence: 'logic-to-impact',
    avoid: 'isolating until the plan is perfect',
  },
  'INFP>INTP': {
    tension: 'Heart vs logic',
    sequence: 'feel-then-test',
    whyNot: 'a logic problem',
    watchFor: 'briefing the feeling instead of feeling it',
    avoid: 'proving you are fine by explaining the weather instead of changing one variable',
    move: 'Pick one value that will not move today. By {deadline}, write the one-sentence test you can defend.',
  },
  'INTP>INFP': {
    tension: 'Logic vs identity',
    sequence: 'ask-then-prescribe',
    whyNot: 'an identity verdict',
    avoid: 'intellectualizing everything so nothing has to be felt',
  },
  'ENFJ>ENTJ': {
    tension: 'People vs performance',
    sequence: 'logic-to-impact',
    avoid: 'making relationships transactional',
  },
  'ENTJ>ENFJ': {
    tension: 'Results vs care',
    sequence: 'outcome-first',
    avoid: 'carrying everyone',
  },
  'ENFP>ENTP': {
    tension: 'Meaning vs novelty',
    sequence: 'expression-then-duty',
    avoid: 'fragmentation — a new frame every hour',
  },
  'ENTP>ENFP': {
    tension: 'Debate vs connection',
    sequence: 'feel-then-test',
    whyNot: 'a debate to win',
    avoid: 'performative optimism',
  },
  'ISFJ>INFJ': {
    tension: 'Preservation vs transformation',
    sequence: 'insight-then-step',
    avoid: 'martyrdom',
  },
  'INFJ>ISFJ': {
    tension: 'Vision vs duty',
    sequence: 'insight-then-step',
    avoid: "carrying other people's burdens",
  },
  'ESTJ>ENTJ': {
    tension: 'Process vs ambition',
    sequence: 'outcome-first',
    avoid: 'burnout from control',
  },
  'ENTJ>ESTJ': {
    tension: 'Innovation vs stability',
    sequence: 'outcome-first',
    avoid: 'impatience with the next milestone',
  },
  'ISFP>INFP': {
    tension: 'Present reality vs ideals',
    sequence: 'feel-then-strategy',
    avoid: 'passive longing',
  },
  'INFP>ISFP': {
    tension: 'Vision vs immediate life',
    sequence: 'feel-then-test',
    avoid: 'escapism instead of a tangible act',
  },
  'ESTP>ENTP': {
    tension: 'Action vs theory',
    sequence: 'outcome-first',
    avoid: 'chasing stimulation',
  },
  'ENTP>ESTP': {
    tension: 'Exploration vs commitment',
    sequence: 'choices-with-cost',
    avoid: 'reckless pivots',
  },
};

export interface AxisRule {
  id: 'ei' | 'sn' | 'tf' | 'jp';
  risk: string;
  transitHelp: string;
  tone: string;
  sequence: GuidanceSequence;
  whyNot?: string;
}

export function letterDiffs(core: MbtiType, mask: MbtiType): Array<'ei' | 'sn' | 'tf' | 'jp'> {
  const out: Array<'ei' | 'sn' | 'tf' | 'jp'> = [];
  if (core[0] !== mask[0]) out.push('ei');
  if (core[1] !== mask[1]) out.push('sn');
  if (core[2] !== mask[2]) out.push('tf');
  if (core[3] !== mask[3]) out.push('jp');
  return out;
}

export function nearSplitKey(core: MbtiType, mask: MbtiType): string {
  return `${core}>${mask}`;
}

export function axisRulesFor(core: MbtiType, mask: MbtiType): AxisRule[] {
  const diffs = letterDiffs(core, mask);
  const rules: AxisRule[] = [];
  if (diffs.includes('ei')) {
    if (core[0] === 'I') {
      rules.push({
        id: 'ei',
        risk: 'social overextension',
        transitHelp: 'schedule recovery time before major decisions',
        tone: 'Protect energy first',
        sequence: 'protect-energy',
        whyNot: 'a show to perform',
      });
    } else {
      rules.push({
        id: 'ei',
        risk: 'isolation during stress',
        transitHelp: 'seek feedback instead of withdrawing',
        tone: 'Test ideas in the world',
        sequence: 'test-in-world',
        whyNot: 'a reason to disappear',
      });
    }
  }
  if (diffs.includes('sn')) {
    if (core[1] === 'S') {
      rules.push({
        id: 'sn',
        risk: 'overpromising beyond practical capacity',
        transitHelp: 'return to evidence and routines',
        tone: 'Return to evidence',
        sequence: 'evidence-then-vision',
        whyNot: 'a vision you have to sell',
      });
    } else {
      rules.push({
        id: 'sn',
        risk: 'suppressing deeper aspirations',
        transitHelp: 'revisit long-range vision',
        tone: 'Revisit the longer vision',
        sequence: 'vision-then-evidence',
        whyNot: 'only a logistics problem',
      });
    }
  }
  if (diffs.includes('tf')) {
    if (core[2] === 'T') {
      rules.push({
        id: 'tf',
        risk: 'people-pleasing while privately disagreeing',
        transitHelp: 'state actual conclusions clearly',
        tone: 'Say the actual conclusion',
        sequence: 'ask-then-prescribe',
        whyNot: 'a mood to manage for the room',
      });
    } else {
      rules.push({
        id: 'tf',
        risk: 'rationalizing emotional choices',
        transitHelp: 'acknowledge feelings before analysis',
        tone: 'Feel it, then test it',
        sequence: 'feel-then-test',
        whyNot: 'a logic problem',
      });
    }
  }
  if (diffs.includes('jp')) {
    if (core[3] === 'J') {
      rules.push({
        id: 'jp',
        risk: 'hidden stress from uncertainty',
        transitHelp: 'define milestones',
        tone: 'Define the milestone',
        sequence: 'close-then-flex',
        whyNot: 'a need to keep every option open',
      });
    } else {
      rules.push({
        id: 'jp',
        risk: 'identity conflict from excessive structure',
        transitHelp: 'leave room for experimentation',
        tone: 'Leave room to experiment',
        sequence: 'explore-then-commit',
        whyNot: 'a closed plan',
      });
    }
  }
  return rules;
}

function period(text: string): string {
  const t = text.trim().replace(/\.+$/, '');
  return t ? `${t}.` : '';
}

function hasTimebox(text: string): boolean {
  return /\b(noon|dinner|6pm|3pm|hour|tonight|today|by \d)\b/i.test(text);
}

function withDeadline(text: string, deadline: string): string {
  const t = text.trim().replace(/\.+$/, '');
  if (!t) return t;
  if (hasTimebox(t) || !deadline) return period(t);
  return `${t} by ${deadline}.`;
}

function fillDeadline(template: string, deadline: string): string {
  return period(template.replace(/\{deadline\}/g, deadline || '6pm'));
}

function sequenceMove(
  sequence: GuidanceSequence,
  core: CoreThreatMap,
  mask: MaskSymptomMap,
  deadline: string,
): string {
  switch (sequence) {
    case 'feel-then-test':
      return `${period(core.help)} ${withDeadline(mask.coach, deadline)}`.trim();
    case 'feel-then-strategy':
      return `${period(core.help)} Then ${withDeadline(mask.coach, deadline)}`.trim();
    case 'insight-then-step':
      return `${period(core.help)} ${withDeadline(mask.coach, deadline)}`.trim();
    case 'options-then-rank':
      return `${period(core.help)} ${withDeadline(mask.coach, deadline)}`.trim();
    case 'framework-then-experiment':
      return `${period(core.help)} ${withDeadline(mask.coach, deadline)}`.trim();
    case 'choices-with-cost':
      return `${withDeadline(mask.coach, deadline)} ${period(core.help)}`.trim();
    case 'outcome-first':
      return `${period(core.help)} ${withDeadline(mask.coach, deadline)}`.trim();
    case 'expression-then-duty':
      return `${period(core.help)} ${withDeadline(mask.coach, deadline)}`.trim();
    case 'why-then-how':
      return `${period(core.help)} ${withDeadline(mask.coach, deadline)}`.trim();
    case 'logic-to-impact':
      return `${withDeadline(mask.coach, deadline)} ${period(core.help)}`.trim();
    case 'ask-then-prescribe':
      return `${withDeadline(mask.coach, deadline)} ${period(core.help)}`.trim();
    case 'protect-energy':
      return `Protect energy first. ${withDeadline(mask.coach, deadline)} ${period(core.help)}`.trim();
    case 'test-in-world':
      return `${withDeadline(mask.coach, deadline)} Test it in the world — don't isolate.`.trim();
    case 'evidence-then-vision':
      return `${period(core.help)} ${withDeadline(mask.coach, deadline)}`.trim();
    case 'vision-then-evidence':
      return `${period(core.help)} ${withDeadline(mask.coach, deadline)}`.trim();
    case 'close-then-flex':
      return `${period(core.help)} ${withDeadline(mask.coach, deadline)}`.trim();
    case 'explore-then-commit':
      return `${withDeadline(mask.coach, deadline)} Leave one reversible exit.`.trim();
    default:
      return `${withDeadline(mask.coach, deadline)} ${period(core.help)}`.trim();
  }
}

function sootheWhy(options: {
  core: CoreThreatMap;
  mask: MaskSymptomMap;
  transitAxis?: string | null;
  whyNot?: string;
}): string {
  const threat = options.core.threatened;
  const axis = (options.transitAxis || '').trim();
  const misread = options.whyNot || options.mask.misreadAs;
  if (axis && misread) {
    return `What's at risk is ${threat}. This weather is hitting ${axis} — not ${misread}.`;
  }
  if (axis) {
    return `What's at risk is ${threat}. This weather is hitting ${axis}.`;
  }
  if (misread) {
    return `What's at risk is ${threat} — not ${misread}.`;
  }
  return `What's at risk is ${threat}.`;
}

export interface ComposeDualLayerInput {
  coreType?: string | null;
  maskType?: string | null;
  deadline?: string | null;
  transitAxis?: string | null;
  domain?: string | null;
}

/**
 * Weather-card formula. No type labels in the returned copy.
 */
export function composeDualLayerCard(input: ComposeDualLayerInput): DualLayerCardCopy | null {
  const coreType = parseMbtiType(input.coreType);
  if (!coreType) return null;
  const maskType = parseMbtiType(input.maskType) || coreType;
  const deadline = (input.deadline || '6pm').trim();
  const core = CORE_THREAT[coreType];
  const mask = MASK_SYMPTOM[maskType];

  const diffs = letterDiffs(coreType, maskType);
  const near = diffs.length === 1 ? NEAR_SPLITS[nearSplitKey(coreType, maskType)] : undefined;
  const axes = diffs.length > 1 ? axisRulesFor(coreType, maskType) : diffs.length === 1 && !near
    ? axisRulesFor(coreType, maskType)
    : [];

  let sequence: GuidanceSequence = 'mask-coach';
  let whyNot: string | undefined;
  let watchFor = mask.failureMode;
  let avoid = core.hijack;
  let tension: string | null = null;
  let source: DualLayerCardCopy['source'] = coreType === maskType ? 'core-only' : 'axis';
  let moveOverride: string | undefined;

  if (near) {
    source = 'near-split';
    sequence = near.sequence;
    tension = near.tension;
    whyNot = near.whyNot;
    if (near.watchFor) watchFor = near.watchFor;
    if (near.avoid) avoid = near.avoid;
    moveOverride = near.move;
  } else if (axes.length) {
    source = 'axis';
    const primary = axes.find((a) => a.id === 'tf') || axes.find((a) => a.id === 'ei') || axes[0];
    sequence = primary.sequence;
    whyNot = primary.whyNot;
    tension = axes.map((a) => a.tone).join(' · ');
    if (axes.some((a) => a.id === 'tf' && coreType[2] === 'F')) {
      watchFor = MASK_SYMPTOM[maskType].failureMode;
    }
  }

  const move = moveOverride
    ? fillDeadline(moveOverride, deadline)
    : sequenceMove(sequence, core, mask, deadline);

  const why = sootheWhy({
    core,
    mask,
    transitAxis: input.transitAxis,
    whyNot,
  });

  return {
    threatened: core.threatened,
    showsAs: mask.showsAs,
    move: stripMbtiLabels(move.replace(/\s+/g, ' ').trim()),
    why: stripMbtiLabels(why.replace(/\s+/g, ' ').trim()),
    watchFor: stripMbtiLabels(period(watchFor)),
    avoid: stripMbtiLabels(period(avoid)),
    tension,
    source,
  };
}
