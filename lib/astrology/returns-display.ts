import type { SolarReturnBriefing } from '@/lib/astrology/returns-types';

export function shouldShowAnnualBriefing(briefing: SolarReturnBriefing): boolean {
  return briefing.isBirthdayWindow || briefing.daysToReturn <= 45;
}