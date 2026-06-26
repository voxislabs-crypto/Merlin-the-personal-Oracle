const WINDOW_MS = 60_000;
const STORM_THRESHOLD_PER_MIN = Number(import.meta.env.VITE_REQUEST_STORM_THRESHOLD || 120);
const TALKER_WARN_PER_MIN = Number(import.meta.env.VITE_REQUEST_TALKER_WARN_THRESHOLD || 20);
const TALKER_HOT_PER_MIN = Number(import.meta.env.VITE_REQUEST_TALKER_HOT_THRESHOLD || 40);
const WARN_COOLDOWN_MS = 15_000;
const RECENT_REQUEST_LIMIT = 40;
const TOP_TALKER_SPARK_BINS = 12;

const CATEGORY_KEYS = ["all", "cartesia", "stt", "tts", "llm", "settings", "other"];
const totals = Object.fromEntries(CATEGORY_KEYS.map((key) => [key, 0]));
const windows = Object.fromEntries(CATEGORY_KEYS.map((key) => [key, []]));

const endpointTotals = new Map();
const endpointWindows = new Map();
const recentRequests = [];

const transportState = {
  websocketsActive: 0,
  eventSourcesActive: 0,
  streamsActive: 0,
};

let lastStormWarningAt = 0;

function nowMs() {
  return Date.now();
}

function pruneWindow(list, now) {
  while (list.length > 0 && now - list[0] > WINDOW_MS) {
    list.shift();
  }
}

function detectCategory(url) {
  const target = String(url || "").toLowerCase();

  if (target.includes("/tts/provider-options") && target.includes("provider=cartesia")) {
    return "cartesia";
  }
  if (target.includes("/stt/")) {
    return "stt";
  }
  if (target.includes("/tts/")) {
    return "tts";
  }
  if (target.includes("/chat") || target.includes("/llm")) {
    return "llm";
  }
  if (target.includes("/settings/")) {
    return "settings";
  }
  return "other";
}

function normalizeEndpoint(url) {
  const raw = String(url || "").trim();
  if (!raw) {
    return "unknown";
  }

  try {
    const base = typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const parsed = new URL(raw, base);
    let path = parsed.pathname || "/";

    // Preserve provider context where it matters for diagnostics.
    if (path.includes("/tts/provider-options")) {
      const provider = String(parsed.searchParams.get("provider") || "").trim();
      if (provider) {
        path = `${path}?provider=${provider}`;
      }
    }

    return path;
  } catch {
    return raw;
  }
}

function buildSparkBins(timestamps, now, windowMs = WINDOW_MS, bins = TOP_TALKER_SPARK_BINS) {
  const list = Array.isArray(timestamps) ? timestamps : [];
  const safeBins = Math.max(4, Number(bins) || 12);
  const binWidth = windowMs / safeBins;
  const output = new Array(safeBins).fill(0);

  for (const stamp of list) {
    const age = now - Number(stamp || 0);
    if (age < 0 || age > windowMs) {
      continue;
    }

    // Oldest on the left, newest on the right.
    const indexFromLeft = Math.min(
      safeBins - 1,
      Math.max(0, Math.floor((windowMs - age) / binWidth)),
    );
    output[indexFromLeft] += 1;
  }

  return output;
}

function deriveTalkerSeverity(perMin) {
  const value = Number(perMin || 0);
  if (value >= TALKER_HOT_PER_MIN) {
    return "hot";
  }
  if (value >= TALKER_WARN_PER_MIN) {
    return "warn";
  }
  return "normal";
}

function pushRecentRequest(entry) {
  recentRequests.push(entry);
  if (recentRequests.length > RECENT_REQUEST_LIMIT) {
    recentRequests.splice(0, recentRequests.length - RECENT_REQUEST_LIMIT);
  }
}

function syncWindowDebugObject(snapshot) {
  if (typeof window === "undefined") {
    return;
  }
  window.__voxisRequests = snapshot;
}

function maybeWarnStorm(snapshot) {
  const totalPerMin = Number(snapshot?.categories?.all?.perMin || 0);
  if (totalPerMin <= STORM_THRESHOLD_PER_MIN) {
    return;
  }

  const now = nowMs();
  if (now - lastStormWarningAt < WARN_COOLDOWN_MS) {
    return;
  }

  lastStormWarningAt = now;
  console.warn(
    `[Voxis Runtime Monitor] Potential request storm detected: ${totalPerMin} req/min (threshold ${STORM_THRESHOLD_PER_MIN}).`,
  );
}

export function bumpRequestMetric(url, meta = {}) {
  const category = detectCategory(url);
  const endpoint = normalizeEndpoint(url);
  const method = String(meta.method || "GET").toUpperCase();
  const transport = String(meta.transport || "fetch").trim().toLowerCase() || "fetch";
  const cause = String(meta.cause || "").trim();
  const now = nowMs();

  const keys = ["all", category];
  for (const key of keys) {
    totals[key] = (totals[key] || 0) + 1;
    windows[key].push(now);
    pruneWindow(windows[key], now);
  }

  const endpointKey = `${method} ${endpoint}`;
  endpointTotals.set(endpointKey, (endpointTotals.get(endpointKey) || 0) + 1);
  if (!endpointWindows.has(endpointKey)) {
    endpointWindows.set(endpointKey, []);
  }
  const endpointWindow = endpointWindows.get(endpointKey);
  endpointWindow.push(now);
  pruneWindow(endpointWindow, now);

  pushRecentRequest({
    at: now,
    method,
    endpoint,
    category,
    transport,
    cause,
  });

  const snapshot = getRequestMetricsSnapshot();
  syncWindowDebugObject(snapshot);

  if (category === "cartesia") {
    console.count("[Voxis Requests] cartesia");
  }

  maybeWarnStorm(snapshot);
  return snapshot;
}

export async function trackedFetch(url, options = {}, meta = {}) {
  const method = String(options?.method || meta?.method || "GET").toUpperCase();
  const cause = String(meta?.cause || options?.__voxisCause || "raw-fetch").trim();

  bumpRequestMetric(url, {
    method,
    cause,
    transport: String(meta?.transport || "fetch"),
  });

  const nextOptions = { ...options };
  if (Object.prototype.hasOwnProperty.call(nextOptions, "__voxisCause")) {
    delete nextOptions.__voxisCause;
  }

  return fetch(url, nextOptions);
}

export function trackedWebSocket(url, protocols, meta = {}) {
  bumpRequestMetric(url, {
    method: "CONNECT",
    cause: String(meta?.cause || "websocket").trim(),
    transport: "websocket",
  });

  const ws = protocols === undefined ? new WebSocket(url) : new WebSocket(url, protocols);
  transportState.websocketsActive += 1;

  const cleanup = () => {
    transportState.websocketsActive = Math.max(0, transportState.websocketsActive - 1);
    ws.removeEventListener("close", cleanup);
    ws.removeEventListener("error", cleanup);
  };

  ws.addEventListener("close", cleanup);
  ws.addEventListener("error", cleanup);
  return ws;
}

export function trackedEventSource(url, options = {}, meta = {}) {
  bumpRequestMetric(url, {
    method: "SUBSCRIBE",
    cause: String(meta?.cause || "eventsource").trim(),
    transport: "eventsource",
  });

  const source = new EventSource(url, options);
  transportState.eventSourcesActive += 1;

  const cleanup = () => {
    transportState.eventSourcesActive = Math.max(0, transportState.eventSourcesActive - 1);
    source.removeEventListener("error", cleanup);
  };

  source.addEventListener("error", cleanup);
  return source;
}

export function trackedStreamStart(meta = {}) {
  const endpoint = String(meta.endpoint || "stream").trim();
  bumpRequestMetric(endpoint, {
    method: String(meta.method || "STREAM").toUpperCase(),
    cause: String(meta.cause || "stream").trim(),
    transport: "stream",
  });

  transportState.streamsActive += 1;
  let closed = false;

  return () => {
    if (closed) {
      return;
    }
    closed = true;
    transportState.streamsActive = Math.max(0, transportState.streamsActive - 1);
  };
}

export async function trackedIpc(channel, invokeFn, meta = {}) {
  const endpoint = `ipc:${String(channel || "unknown")}`;
  bumpRequestMetric(endpoint, {
    method: "IPC",
    cause: String(meta.cause || `ipc:${channel}`).trim(),
    transport: "ipc",
  });
  return invokeFn();
}

export function getRequestMetricsSnapshot() {
  const now = nowMs();
  const categories = {};

  for (const key of CATEGORY_KEYS) {
    pruneWindow(windows[key], now);
    categories[key] = {
      total: totals[key] || 0,
      perMin: windows[key].length,
    };
  }

  const topTalkers = Array.from(endpointWindows.entries())
    .map(([endpoint, list]) => {
      pruneWindow(list, now);
      return {
        endpoint,
        perMin: list.length,
        total: endpointTotals.get(endpoint) || 0,
        sparkBins: buildSparkBins(list, now),
        severity: deriveTalkerSeverity(list.length),
      };
    })
    .filter((entry) => entry.perMin > 0)
    .sort((left, right) => right.perMin - left.perMin)
    .slice(0, 8);

  const alerts = {
    highRequestRate: categories.all.perMin > STORM_THRESHOLD_PER_MIN,
    thresholdPerMin: STORM_THRESHOLD_PER_MIN,
    message:
      categories.all.perMin > STORM_THRESHOLD_PER_MIN
        ? `High request activity detected (${categories.all.perMin} req/min).`
        : "",
  };

  const snapshot = {
    updatedAt: now,
    windowMs: WINDOW_MS,
    categories,
    topTalkers,
    transport: {
      ...transportState,
    },
    recentRequests: recentRequests.slice(-12),
    alerts,
  };

  syncWindowDebugObject(snapshot);
  return snapshot;
}
