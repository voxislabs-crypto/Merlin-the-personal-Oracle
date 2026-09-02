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
  /** Inner read — what Core notices before the Mask agrees. */
  notices: string;
}

export interface MaskSymptomMap {
  showsAs: string;
  misreadAs: string;
  failureMode: string;
  coach: string;
  /** Coping move the room sees / the user reaches for. */
  wants: string;
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
  coreNotices: string;
  maskWants: string;
  tensionLine: string;
  resolution: string;
  whyThisPerson: string;
  behaviorTell: string;
  weeklyCharacter: {
    title: string;
    strength: string;
    blindSpot: string;
  };
}

export const CORE_THREAT: Record<MbtiType, CoreThreatMap> = {
  INFJ: {
    threatened: 'coherence — the sense that inner vision still maps to real life',
    safetyNeed: 'one quiet block to think without performing care',
    hijack: 'absorbing other people’s chaos and calling it purpose',
    help: 'Name the pattern, then one bounded act that protects the vision',
    notices: 'The pattern is already visible. Coherence is slipping.',
  },
  INFP: {
    threatened: 'authenticity — the right to feel before justifying',
    safetyNeed: 'permission that the feeling is data, not a defect',
    hijack: 'rewriting the story until the pain looks noble',
    help: 'Pick one value that will not be negotiated today',
    notices: 'Something already shifted. The inner vote is in.',
  },
  INTJ: {
    threatened: 'competence and long-range control',
    safetyNeed: 'a system that still works',
    hijack: 'isolating to perfect the plan while the window closes',
    help: 'Run one experiment with a stop time, not a new master plan',
    notices: 'The long-range plan feels less in control than it should.',
  },
  INTP: {
    threatened: 'logical consistency and room to keep looking',
    safetyNeed: 'unanswered questions allowed to stay open',
    hijack: 'turning the whole day into a theory so nothing has to be chosen',
    help: 'Rank two options, pick one for twenty-four hours',
    notices: 'The model has a hole. Questions want to stay open.',
  },
  ENFJ: {
    threatened: 'the group staying intact and people still growing',
    safetyNeed: 'knowing care is landing, not leaking',
    hijack: 'rescuing everyone and calling it leadership',
    help: 'Name one person you will not carry today',
    notices: 'Someone in the room is not growing. Care is leaking.',
  },
  ENFP: {
    threatened: 'possibility and the spark that makes life feel alive',
    safetyNeed: 'a door that is still open',
    hijack: 'starting three new meanings instead of finishing one',
    help: 'One inspired act, then stop adding plots',
    notices: 'The spark is dimming. A door wants to stay open.',
  },
  ENTJ: {
    threatened: 'leverage, progress, the scoreboard',
    safetyNeed: 'a move that changes the board by tonight',
    hijack: 'forcing pace on people and calling it standards',
    help: 'One outcome metric, one deadline, no extra fronts',
    notices: 'The scoreboard is slipping. Leverage wants a move tonight.',
  },
  ENTP: {
    threatened: 'freedom to test and the right to pivot',
    safetyNeed: 'debate space without being pinned',
    hijack: 'charming a new idea so the old one never gets tested',
    help: 'One test with a kill criterion',
    notices: 'A test is being blocked. Pivot energy is up.',
  },
  ISFJ: {
    threatened: 'stable bonds and the duty that keeps people safe',
    safetyNeed: 'routines that still hold',
    hijack: 'over-functioning until resentment is the only leftover',
    help: 'One care task you keep, one you hand back',
    notices: 'A bond or duty feels less safe than yesterday.',
  },
  ISFP: {
    threatened: 'the right to feel the moment without being managed',
    safetyNeed: 'beauty, body, quiet sensory truth',
    hijack: 'going silent and calling it peace',
    help: 'One sensory reset, then one honest sentence',
    notices: 'The moment is being managed. The body wants out.',
  },
  ISTJ: {
    threatened: 'predictability, proof that the rules still work',
    safetyNeed: 'a known procedure',
    hijack: 'doubling down on the old method after the facts changed',
    help: 'Keep the standard, change one step',
    notices: 'The procedure no longer matches the facts.',
  },
  ISTP: {
    threatened: 'autonomy and the ability to fix it with their own hands',
    safetyNeed: 'a problem they can touch',
    hijack: 'disappearing into the tool instead of the relationship',
    help: 'One concrete fix, then re-enter',
    notices: 'Hands want a problem they can actually fix.',
  },
  ESFJ: {
    threatened: 'harmony and being needed',
    safetyNeed: 'the room still liking them',
    hijack: 'smiling through the real issue until it becomes a blowup',
    help: 'One clear ask, said once, without extra sugar',
    notices: 'Harmony is costing honesty. Being needed is louder.',
  },
  ESFP: {
    threatened: 'aliveness and belonging in the room right now',
    safetyNeed: 'a win they can feel today',
    hijack: 'chasing stimulation to outrun the dip',
    help: 'One short-term win that does not create tomorrow’s mess',
    notices: 'Aliveness is dipping. The room wants a win now.',
  },
  ESTJ: {
    threatened: 'order, accountability, things staying done',
    safetyNeed: 'a list that closes',
    hijack: 'controlling people instead of the process',
    help: 'One measurable close, no extra enforcement',
    notices: 'Something is not staying done. The list wants a close.',
  },
  ESTP: {
    threatened: 'momentum and the chance in front of them',
    safetyNeed: 'a move they can make now',
    hijack: 'escalating the fight or the bet because standing still feels like losing',
    help: 'One bold action with an exit ramp written first',
    notices: 'Standing still feels like losing. Momentum wants a bet.',
  },
};

export const MASK_SYMPTOM: Record<MbtiType, MaskSymptomMap> = {
  INFJ: {
    showsAs: 'wise, composed, already understanding you',
    misreadAs: 'unshakable',
    failureMode: 'quiet over-responsibility, then sudden withdrawal',
    coach: 'Drop the counselor voice for one hour; say the actual need',
    wants: 'To look composed and already-understanding, then carry it alone.',
  },
  INFP: {
    showsAs: 'open, artistic, endlessly willing to explore',
    misreadAs: 'uncommitted',
    failureMode: 'soft yeses that become resentment',
    coach: 'Pick one preference and say it out loud before dinner',
    wants: 'To stay open so no one has to hear a no.',
  },
  INTJ: {
    showsAs: 'strategic, certain, three steps ahead',
    misreadAs: 'cold',
    failureMode: 'issuing a plan nobody asked for',
    coach: 'Ask one question before you prescribe',
    wants: 'To issue a plan three steps ahead.',
  },
  INTP: {
    showsAs: 'curious, detached, poking holes',
    misreadAs: 'not caring',
    failureMode: 'turning feeling into a briefing',
    coach: 'State the feeling in one sentence before the analysis',
    wants: 'More proof. A briefing before a feeling counts as real.',
  },
  ENFJ: {
    showsAs: 'warm leader, holding the room',
    misreadAs: 'fine',
    failureMode: 'managing everyone’s mood',
    coach: 'Leave one problem unrescued',
    wants: 'To hold everyone’s mood so the room stays intact.',
  },
  ENFP: {
    showsAs: 'sparkly, game, full of new frames',
    misreadAs: 'unserious',
    failureMode: 'a new story every hour',
    coach: 'Finish the current sentence before starting a better one',
    wants: 'A new frame every hour so the dip never lands.',
  },
  ENTJ: {
    showsAs: 'commander, outcomes first',
    misreadAs: 'harsh',
    failureMode: 'turning the day into a campaign',
    coach: 'Shrink the battlefield to one objective',
    wants: 'To turn the day into a campaign with one scoreboard.',
  },
  ENTP: {
    showsAs: 'clever, debating, inventing on contact',
    misreadAs: 'arguing for sport',
    failureMode: 'winning the riff and losing the decision',
    coach: 'Pick a test, not a thesis',
    wants: 'To win the riff before picking a test.',
  },
  ISFJ: {
    showsAs: 'helpful, reliable, anticipating needs',
    misreadAs: 'content',
    failureMode: 'silent overload',
    coach: 'Name one thing you will not do today',
    wants: 'To anticipate every need so no one sees the load.',
  },
  ISFP: {
    showsAs: 'easy, aesthetic, go-with-the-flow',
    misreadAs: 'passive',
    failureMode: 'disappearing instead of disagreeing',
    coach: 'One sensory truth said plainly',
    wants: 'To look easy and disappear instead of disagreeing.',
  },
  ISTJ: {
    showsAs: 'prepared, procedural, by the book',
    misreadAs: 'rigid',
    failureMode: 'enforcing yesterday’s process on today’s mess',
    coach: 'Keep the standard, change the step',
    wants: 'To keep yesterday’s process running on today’s mess.',
  },
  ISTP: {
    showsAs: 'calm fixer, low words',
    misreadAs: 'checked out',
    failureMode: 'solving the object and ignoring the person',
    coach: 'One fix, then one check-in',
    wants: 'To fix the object and skip the person.',
  },
  ESFJ: {
    showsAs: 'host, glue, everyone-okay',
    misreadAs: 'not needing anything',
    failureMode: 'harmony at the cost of honesty',
    coach: 'One direct request, no apology attached',
    wants: 'Everyone okay, including a smile over the real issue.',
  },
  ESFP: {
    showsAs: 'on, fun, in the moment',
    misreadAs: 'shallow',
    failureMode: 'lighting up the room to skip the dip',
    coach: 'One real feeling before the next hit of stimulation',
    wants: 'To light up the room so the dip never has to be felt.',
  },
  ESTJ: {
    showsAs: 'organized closer',
    misreadAs: 'bossy',
    failureMode: 'managing people like tasks',
    coach: 'Close one item, stop policing the rest',
    wants: 'To close the list by managing people like tasks.',
  },
  ESTP: {
    showsAs: 'bold, fast, already moving',
    misreadAs: 'reckless',
    failureMode: 'doubling the bet when restless',
    coach: 'Act once, write the exit first',
    wants: 'To double the bet because standing still feels like losing.',
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
    move: 'By {deadline}, write the one-sentence test you can defend about {arena} — one value that will not move.',
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

function arenaPhrase(domain: string): string {
  const d = (domain || '').toLowerCase();
  if (/relationship|bond|love/.test(d)) return 'this bond';
  if (/home|family/.test(d)) return 'home';
  if (/work|career/.test(d)) return 'work';
  if (/money|resource/.test(d)) return 'money';
  if (/body|energy|health/.test(d)) return 'your energy';
  return 'today';
}

function fillMoveTemplate(template: string, deadline: string, arena: string): string {
  return period(
    template
      .replace(/\{deadline\}/g, deadline || '6pm')
      .replace(/\{arena\}/g, arena || 'today'),
  );
}

function oneSentenceHeadline(
  core: CoreThreatMap,
  mask: MaskSymptomMap,
  deadline: string,
  arena: string,
  nearMove?: string,
  sequence?: GuidanceSequence,
): string {
  if (nearMove) return fillMoveTemplate(nearMove, deadline, arena);
  const help = core.help.replace(/\.+$/, '');
  const coach = mask.coach.replace(/\.+$/, '');
  const helpTail = help.charAt(0).toLowerCase() + help.slice(1);
  const coachTail = coach.charAt(0).toLowerCase() + coach.slice(1);
  if (sequence === 'insight-then-step' || sequence === 'why-then-how' || sequence === 'feel-then-strategy') {
    return `By ${deadline}, ${helpTail} — ${arena}.`;
  }
  if (sequence === 'feel-then-test') {
    return `By ${deadline}, ${coachTail} about ${arena}.`;
  }
  return `By ${deadline}, ${coachTail} — ${arena}.`;
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

const CORE_WEEK: Record<MbtiType, { title: string; strength: string; blindSpot: string }> = {
  INFJ: { title: 'The Pattern Witness', strength: 'Seeing the split before anyone names it.', blindSpot: 'Carrying the room’s chaos and calling it purpose.' },
  INFP: { title: 'The Quiet Knower', strength: 'Loyalty to the inner vote.', blindSpot: 'Mistaking silence for peace.' },
  INTJ: { title: 'The Architect', strength: 'Long-range control.', blindSpot: 'Isolating to perfect a plan while the window closes.' },
  INTP: { title: 'The Tester', strength: 'Keeping questions honest.', blindSpot: 'Turning the whole day into a theory.' },
  ENFJ: { title: 'The Steward', strength: 'Growing the room.', blindSpot: 'Rescuing everyone.' },
  ENFP: { title: 'The Spark', strength: 'Keeping a door open.', blindSpot: 'Starting three plots and finishing none.' },
  ENTJ: { title: 'The Closer', strength: 'Moving the scoreboard.', blindSpot: 'Forcing pace on people.' },
  ENTP: { title: 'The Pivot', strength: 'Courage to test.', blindSpot: 'Winning the riff and losing the decision.' },
  ISFJ: { title: 'The Keeper', strength: 'Protecting the bond.', blindSpot: 'Silent overload.' },
  ISFP: { title: 'The Sensor', strength: 'Truth in the body.', blindSpot: 'Disappearing instead of disagreeing.' },
  ISTJ: { title: 'The Standard', strength: 'Keeping what works.', blindSpot: 'Enforcing yesterday on today’s mess.' },
  ISTP: { title: 'The Fixer', strength: 'A problem you can touch.', blindSpot: 'Solving the object and skipping the person.' },
  ESFJ: { title: 'The Host', strength: 'Holding the glue.', blindSpot: 'Harmony at the cost of honesty.' },
  ESFP: { title: 'The Live Wire', strength: 'Aliveness in the room.', blindSpot: 'Lighting up the room to skip the dip.' },
  ESTJ: { title: 'The Closer of Lists', strength: 'Things staying done.', blindSpot: 'Managing people like tasks.' },
  ESTP: { title: 'The Experimenter', strength: 'Courage to move.', blindSpot: 'Mistaking movement for progress.' },
};

function tensionLineFor(
  sequence: GuidanceSequence,
  nearTension: string | null,
  domain: string,
): string {
  if (sequence === 'feel-then-test') {
    return `Waiting for certainty on ${domain} raises the stress.`;
  }
  if (sequence === 'insight-then-step') {
    return `Seeing the pattern without one bounded act turns ${domain} into a burden.`;
  }
  if (nearTension) return `${nearTension} is the gap this weather widens in ${domain}.`;
  return `The inner read and the outer coping move disagree on ${domain}.`;
}

function resolutionFor(sequence: GuidanceSequence, deadline: string, core: CoreThreatMap): string {
  if (sequence === 'feel-then-test') {
    return `Run one small test by ${deadline}, not a verdict.`;
  }
  if (sequence === 'insight-then-step') {
    return `Name the pattern, then one bounded act by ${deadline}.`;
  }
  return `${period(core.help).replace(/\.$/, '')} by ${deadline}.`;
}

function whyThisPersonLine(
  coreType: MbtiType,
  maskType: MbtiType,
  core: CoreThreatMap,
  domain: string,
): string {
  if (coreType === maskType) {
    return `Today's pressure on ${domain} hits ${core.threatened}.`;
  }
  if (coreType === 'INFP' && maskType[2] === 'T') {
    const noun = /relationship/.test(domain) ? 'bond' : domain;
    return `Your INFP core often knows the ${noun} has shifted before your ${maskType} mask will admit it. Today's pressure on ${domain} widens that gap.`;
  }
  if (coreType === 'INFJ' && maskType[2] === 'T') {
    return `Your INFJ core already sees the pattern in ${domain}; your ${maskType} mask still wants a model that survives debate. Today's pressure on ${domain} widens that gap.`;
  }
  return `Your ${coreType} core notices ${core.notices} Your ${maskType} mask is still collecting a coping move. Today's pressure on ${domain} widens that gap.`;
}

function behaviorTellFor(coreType: MbtiType, maskType: MbtiType, domain: string): string {
  const bond = /relationship|home|love|bond/.test(domain);
  if (coreType === 'INFP' && maskType === 'INTP' && bond) {
    return 'You may rewrite a text three times because the emotional version and the logical version disagree.';
  }
  if (coreType === 'INFJ' && maskType === 'INTP' && bond) {
    return 'You may explain the feeling as a theory so you never have to ask for anything.';
  }
  if (maskType === 'INTP') {
    return 'You may turn the feeling into a briefing before you let it count.';
  }
  if (coreType === 'ESTP') {
    return 'You may pick a fight or a bet just to feel motion.';
  }
  return `Watch for ${MASK_SYMPTOM[maskType].failureMode} around ${domain}.`;
}

export interface ComposeDualLayerInput {
  coreType?: string | null;
  maskType?: string | null;
  deadline?: string | null;
  transitAxis?: string | null;
  domain?: string | null;
}

/**
 * Weather-card formula. Personality first, transit as activator.
 * Type letters may appear in whyThisPerson so INFP/INTP is not interchangeable with INFJ/INTP.
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

  const domain = (input.domain || 'the day').trim();
  const arena = arenaPhrase(domain);
  const move = oneSentenceHeadline(core, mask, deadline, arena, moveOverride, sequence);

  const why = sootheWhy({
    core,
    mask,
    transitAxis: input.transitAxis,
    whyNot,
  });
  const tensionLine = tensionLineFor(sequence, tension, domain);
  const resolution = resolutionFor(sequence, deadline, core);
  const whyThisPerson = whyThisPersonLine(coreType, maskType, core, domain);
  const behaviorTell = behaviorTellFor(coreType, maskType, domain);
  const weeklyCharacter = CORE_WEEK[coreType];

  return {
    threatened: core.threatened,
    showsAs: mask.showsAs,
    move: stripMbtiLabels(move.replace(/\s+/g, ' ').trim()),
    why: stripMbtiLabels(why.replace(/\s+/g, ' ').trim()),
    watchFor: stripMbtiLabels(period(watchFor)),
    avoid: stripMbtiLabels(period(avoid)),
    tension,
    source,
    coreNotices: core.notices,
    maskWants: mask.wants,
    tensionLine,
    resolution,
    whyThisPerson,
    behaviorTell,
    weeklyCharacter,
  };
}
