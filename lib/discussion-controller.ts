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

const CARD_LABEL = /^\s*(headline|why|move)\s*:/im;
const SCORE_CITE = /\b(?:storm watch\s+\d+|friction\s+\d+)\b/i;

/** True when a reply is the dashboard card, or cites meters on a conversation turn. */
export function replyBreaksConversation(text: string, allowScores: boolean): boolean {
  const raw = text || '';
  if (CARD_LABEL.test(raw)) return true;
  if (!allowScores && SCORE_CITE.test(raw)) return true;
  return false;
}

/**
 * Prior assistant cards teach the next reply to copy them.
 * Drop the card. Keep an ordinary answer.
 */
export function scrubPriorAssistantReply(text: string): string {
  if (!replyBreaksConversation(text, false)) return text;
  return 'Ignore the previous weather-card reply. Do not repeat its Headline / Why / Move shape, its scores, its timer, or a write-it-down task.';
}

/** They asked Merlin to draft or capture, not merely mentioned the word. */
const ASKED_TO_CAPTURE =
  /\b(help me (?:write|draft|journal)|draft (?:a|an|the|this)\b|write (?:this|it|that) (?:down|out|up)|start a journal|in my notebook|take notes on)\b/i;

/** A stock ending: private note, journal, "done" log, or "write it down." */
const CAPTURE_DEFAULT =
  /\b(?:write (?:a|an|the|it|this|that|one|down)\b|jot\b|private note|private notebook|\bin a notebook\b|journal\b|log\s+[“"']?done|done[”"']?\s+note)\b/i;

export function questionAskedToCapture(question: string | null | undefined): boolean {
  return ASKED_TO_CAPTURE.test(question || '');
}

/** True when the reply leans on writing something down as the resolution. */
export function replyDefaultsToCapture(text: string | null | undefined): boolean {
  return CAPTURE_DEFAULT.test(text || '');
}

/** Rewrite instruction when a reply is a weather card or a stock writing task. */
export function formatRejectedReplyRewrite(question: string, reasons: string[]): string {
  const why = reasons.filter(Boolean).join(' ');
  return `Rejected. ${why} The person asked: ${question}

Rewrite as several paragraphs about that question. No line may be Headline, Why, or Move. No Storm Watch number. No friction number. No percent.
Do not recycle a timer, a private note, a journal line, or a "write it down" task unless they asked to draft or capture something.
If they refused a step because it would imply agreement, do not assign that step again in any form. Keep their stance. Offer a different kind of move: say the difference once, decline, wait, ask one question, or make no public move.`;
}

/** Last resort when a rewrite still comes back as a card. */
export function stripWeatherCardShape(text: string): string {
  return (text || '')
    .replace(/^\s*(headline|why|move)\s*:\s*/gim, '')
    .replace(/[^.!?\n]*\b(?:storm watch\s+\d+|friction\s+\d+(?:\s*\/\s*100)?)\b[^.!?\n]*[.!?]?/gi, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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
    return `DISCUSSION CONTROLLER: conversation. This turn overrides SCORE PAIR, SCORE LABELS, and the dashboard card.
- Answer the question they actually asked. A decision gets both sides and a recommendation. A life commitment gets a way to live it, not today's weather recap.
- No percentages. No Storm Watch numbers. No friction scores. No likelihoods. No read-confidence or chart-confidence figures. The numbers were withheld from this prompt on purpose.
- Weather may appear as one plain sentence, and only if it changes the advice.
- Write prose paragraphs. Never print a line that is Headline, Why, or Move. A three-part card is a failed answer.
- Do not paste a canned "one move" from the engine. The reply has to belong to this question.
- Do not resolve the turn by telling them to write it down, keep a private note, or set a timer unless they asked to draft or capture something.
- If they reject a move because it would look like agreement, do not repackage that move as a private note. Answer the objection and leave their stance intact.
- At least four paragraphs. Under 150 words is too tight.
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
- Write prose paragraphs. Never print a line that is Headline, Why, or Move. A three-part card is a failed answer even on a reading.
- ${length}`;
}
