export interface AtmosphereEngineFlagOptions {
  /** Premium tier enables the engine by default (PR-5). */
  premium?: boolean;
}

/**
 * Atmosphere Engine v1 rollout:
 * - Premium users: ON by default
 * - Env `true`: force ON (dev / staged rollout)
 * - Env `false`: force OFF (emergency rollback)
 */
export function isAtmosphereEngineV1Enabled(options: AtmosphereEngineFlagOptions = {}): boolean {
  const env = process.env.NEXT_PUBLIC_MERLIN_ATMOSPHERE_ENGINE_V1;
  if (env === 'false') return false;
  if (env === 'true') return true;
  return options.premium === true;
}