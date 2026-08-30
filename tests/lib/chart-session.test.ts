import {
  chartSessionKeys,
  clearChartSession,
  natalFingerprint,
  readChartSession,
  writeChartSession,
} from '@/lib/dashboard/chart-session';

describe('chart session storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('does not let a second user inherit the previous natal chart', () => {
    writeChartSession('user-a', '{"jd":1}', '{"date":"1983-08-14"}');
    writeChartSession('user-b', '{"jd":2}', '{"date":"2005-01-20"}');

    expect(JSON.parse(readChartSession('user-a').birthRaw || '{}').date).toBe('1983-08-14');
    expect(JSON.parse(readChartSession('user-b').birthRaw || '{}').date).toBe('2005-01-20');
    expect(chartSessionKeys('user-a').chart).not.toBe(chartSessionKeys('user-b').chart);
  });

  it('migrates a legacy shared key once, then removes it so the next user is empty', () => {
    window.localStorage.setItem('merlin_chart_data', '{"jd":9}');
    window.localStorage.setItem('merlin_birth_data', '{"date":"1983-08-14"}');

    const first = readChartSession('user-a');
    expect(JSON.parse(first.birthRaw || '{}').date).toBe('1983-08-14');
    expect(window.localStorage.getItem('merlin_chart_data')).toBeNull();

    const second = readChartSession('user-b');
    expect(second.chartRaw).toBeNull();
    expect(second.birthRaw).toBeNull();
  });

  it('fingerprints natal identity from birth data', () => {
    expect(
      natalFingerprint({ date: '2005-01-20', time: '12:00', latitude: 36.6776, longitude: -76.9225 }),
    ).not.toBe(
      natalFingerprint({ date: '1983-08-14', time: '16:21', latitude: 36.8468, longitude: -76.2855 }),
    );
    clearChartSession('user-a');
    expect(readChartSession('user-a').chartRaw).toBeNull();
  });
});
