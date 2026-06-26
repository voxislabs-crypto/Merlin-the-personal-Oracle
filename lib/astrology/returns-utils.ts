export function normalizeAngle(longitude: number): number {
  return ((longitude % 360) + 360) % 360;
}

export function angleSeparation(left: number, right: number): number {
  const diff = Math.abs(normalizeAngle(left) - normalizeAngle(right));
  return diff > 180 ? 360 - diff : diff;
}

export type BodyLongitudeResolver = (date: string, time: string) => number | null;

export function formatDateYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function daysBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

export function findReturnMomentInWindow(options: {
  natalLongitude: number;
  startDate: Date;
  endDate: Date;
  time: string;
  resolveLongitude: BodyLongitudeResolver;
  stepHours?: number;
}): { date: string; time: string; orb: number } | null {
  const { natalLongitude, startDate, endDate, time, resolveLongitude, stepHours = 24 } = options;
  let best: { date: string; time: string; orb: number } | null = null;

  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    const date = formatDateYmd(cursor);
    const [hours, minutes] = time.split(':').map(Number);
    const hourSteps = stepHours < 24 ? Math.floor(24 / stepHours) : 1;

    for (let step = 0; step < hourSteps; step += 1) {
      const hour = stepHours < 24 ? (hours + step * stepHours) % 24 : hours;
      const minute = step === 0 ? minutes || 0 : 0;
      const timeLabel = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      const longitude = resolveLongitude(date, timeLabel);
      if (longitude === null) continue;

      const orb = angleSeparation(longitude, natalLongitude);
      if (!best || orb < best.orb) {
        best = { date, time: timeLabel, orb: Math.round(orb * 1000) / 1000 };
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return best;
}