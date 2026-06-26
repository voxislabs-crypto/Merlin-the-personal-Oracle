import 'server-only';
import fs from 'fs';
import path from 'path';

type SwephModule = {
  set_ephe_path?: (ephePath: string) => void;
  constants?: Record<string, number>;
  calc_ut?: (...args: unknown[]) => unknown;
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
        `[sweph] Ephemeris path set to ${ephePath} but no .se1 files found — calculations will use Moshier fallback`
      );
    }
  }
}

export function getSwephPath(): string {
  return resolveEphePath();
}

export function getSweph(): SwephModule | null {
  if (swephModule === null) return null;
  if (swephModule !== undefined) return swephModule;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sweph = require('sweph') as SwephModule;
    configureEphePath(sweph);
    swephModule = sweph;
    console.log('[sweph] Native module loaded');
    return sweph;
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