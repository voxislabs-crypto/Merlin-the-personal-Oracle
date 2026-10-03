import { composeWeeklyCharacter, isoWeekNumber } from '@/lib/atmosphere/weekly-character';

const patternWitness = {
  title: 'The Pattern Witness',
  strength: 'Seeing the split before anyone names it.',
  blindSpot: 'Carrying the room’s chaos and calling it purpose.',
};

describe('composeWeeklyCharacter', () => {
  it('keeps the core name and changes the headline on the next week', () => {
    const thisWeek = composeWeeklyCharacter({ base: patternWitness, weekOf: '2026-10-03' });
    const lastWeek = composeWeeklyCharacter({ base: patternWitness, weekOf: '2026-09-26' });
    expect(thisWeek?.coreTitle).toBe('The Pattern Witness');
    expect(lastWeek?.coreTitle).toBe('The Pattern Witness');
    expect(thisWeek?.title).toBeTruthy();
    expect(thisWeek?.title).not.toBe(lastWeek?.title);
    expect(thisWeek?.title).not.toBe('The Pattern Witness');
  });

  it('stays the same title through the same ISO week', () => {
    expect(isoWeekNumber('2026-10-03')).toBe(isoWeekNumber('2026-10-04'));
    const saturday = composeWeeklyCharacter({ base: patternWitness, weekOf: '2026-10-03' });
    const sunday = composeWeeklyCharacter({ base: patternWitness, weekOf: '2026-10-04' });
    expect(saturday?.title).toBe(sunday?.title);
  });

  it('folds the week’s loudest Moon into the strength line without retitling', () => {
    const plain = composeWeeklyCharacter({ base: patternWitness, weekOf: '2026-10-03' });
    const mooned = composeWeeklyCharacter({
      base: patternWitness,
      weekOf: '2026-10-03',
      whispers: [
        { whisper: 'The Moon in Gemini sparks curiosity.' },
        { whisper: 'Chatty Gemini Moon makes connections easy.' },
      ],
    });
    expect(mooned?.title).toBe(plain?.title);
    expect(mooned?.strength).toMatch(/Gemini/);
    expect(mooned?.strength).toMatch(/Seeing the split/);
  });
});
