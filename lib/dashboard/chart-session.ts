/**
 * Chart session storage is per signed-in user.
 * A shared merlin_chart_data key made every browser look like the last natal chart.
 */

const LEGACY_CHART_KEY = 'merlin_chart_data';
const LEGACY_BIRTH_KEY = 'merlin_birth_data';

export function chartSessionKeys(userId: string): { chart: string; birth: string } {
  return {
    chart: `${LEGACY_CHART_KEY}:${userId}`,
    birth: `${LEGACY_BIRTH_KEY}:${userId}`,
  };
}

export function natalFingerprint(input: {
  date?: string | null;
  time?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  jd?: number | null;
}): string {
  if (input.date) {
    return [
      input.date,
      input.time || '',
      typeof input.latitude === 'number' ? input.latitude.toFixed(3) : '',
      typeof input.longitude === 'number' ? input.longitude.toFixed(3) : '',
    ].join('|');
  }
  if (typeof input.jd === 'number' && Number.isFinite(input.jd)) {
    return `jd:${input.jd}`;
  }
  return '';
}

export function readChartSession(userId: string): { chartRaw: string | null; birthRaw: string | null } {
  if (typeof window === 'undefined' || !userId) {
    return { chartRaw: null, birthRaw: null };
  }
  const keys = chartSessionKeys(userId);
  let chartRaw = window.localStorage.getItem(keys.chart);
  let birthRaw = window.localStorage.getItem(keys.birth);

  if (!chartRaw || !birthRaw) {
    const legacyChart = window.localStorage.getItem(LEGACY_CHART_KEY);
    const legacyBirth = window.localStorage.getItem(LEGACY_BIRTH_KEY);
    if (legacyChart && legacyBirth) {
      window.localStorage.setItem(keys.chart, legacyChart);
      window.localStorage.setItem(keys.birth, legacyBirth);
      window.localStorage.removeItem(LEGACY_CHART_KEY);
      window.localStorage.removeItem(LEGACY_BIRTH_KEY);
      chartRaw = legacyChart;
      birthRaw = legacyBirth;
    }
  }

  return { chartRaw, birthRaw };
}

export function writeChartSession(userId: string, chartJson: string, birthJson: string): void {
  if (typeof window === 'undefined' || !userId) return;
  const keys = chartSessionKeys(userId);
  window.localStorage.setItem(keys.chart, chartJson);
  window.localStorage.setItem(keys.birth, birthJson);
}

export function clearChartSession(userId?: string | null): void {
  if (typeof window === 'undefined') return;
  if (userId) {
    const keys = chartSessionKeys(userId);
    window.localStorage.removeItem(keys.chart);
    window.localStorage.removeItem(keys.birth);
  }
  window.localStorage.removeItem(LEGACY_CHART_KEY);
  window.localStorage.removeItem(LEGACY_BIRTH_KEY);
}
