const encoder = new TextEncoder();

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') return Object.keys(value).sort().reduce((result, key) => { result[key] = stableValue(value[key]); return result; }, {});
  return value;
}

export function canonicalize(value) {
  return JSON.stringify(stableValue(value));
}

async function sha256(value) {
  if (!globalThis.crypto?.subtle) throw new Error('Web Crypto is unavailable; this browser cannot create a sealed hash.');
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function sealEntry(entry) {
  const sealedAt = new Date().toISOString();
  const snapshot = {
    title: entry.title,
    chartId: entry.chartId,
    windowStart: entry.windowStart,
    windowEnd: entry.windowEnd,
    hypothesis: entry.hypothesis,
    expectedOutcome: entry.expectedOutcome,
    signals: entry.signals || [],
    createdAt: entry.createdAt,
  };
  const canonicalSnapshot = canonicalize(snapshot);
  return {
    ...entry,
    status: 'SEALED',
    sealedAt,
    sealedSnapshot: snapshot,
    sealedCanonical: canonicalSnapshot,
    sealHash: await sha256(canonicalSnapshot),
    hashAlgorithm: 'SHA-256',
  };
}

export async function verifySeal(entry) {
  if (!entry?.sealedCanonical || !entry?.sealHash) return { valid: false, reason: 'No cryptographic seal is present.' };
  const actualHash = await sha256(entry.sealedCanonical);
  return actualHash === entry.sealHash ? { valid: true, reason: 'Sealed snapshot matches its SHA-256 digest.' } : { valid: false, reason: 'The sealed snapshot does not match its stored digest.' };
}
