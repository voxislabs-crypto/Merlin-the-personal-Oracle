import { composeDailyMood, readForecastMood } from '@/lib/atmosphere/daily-mood';

describe('composeDailyMood', () => {
  it('puts today\'s mood and reading in front of the lasting transit', () => {
    const mood = composeDailyMood({
      themeLabel: 'Duty and structure',
      transitReason: 'Saturn is pressing your mood',
      dailyMood: 'A sense of wholeness accompanies you today. Savour it.',
      dailySummary: 'Supportive signals outweigh friction today (Leo). Your vitality is amplified.',
      moonSign: 'Gemini',
      dayRating: 'green',
    });

    expect(mood.word).toBe('Open · Moon in Gemini');
    expect(mood.line).toMatch(/wholeness accompanies you today/);
    expect(mood.line).toMatch(/Supportive signals outweigh friction today/);
    expect(mood.line).toMatch(/Longer transit: Duty and structure/);
    expect(mood.line).not.toMatch(/Saturn/);
  });

  it('changes the word when the day rating changes and the theme does not', () => {
    const shared = {
      themeLabel: 'Duty and structure',
      transitReason: 'Saturn is pressing your mood',
      moonSign: 'Gemini',
    };
    const green = composeDailyMood({ ...shared, dayRating: 'green' });
    const red = composeDailyMood({ ...shared, dayRating: 'red' });
    expect(green.word).toMatch(/^Open/);
    expect(red.word).toMatch(/^Heavy/);
    expect(green.line).toMatch(/Longer transit: Duty and structure/);
    expect(red.line).toMatch(/Longer transit: Duty and structure/);
  });

  it('uses the theme as the word when the day has not landed', () => {
    const mood = composeDailyMood({ themeLabel: 'Clarity is thin' });
    expect(mood.word).toBe('Clarity is thin');
    expect(mood.line).toMatch(/Longer transit: Clarity is thin/);
  });

  it('reads a forecast mood string', () => {
    expect(readForecastMood({ mood: ' Feelings run deep today. ' })).toBe('Feelings run deep today.');
    expect(readForecastMood(null)).toBeNull();
    expect(readForecastMood({ love: 'warm' })).toBeNull();
  });
});
