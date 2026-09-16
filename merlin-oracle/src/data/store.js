const STORAGE_KEY = 'merlin-oracle-local-v1';

const seedState = {
  charts: [
    {
      id: 'chart-bitcoin', type: 'MARKET', name: 'Bitcoin', description: 'A market reference for the genesis block.', date: '2009-01-03', time: '18:15', location: 'Helsinki, Finland', latitude: '60.1699', longitude: '24.9384', timezone: 'UTC+02:00', source: 'Bitcoin genesis block', createdAt: '2026-09-12T10:00:00.000Z'
    },
    {
      id: 'chart-earth', type: 'EARTH', name: 'Earth Equinox', description: 'Seasonal reference for the machine.', date: '2026-09-22', time: '00:05', location: 'Greenwich, England', latitude: '51.4769', longitude: '0.0005', timezone: 'UTC+00:00', source: 'Astronomical reference', createdAt: '2026-09-12T10:02:00.000Z'
    }
  ],
  timetraks: [
    { id: 'trak-1', chartId: 'chart-bitcoin', start: '2026-09-19', peak: '2026-09-21', end: '2026-09-23', intensity: 78, object: 'Lunar Node', aspect: 'Conjunction', aspectType: 'Major', orb: 1.4, direction: 'Applying', quality: 'Exploratory', version: 'placeholder-0.1', createdAt: '2026-09-12T10:05:00.000Z' },
    { id: 'trak-2', chartId: 'chart-earth', start: '2026-09-20', peak: '2026-09-22', end: '2026-09-24', intensity: 64, object: 'Saturn', aspect: 'Trine', aspectType: 'Major', orb: 2.1, direction: 'Separating', quality: 'Exploratory', version: 'placeholder-0.1', createdAt: '2026-09-12T10:06:00.000Z' }
  ],
  almanac: [],
  experiments: [],
  kalshi: [],
  archive: []
};

function clone(value) { return JSON.parse(JSON.stringify(value)); }

export function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...clone(seedState), ...JSON.parse(saved), kalshi: JSON.parse(saved).kalshi || [] } : clone(seedState);
  } catch { return clone(seedState); }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function createId(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

export function recordArchive(state, type, input, output) {
  state.archive.unshift({ id: createId('archive'), type, algorithmVersion: 'placeholder-0.1', dataSource: 'Local reference data / no ephemeris', input: clone(input), output: clone(output), calculatedAt: new Date().toISOString() });
}
