import {
  DEFAULT_MODULE_PREFERENCES,
  parseDashboardModulePreferences,
} from '../../../lib/dashboard/module-preferences';

describe('dashboard module preferences', () => {
  it('returns defaults when storage is empty', () => {
    expect(parseDashboardModulePreferences(null)).toEqual(DEFAULT_MODULE_PREFERENCES);
  });

  it('merges partial saved preferences with defaults', () => {
    const parsed = parseDashboardModulePreferences(JSON.stringify({ history: true, deepDive: false }));
    expect(parsed.history).toBe(true);
    expect(parsed.deepDive).toBe(false);
    expect(parsed.returnLoop).toBe(true);
  });

  it('falls back to defaults for malformed JSON', () => {
    expect(parseDashboardModulePreferences('{bad json')).toEqual(DEFAULT_MODULE_PREFERENCES);
  });
});