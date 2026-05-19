export const BLOCKED_PHRASE_PATTERNS: RegExp[] = [
  /\bthis will happen\b/i,
  /\byou are definitely entering\b/i,
  /\bsomeone is plotting against you\b/i,
  /\byou cannot avoid\b/i,
  /\ba betrayal is imminent\b/i,
  /\byou are under attack\b/i,
  /\bfailure is unavoidable\b/i,
];

export const APPROVED_PATTERN_HINTS = [
  'This period may increase',
  'You might notice',
  'Potential pressure is elevated in',
  'Consider pausing before major conclusions.',
];

const SANITIZE_REPLACEMENTS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bthis will happen\b/gi, replacement: 'This may unfold' },
  { pattern: /\byou are definitely entering\b/gi, replacement: 'You may be entering' },
  { pattern: /\bsomeone is plotting against you\b/gi, replacement: 'Interpersonal tension may be present' },
  { pattern: /\byou cannot avoid\b/gi, replacement: 'This may be hard to avoid' },
  { pattern: /\ba betrayal is imminent\b/gi, replacement: 'Trust dynamics may feel uncertain' },
  { pattern: /\byou are under attack\b/gi, replacement: 'You may feel defensive under pressure' },
  { pattern: /\bfailure is unavoidable\b/gi, replacement: 'Outcomes may be challenging without adjustment' },
];

export function findBlockedPhrases(input: string): string[] {
  if (!input || typeof input !== 'string') {
    return [];
  }

  return BLOCKED_PHRASE_PATTERNS.filter((pattern) => pattern.test(input)).map(
    (pattern) => pattern.source
  );
}

export function isCopySafe(input: string): boolean {
  return findBlockedPhrases(input).length === 0;
}

export function assertCopySafeText(texts: string[]): {
  safe: boolean;
  violations: Array<{ index: number; blockedPatterns: string[] }>;
} {
  const violations = texts
    .map((text, index) => ({ index, blockedPatterns: findBlockedPhrases(text) }))
    .filter((entry) => entry.blockedPatterns.length > 0);

  return {
    safe: violations.length === 0,
    violations,
  };
}

export function sanitizeCopyText(input: string): string {
  if (!input || typeof input !== 'string') {
    return input;
  }

  return SANITIZE_REPLACEMENTS.reduce((value, rule) => value.replace(rule.pattern, rule.replacement), input);
}
