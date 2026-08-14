/**
 * Personality is a lens on the same weather — not a second forecast.
 * Structure / intuition / action / harmony only change how navigation is framed.
 */

export type PersonalityFrame = 'structure' | 'intuition' | 'action' | 'harmony';

export function personalityFrame(mbtiType?: string | null): PersonalityFrame {
  const t = (mbtiType || '').toUpperCase();
  if (!/^[IE][NS][TF][JP]$/.test(t)) return 'harmony';
  const thinking = t[2] === 'T';
  const judging = t[3] === 'J';
  const intuitive = t[1] === 'N';
  const feeling = t[2] === 'F';

  if (thinking && judging) return 'structure';
  if (intuitive && feeling) return 'intuition';
  if (thinking) return 'action';
  return 'harmony';
}

const CLOSERS: Record<PersonalityFrame, Record<'friction' | 'opening' | 'mixed', string>> = {
  structure: {
    friction: 'Name the criterion first, then the next inch.',
    opening: 'Put the opening on the calendar before it evaporates.',
    mixed: 'Write both weathers in one line so you can choose later.',
  },
  intuition: {
    friction: 'Trust the body-level no before you argue yourself into yes.',
    opening: 'Follow the pull, then name it in one sentence so it stays real.',
    mixed: 'Hold both as weather — not as a verdict.',
  },
  action: {
    friction: 'Move the body or the task for ten minutes, then reassess.',
    opening: 'Start while the energy is here. Stop at one win.',
    mixed: 'Do the smaller physical next step. Leave the debate.',
  },
  harmony: {
    friction: 'Keep one other person in the loop without handing them the decision.',
    opening: 'Invite one person into the useful next step.',
    mixed: 'Say the mixed weather out loud so no one has to guess.',
  },
};

export function personalityCloser(
  frame: PersonalityFrame,
  polarity: 'friction' | 'opening' | 'mixed',
): string {
  return CLOSERS[frame][polarity];
}
