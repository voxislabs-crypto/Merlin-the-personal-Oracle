import fs from 'fs';
import os from 'os';
import path from 'path';

describe('sweph runtime ephemeris path', () => {
  const originalSwephPath = process.env.SWEPH_PATH;

  afterEach(() => {
    if (originalSwephPath === undefined) {
      delete process.env.SWEPH_PATH;
    } else {
      process.env.SWEPH_PATH = originalSwephPath;
    }
    jest.resetModules();
  });

  it('defaults to ./ephe under the project root', () => {
    jest.isolateModules(() => {
      const { getSwephPath } = require('../../lib/sweph-runtime');
      expect(getSwephPath()).toBe(path.join(process.cwd(), 'ephe'));
    });
  });

  it('respects SWEPH_PATH when provided', () => {
    const customPath = path.join(os.tmpdir(), 'custom-ephe');
    process.env.SWEPH_PATH = customPath;

    jest.isolateModules(() => {
      const { getSwephPath } = require('../../lib/sweph-runtime');
      expect(getSwephPath()).toBe(path.resolve(customPath));
    });
  });

  it('loads sweph and configures ephemeris files when present', () => {
    const epheDir = path.join(process.cwd(), 'ephe');
    if (!fs.existsSync(epheDir)) {
      return;
    }

    jest.isolateModules(() => {
      const { getSweph } = require('../../lib/sweph-runtime');
      const sweph = getSweph();
      expect(sweph).not.toBeNull();

      const result = sweph.calc_ut(2451545, 0, sweph.constants.SEFLG_SWIEPH);
      expect(result.flag).toBe(sweph.constants.SEFLG_SWIEPH);
      expect(result.error || '').not.toMatch(/Moshier/i);
    });
  });
});