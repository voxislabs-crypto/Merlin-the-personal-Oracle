/**
 * Discussion controller for Merlin chat.
 *
 * Separates a meter reading (scores and percentages are in scope) from direct
 * conversation (prose, no scale). The full oracle still answers both — this
 * only decides whether the turn may cite numbers and whether the persona
 * word cap should stand aside.
 */

/** Extra room on every Merlin chat reply ceiling (words). */
export const RESPONSE_LIMIT_BONUS = 500;

export type DiscussionRegister = 'reading' | 'discussion';

export interface DiscussionTurn {
  register: DiscussionRegister;
  /** When false, the model must not cite percents or named score figures. */
  allowPercentages: boolean;
  /** Persona word caps are too short for a real conversation. */
  loosenLength: boolean;
  minWords: number;
  maxWords: number;
  lengthNote: string;
  reason: string;
}

export interface ClassifyDiscussionInput {
  question: string;
  oracleMode?: 'auto' | 'casual' | 'detailed';
  /** Preference: show likelihood percentages on reading turns. Default true. */
  includeLikelihood?: boolean;
}

const STEP_AWAY =
  /\b(without (the )?(numbers|percent\w*|scores?|scale|stats)|no (numbers|percent\w*|scores?)|step (away|off)|off the scale|not the (score|numbers|percent)|drop the (numbers|percent\w*|scores?)|leave the (scale|numbers)|plain (talk|words)|just talk|talk to me like)\b/i;

const ELABORATE =
  /\b(elaborat\w*|go (deeper|further|on)|tell me more|say more|expand on|unpack|what do you mean|talk (this |me )?through|can you explain|could you explain|break (it|that) down)\b/i;

const SHORT_FOLLOWUP =
  /^(why|how|and|more|go on|continue|keep going|huh|what|explain|elaborate|really)\s*\??$/i;

const METER =
  /\b(frictions?|storm watch|storms?|life risk|likelihoods?|percent(?:age)?s?|forecasts?|life weather|how bad|how intense|what(?:'s| is) (?:today|this week|the (?:day|week))|scores?)\b/i;

const MECHANICS =
  /\b(transits?|aspects?|conjunct\w*|squares?|trines?|oppositions?|sextiles?|retrogrades?|natals?|birth chart|my chart|horoscopes?|ascendants?|midheavens?|\d+\s*°|\d+(?:st|nd|rd|th)?\s+house|house\s+\d+)\b/i;

const PLANET =
  /\b(sun|moon|venus|mars|mercury|jupiter|saturn|uranus|neptune|pluto)\b/i;

const PLANET_ASK =
  /\b(doing|square|trine|conjunct|oppos\w*|transiting|where is|what(?:'s| is)|in my chart)\b/i;

function asksMechanics(question: string): boolean {
  if (MECHANICS.test(question)) return true;
  return PLANET.test(question) && (PLANET_ASK.test(question) || /\bchart\b/i.test(question));
}

function lengthNote(minWords: number, maxWords: number, register: DiscussionRegister): string {
  if (register === 'discussion') {
    return `Write ${minWords}–${maxWords} words of direct conversation. Ignore the persona word cap. Do not compress this into a score card.`;
  }
  return `They asked you to go further on the reading. Write ${minWords}–${maxWords} words. Ignore the persona word cap for this turn.`;
}

function finish(
  partial: Omit<DiscussionTurn, 'allowPercentages' | 'lengthNote'> & { allowPercentages: boolean },
  includeLikelihood: boolean,
): DiscussionTurn {
  const allowPercentages = includeLikelihood && partial.allowPercentages;
  const maxWords = partial.maxWords + RESPONSE_LIMIT_BONUS;
  return {
    ...partial,
    maxWords,
    allowPercentages,
    lengthNote: lengthNote(partial.minWords, maxWords, partial.register),
  };
}

/**
 * Classify the current user turn.
 * Explicit "step off the scale" beats a detailed-mode or meter ask.
 * A bare follow-up ("why?", "go on", "elaborate") stays in conversation.
 */
export function classifyDiscussionTurn(input: ClassifyDiscussionInput): DiscussionTurn {
  const question = (input.question || '').trim();
  const oracleMode = input.oracleMode || 'auto';
  const includeLikelihood = input.includeLikelihood !== false;
  const meter = METER.test(question);
  const mechanics = asksMechanics(question);
  const stepAway = STEP_AWAY.test(question);
  const elaborate = ELABORATE.test(question) || SHORT_FOLLOWUP.test(question);

  if (!question || stepAway) {
    return finish({
      register: 'discussion',
      allowPercentages: false,
      loosenLength: true,
      minWords: 160,
      maxWords: 320,
      reason: question ? 'step-away' : 'empty',
    }, includeLikelihood);
  }

  if (elaborate && (meter || mechanics)) {
    return finish({
      register: 'reading',
      allowPercentages: true,
      loosenLength: true,
      minWords: 140,
      maxWords: 280,
      reason: 'elaborate-reading',
    }, includeLikelihood);
  }

  if (elaborate) {
    return finish({
      register: 'discussion',
      allowPercentages: false,
      loosenLength: true,
      minWords: 220,
      maxWords: 420,
      reason: 'elaborate',
    }, includeLikelihood);
  }

  if (oracleMode === 'casual' && !meter) {
    return finish({
      register: 'discussion',
      allowPercentages: false,
      loosenLength: true,
      minWords: 160,
      maxWords: 320,
      reason: 'casual',
    }, includeLikelihood);
  }

  if (meter) {
    return finish({
      register: 'reading',
      allowPercentages: true,
      loosenLength: false,
      minWords: 80,
      maxWords: 180,
      reason: 'meter',
    }, includeLikelihood);
  }

  if (mechanics) {
    return finish({
      register: 'reading',
      allowPercentages: true,
      loosenLength: false,
      minWords: 80,
      maxWords: 180,
      reason: 'mechanics',
    }, includeLikelihood);
  }

  if (oracleMode === 'detailed') {
    return finish({
      register: 'reading',
      allowPercentages: true,
      loosenLength: false,
      minWords: 80,
      maxWords: 180,
      reason: 'detailed',
    }, includeLikelihood);
  }

  return finish({
    register: 'discussion',
    allowPercentages: false,
    loosenLength: true,
    minWords: 160,
    maxWords: 320,
    reason: 'conversation',
  }, includeLikelihood);
}

/**
 * Prompt block. Place it after score-label rules so it can override them.
 * Identity deep dives keep their own length; this block must not fight that.
 */
export function formatDiscussionControllerBlock(
  turn: DiscussionTurn,
  options?: { identityDive?: boolean },
): string {
  if (options?.identityDive) {
    const numbers = turn.allowPercentages
      ? 'A percent is allowed only if they asked for a meter. Do not open with a score pair.'
      : 'No percents, Storm Watch numbers, friction scores, or confidence figures. The identity brief is the answer.';
    return `DISCUSSION CONTROLLER: identity deep dive owns shape and length.
${numbers}`;
  }

  if (turn.register === 'discussion') {
    return `DISCUSSION CONTROLLER: conversation. This turn overrides SCORE PAIR and SCORE LABELS.
- Direct conversation. Answer the person first.
- No percentages. No Storm Watch numbers. No friction scores. No likelihoods. No read-confidence or chart-confidence figures.
- Do not open on a meter. If they asked you to elaborate, explain, or step away from the scale, stay off it.
- You may use what the app can see, in lived language, when it honestly helps. One observation, not a sky inventory.
- Do not use the headline / why / move card. Talk. Vary the shape.
- ${turn.lengthNote}`;
  }

  const numbers = turn.allowPercentages
    ? 'If you cite a percent, name the meter: "Storm Watch 85 alarm, friction 71." One pair is enough. Do not stack extra confidence percents they did not ask for.'
    : 'Percentages are off. Describe the meter in words (elevated, quiet, mixed). Do not cite a number.';

  const length = turn.loosenLength
    ? turn.lengthNote
    : 'A short status check can stay brief. Do not pad it with extra meters.';

  return `DISCUSSION CONTROLLER: reading.
- A meter reading is in scope.
- ${numbers}
- ${length}`;
}
