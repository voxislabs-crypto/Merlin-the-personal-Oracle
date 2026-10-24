/**
 * Sentence shape for the Today brief.
 * Core style lands on meaning. Mask style lands on action when the types differ.
 * One sentence gets one style. The map still supplies the move and the threat.
 * Starter set: INFP, INFJ, INTP, INTJ.
 */

import { parseMbtiType, type MbtiType } from '@/lib/self/dual-layer-maps';

const STYLED: ReadonlySet<MbtiType> = new Set(['INFP', 'INFJ', 'INTP', 'INTJ']);

const SHAPED_START = /^(Priority:|First:|So far\b|This lands close:|What hurts first:|This can stay gentle:)/;

export function corePolishStyleNote(coreType?: string | null): string | null {
  switch (parseMbtiType(coreType)) {
    case 'INTJ':
      return 'Style for this Core: prefer numbered steps and explicit priorities.';
    case 'INFJ':
      return 'Style for this Core: prefer one explicit priority and a closed next step, in warmer concrete language.';
    case 'INTP':
      return 'Style for this Core: prefer a precise, qualified claim with an open ending.';
    case 'INFP':
      return 'Style for this Core: prefer flowing, open-ended phrasing.';
    default:
      return null;
  }
}

/**
 * One system-prompt addendum. Meaning follows Core. A differing styled Mask
 * shapes only the action sentence. No second model call.
 */
export function appendBriefStyleNote(
  systemPrompt: string,
  coreType?: string | null,
  maskType?: string | null,
): string {
  const core = parseMbtiType(coreType);
  const mask = parseMbtiType(maskType);
  const lines = [systemPrompt];
  const coreNote = corePolishStyleNote(core);
  if (coreNote) {
    lines.push(`- ${coreNote} Use it on meaning sentences.`);
  }
  if (mask && mask !== core) {
    const maskNote = corePolishStyleNote(mask);
    if (maskNote) {
      lines.push(
        `- ${maskNote.replace('Style for this Core:', 'Style for the action sentence:')} Do not mix both styles in one sentence.`,
      );
    }
  }
  return lines.join('\n');
}

/** Mask style when it differs and we have one; otherwise the Core, if styled. */
export function actionStyleType(coreType?: string | null, maskType?: string | null): MbtiType | null {
  const core = parseMbtiType(coreType);
  const mask = parseMbtiType(maskType);
  if (mask && core && mask !== core) return STYLED.has(mask) ? mask : null;
  const self = core || mask;
  return self && STYLED.has(self) ? self : null;
}

function prepareBody(sentence: string, openEnding: boolean): string {
  let body = sentence.replace(/\s+/g, ' ').trim();
  if (openEnding) {
    body = body.replace(/\.?\s*Stop there\.?$/i, '').trim();
    body = body.replace(/,?\s*then stop\.?$/i, '').trim();
  }
  body = body.replace(/\.+$/, '').trim().replace(/^to\s+/i, '');
  if (!body) return body;
  return body.charAt(0).toLowerCase() + body.slice(1);
}

/** Apply one type's shape. Leaves unstyled types and already-shaped lines alone. */
export function shapeActionSentence(
  coreType: string | null | undefined,
  maskType: string | null | undefined,
  sentence: string,
): string {
  const type = actionStyleType(coreType, maskType);
  const raw = (sentence || '').replace(/\s+/g, ' ').trim();
  if (!type || !raw || SHAPED_START.test(raw)) return raw;
  const open = type[3] === 'P';
  const body = prepareBody(raw, open);
  if (!body) return raw;
  const judging = type[3] === 'J';
  const thinking = type[2] === 'T';
  if (judging && thinking) return `Priority: ${body}.`;
  if (judging) return `First: ${body}.`;
  if (thinking) return `So far, ${body} — leave the rest open.`;
  return `This can stay gentle: ${body}, so the rest can stay unnamed.`;
}
