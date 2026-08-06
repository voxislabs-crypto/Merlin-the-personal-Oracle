import 'server-only';
import fs from 'fs';
import path from 'path';

/** Swiss Ephemeris native binding shape (subset we call). */
export type SwephCalcResult = {
  flag: number;
  data: number[];
  error?: string;
};

export type SwephModule = {
  set_ephe_path?: (ephePath: string) => void;
  constants: Record<string, number>;
  calc_ut: (jd: number, body: number, flags: number) => SwephCalcResult;
  utc_to_jd: (
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number,
    gregflag: number,
  ) => SwephCalcResult;
  houses_ex?: (
    jd: number,
    flags: number,
    lat: number,
    lon: number,
    hsys: string,
  ) => unknown;
};

let swephModule: SwephModule | null | undefined;
let ephePathConfigured = false;

function resolveEphePath(): string {
  const fromEnv = process.env.SWEPH_PATH || process.env.MERLIN_EPHE_PATH;
  if (fromEnv?.trim()) {
    return path.resolve(fromEnv.trim());
  }
  return path.join(process.cwd(), 'ephe');
}

function epheFilesPresent(ephePath: string): boolean {
  try {
    return fs.existsSync(ephePath) && fs.readdirSync(ephePath).some((file) => file.endsWith('.se1'));
  } catch {
    return false;
  }
}

function configureEphePath(sweph: SwephModule): void {
  if (ephePathConfigured) return;

  const ephePath = resolveEphePath();
  if (typeof sweph.set_ephe_path === 'function') {
    sweph.set_ephe_path(ephePath);
    ephePathConfigured = true;

    if (epheFilesPresent(ephePath)) {
      console.log(`[sweph] Ephemeris files loaded from ${ephePath}`);
    } else {
      console.warn(
        `[sweph] Ephemeris path set to ${ephePath} but no .se1 files found — calculations will use Moshier fallback`,
      );
    }
  }
}

function isUsableSweph(value: unknown): value is SwephModule {
  if (!value || typeof value !== 'object') return false;
  const mod = value as Partial<SwephModule>;
  return (
    typeof mod.calc_ut === 'function' &&
    typeof mod.utc_to_jd === 'function' &&
    !!mod.constants &&
    typeof mod.constants === 'object'
  );
}

export function getSwephPath(): string {
  return resolveEphePath();
}

export function getSweph(): SwephModule | null {
  if (swephModule === null) return null;
  if (swephModule !== undefined) return swephModule;

  try {
    // Native addon: dynamic require so optional sweph is not a hard compile dependency.
    const loaded = require('sweph') as unknown;
    if (!isUsableSweph(loaded)) {
      throw new Error('sweph module missing calc_ut/utc_to_jd/constants');
    }
    configureEphePath(loaded);
    swephModule = loaded;
    console.log('[sweph] Native module loaded');
    return swephModule;
  } catch (error) {
    swephModule = null;
    const hint =
      process.env.NODE_ENV === 'production'
        ? ' Ensure the native module is compiled for this platform and SWEPH_PATH points at your .se1 files.'
        : ' Run: npm rebuild sweph';
    console.warn(`[sweph] Cannot load native module (${String(error).slice(0, 120)}) — ${hint}`);
    return null;
  }
}
