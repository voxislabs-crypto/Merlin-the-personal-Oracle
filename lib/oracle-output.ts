export type OracleTonePreset = 'warm' | 'direct' | 'mystic' | 'strategic';

const REPETITIVE_OPENERS = [
  /^you may/i,
  /^you might/i,
  /^today /i,
  /^in the next/i,
  /^right now/i,
];

function normalizeLine(line: string): string {
  return line
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?;:])/g, '$1')
    .trim();
}

function softenRepeatedOpeners(lines: string[]): string[] {
  const result: string[] = [];
  let previousMatchedOpenerIndex = -1;

  for (const line of lines) {
    const openerIndex = REPETITIVE_OPENERS.findIndex((pattern) => pattern.test(line));

    if (openerIndex !== -1 && openerIndex === previousMatchedOpenerIndex) {
      result.push(line.replace(/^\w+\s+\w+\s*/i, 'Also, '));
    } else {
      result.push(line);
    }

    previousMatchedOpenerIndex = openerIndex;
  }

  return result;
}

function softenRigidHeadings(text: string): string {
  return text
    .replace(/^Storm \+ Terrain check:/im, "Here's your storm + terrain check:")
    .replace(/^Now \(0-24h\):/im, 'Right now (0-24h):')
    .replace(/^Near Future \(24-72h\):/im, 'Coming up (24-72h):')
    .replace(/^Week Ahead \(4-7d\):/im, 'A few days out (4-7d):')
    .replace(/^Best move:/im, 'Best next move:');
}

function improveConversationalFlow(text: string): string {
  return text
    .replace(/\btherefore\b/gi, 'so')
    .replace(/\bmoreover\b/gi, 'also')
    .replace(/\bit is\b/gi, "it's")
    .replace(/\bit will\b/gi, "it'll")
    .replace(/\byou will\b/gi, "you'll")
    .replace(/\bdo not\b/gi, "don't")
    .replace(/\bcannot\b/gi, "can't");
}

export function polishOracleOutput(text: string): string {
  if (!text) return text;

  const softenedHeadings = softenRigidHeadings(text);
  const conversational = improveConversationalFlow(softenedHeadings);

  const rawLines = conversational
    .split('\n')
    .map((line) => normalizeLine(line))
    .filter((line, index, arr) => {
      if (!line) return false;
      return arr.indexOf(line) === index;
    });

  const softened = softenRepeatedOpeners(rawLines);

  return softened
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
