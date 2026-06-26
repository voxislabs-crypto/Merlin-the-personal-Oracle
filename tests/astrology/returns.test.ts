import { computeAnnualProfection } from '@/lib/astrology/profections';
import { shouldShowAnnualBriefing } from '@/lib/astrology/returns-display';
import {
  angleSeparation,
  findReturnMomentInWindow,
  formatDateYmd,
} from '@/lib/astrology/returns-utils';

describe('return chart utilities', () => {
  it('finds the closest return moment in a scanning window', () => {
    const natalLongitude = 120;
    const result = findReturnMomentInWindow({
      natalLongitude,
      startDate: new Date('2026-08-10T12:00:00'),
      endDate: new Date('2026-08-16T12:00:00'),
      time: '12:00',
      resolveLongitude: (date) => {
        const day = Number(date.slice(-2));
        return (110 + day) % 360;
      },
    });

    expect(result).not.toBeNull();
    expect(result?.orb).toBeLessThanOrEqual(5);
  });

  it('measures angular separation correctly', () => {
    expect(angleSeparation(10, 350)).toBe(20);
    expect(angleSeparation(0, 180)).toBe(180);
  });

  it('shows annual briefing inside birthday window', () => {
    const visible = shouldShowAnnualBriefing({
      returnDate: '2026-08-14',
      returnTime: '12:21',
      returnYear: 2026,
      daysToReturn: 12,
      daysSinceReturn: 0,
      isBirthdayWindow: true,
      ascendantSign: 'Scorpio',
      sunSign: 'Leo',
      moonSign: 'Cancer',
      highlights: ['Solar return Sun in Leo'],
      annualTheme: 'Test theme',
      profectionTheme: computeAnnualProfection('Scorpio', 42).themeOfYear,
      chart: { positions: [], ascendant: { longitude: 0, sign: 'Scorpio', degree: 0, minute: 0 }, mc: { longitude: 0, sign: 'Leo', degree: 0, minute: 0 }, houses: [] },
    });

    expect(visible).toBe(true);
  });

  it('formats stable YMD strings', () => {
    expect(formatDateYmd(new Date('2026-06-25T15:00:00'))).toBe('2026-06-25');
  });
});