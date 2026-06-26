import { getSummaryOpening, realignSummaryToDayRating } from '@/lib/astrology/ephemeris';

describe('forecast summary day-rating alignment', () => {
  it('uses supportive opening for green days', () => {
    const opening = getSummaryOpening('green', 'Leo');
    expect(opening).toContain('Supportive sky signals');
    expect(opening).not.toMatch(/beautifully aligned|forward momentum/i);
  });

  it('uses cautious opening for red days', () => {
    const opening = getSummaryOpening('red', 'Leo');
    expect(opening).toContain('Heavier transits');
    expect(opening).not.toMatch(/beautifully aligned|forward momentum|steady and balanced/i);
  });

  it('uses mixed opening for yellow days', () => {
    const opening = getSummaryOpening('yellow', 'Leo');
    expect(opening).toContain('Mixed cosmic signals');
  });

  it('realigns a positive ephemeris opening when enriched rating is red', () => {
    const original =
      'The stars are beautifully aligned for you today, Leo. Your drive and initiative are strong. The Full Moon in Scorpio illuminates what needs completion or release.';
    const realigned = realignSummaryToDayRating(original, 'red', 'Leo');
    expect(realigned.startsWith('Heavier transits are louder today, Leo')).toBe(true);
    expect(realigned).toContain('Your drive and initiative are strong');
    expect(realigned).not.toContain('beautifully aligned');
  });
});