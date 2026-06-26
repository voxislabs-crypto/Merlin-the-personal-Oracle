/**
 * Deferred adapter contracts for Phase 7+ reality-check inputs.
 * Implementations ship when opt-in UX and device permissions are defined.
 */

export type BiometricsSource = 'oura' | 'apple_health' | 'whoop' | 'manual';

export interface BiometricsSnapshot {
  source: BiometricsSource;
  capturedAt: string;
  sleepHours?: number;
  sleepScore?: number;
  hrvMs?: number;
  restingHeartRate?: number;
  readinessScore?: number;
}

export interface BiometricsAdapter {
  id: BiometricsSource;
  isAvailable(): Promise<boolean>;
  fetchLatestSnapshot(userId: string): Promise<BiometricsSnapshot | null>;
}

export interface CalendarDensitySnapshot {
  capturedAt: string;
  meetingCount?: number;
  focusBlockMinutes?: number;
  afterHoursEvents?: number;
  densityScore?: number;
}

export interface CalendarDensityAdapter {
  id: 'google_calendar' | 'outlook' | 'manual';
  isAvailable(): Promise<boolean>;
  fetchTodayDensity(userId: string): Promise<CalendarDensitySnapshot | null>;
}

export interface ExternalRealityInputs {
  biometrics?: BiometricsSnapshot | null;
  calendar?: CalendarDensitySnapshot | null;
}