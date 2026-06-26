export type DashboardModuleKey =
  | 'relationshipSpace'
  | 'returnLoop'
  | 'deepDive'
  | 'weeklyForecast'
  | 'personalityCards'
  | 'focusViews'
  | 'history';

export type DashboardModulePreferences = Record<DashboardModuleKey, boolean>;

export const DASHBOARD_MODULES_STORAGE_KEY = 'merlin_dashboard_modules_v1';

export const DEFAULT_MODULE_PREFERENCES: DashboardModulePreferences = {
  relationshipSpace: true,
  returnLoop: true,
  deepDive: true,
  weeklyForecast: true,
  personalityCards: true,
  focusViews: true,
  history: false,
};

const MODULE_KEYS: DashboardModuleKey[] = [
  'relationshipSpace',
  'returnLoop',
  'deepDive',
  'weeklyForecast',
  'personalityCards',
  'focusViews',
  'history',
];

export function parseDashboardModulePreferences(raw: string | null): DashboardModulePreferences {
  if (!raw) return { ...DEFAULT_MODULE_PREFERENCES };

  try {
    const parsed = JSON.parse(raw) as Partial<DashboardModulePreferences>;
    return MODULE_KEYS.reduce((acc, key) => {
      acc[key] = typeof parsed[key] === 'boolean' ? parsed[key]! : DEFAULT_MODULE_PREFERENCES[key];
      return acc;
    }, {} as DashboardModulePreferences);
  } catch {
    return { ...DEFAULT_MODULE_PREFERENCES };
  }
}

export const MODULE_LABELS: Record<DashboardModuleKey, string> = {
  relationshipSpace: 'Relationship Space',
  returnLoop: 'Daily Ritual',
  deepDive: 'Deep Dive',
  weeklyForecast: 'Weekly Forecast',
  personalityCards: 'Dual MBTI Cards',
  focusViews: 'Focus Views',
  history: 'History & Calibration',
};