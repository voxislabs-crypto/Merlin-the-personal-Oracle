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

export function polishOracleOutput(text: string): string {
  if (!text) return text;

  const rawLines = text
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
