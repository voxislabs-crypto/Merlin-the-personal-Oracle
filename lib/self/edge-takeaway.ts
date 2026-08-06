/**
 * Memorable identity synthesis — the line people remember and share.
 * Stable baseline; optional light weather tint when intensity is provided.
 * Voice: docs/MERLIN_VOICE.md — explain *you*, not the chart.
 */

import type { DualOverlay } from '@/lib/personality/dual-overlay';
import type { BlendSynthesis } from '@/lib/personality/mbti-blend-synthesis';
import { applyMerlinVoicePass } from '@/lib/voice/merlin-voice';

export interface EdgeTakeaway {
  title: string;
  body: string;
}

function letters(type?: string | null): [string, string, string, string] | null {
  const t = (type || '').trim().toUpperCase();
  if (t.length !== 4) return null;
  return [t[0], t[1], t[2], t[3]];
}

/**
 * Build a punchy "Your edge" takeaway from dual personality (or single type).
 */
export function buildEdgeTakeaway(options: {
  coreType?: string | null;
  maskType?: string | null;
  dualOverlay?: DualOverlay | null;
  blend?: BlendSynthesis | null;
  /** Optional weather intensity 0–100 — softens the last beat, does not rewrite identity */
  weatherIntensity?: number | null;
}): EdgeTakeaway | null {
  const core =
    options.coreType ||
    options.dualOverlay?.firmware?.mbtiType ||
    options.maskType ||
    options.dualOverlay?.hardware?.mbtiType;
  const mask =
    options.maskType ||
    options.dualOverlay?.hardware?.mbtiType ||
    core;

  const c = letters(core);
  if (!c) return null;
  const m = letters(mask) || c;
  const same = c.join('') === m.join('');

  let body: string;

  if (!same && c[2] !== m[2]) {
    // T/F split — classic "empathy vs proof" edge
    if (c[2] === 'F' && m[2] === 'T') {
      body =
        "Your empathy is your compass, but your analytical face wants proof before acting. Don't let over-analysis delay conversations that already feel emotionally clear.";
    } else if (c[2] === 'T' && m[2] === 'F') {
      body =
        "Your core wants clean logic; the room often meets your warmer filter first. Lead with the real analysis — then translate so people can hear it.";
    } else {
      body =
        options.blend?.summary ||
        `Core ${c.join('')} and mask ${m.join('')} pull on different decision wires — name which layer is driving before you commit.`;
    }
  } else if (!same && c[0] !== m[0]) {
    if (c[0] === 'I' && m[0] === 'E') {
      body =
        "You can look open and available while your real fuel is solitude. Schedule recovery like a meeting — or the mask will bill you interest.";
    } else {
      body =
        "You look more private than you actually are. When energy is high, speak sooner than feels polite — waiting costs you more than a blunt sentence.";
    }
  } else if (!same && c[3] !== m[3]) {
    if (c[3] === 'P' && m[3] === 'J') {
      body =
        "You present as decided while your inside still wants options. Leave one reversible exit in every plan so the mask doesn't paint you into a corner.";
    } else {
      body =
        "You look flexible while your core already wants closure. If the decision is clear, stop collecting opinions — ship the call.";
    }
  } else if (!same && c[1] !== m[1]) {
    if (c[1] === 'N' && m[1] === 'S') {
      body =
        "Inside you track patterns; outside you may sound concrete. Name the pattern early so people don't mistake vision for vagueness.";
    } else {
      body =
        "You ground in facts while the room may cast you as the idea person. Bring one hard example — it earns the abstract point.";
    }
  } else if (!same) {
    body =
      options.blend?.combinedInterpretation?.slice(0, 280) ||
      `Core ${c.join('')} runs the self you feel; mask ${m.join('')} is what the room often gets. When they disagree, trust the core for meaning and the mask for strategy.`;
    if (body.length > 280) body = `${body.slice(0, 277).trim()}…`;
  } else {
    // Aligned type — still give a memorable edge
    const type = c.join('');
    if (c[2] === 'F' && c[0] === 'I') {
      body = `${type} edge: you read the room deeply before you speak. Your gift is precision of care — just don't wait so long that the moment passes.`;
    } else if (c[2] === 'T' && c[1] === 'N') {
      body = `${type} edge: you see the system under the noise. Your gift is clean models — just remember people need a human on-ramp, not only the diagram.`;
    } else if (c[0] === 'E' && c[3] === 'P') {
      body = `${type} edge: you spark motion and keep options alive. Your gift is energy — park one finish line so the spark becomes a result.`;
    } else if (c[3] === 'J') {
      body = `${type} edge: you create order others can trust. Your gift is follow-through — leave 10% slack so life doesn't feel like a failed plan.`;
    } else {
      body = `${type} edge: what people see matches what drives you. Lean into that coherence — and notice when comfort becomes autopilot.`;
    }
  }

  // Soft weather tint — never overwrites identity
  const intensity = options.weatherIntensity;
  if (typeof intensity === 'number' && Number.isFinite(intensity)) {
    if (intensity >= 70) {
      body = `${body} With pressure elevated, shrink the ask: one clear move beats a perfect theory.`;
    } else if (intensity < 40) {
      body = `${body} With calmer weather, this is a good day to act on what you already know.`;
    }
  }

  return {
    title: 'Your edge',
    body: applyMerlinVoicePass(body.replace(/\s+/g, ' ').trim()),
  };
}
