import { calculateBirthChart as calculateFallbackBirthChart } from "@/lib/engine-fallback";

export interface WasmParityCase {
  name: string;
  birthDate: string;
  birthTime: string;
  latitude: number;
  longitude: number;
  houseSystem?: "Placidus" | "Koch" | "Equal" | "Whole";
}

export interface WasmParityDelta {
  subject: string;
  fallbackLongitude: number;
  wasmLongitude: number;
  delta: number;
  signMatch: boolean;
}

export interface WasmParityCaseResult {
  name: string;
  passed: boolean;
  maxDelta: number;
  deltas: WasmParityDelta[];
}

export interface WasmParitySummary {
  ran: number;
  passed: number;
  failed: number;
}

export interface WasmParityReport {
  wasmAvailable: boolean;
  error?: string;
  threshold: number;
  summary: WasmParitySummary;
  cases: WasmParityCaseResult[];
}

export const DEFAULT_WASM_PARITY_CASES: WasmParityCase[] = [
  {
    name: "San Francisco Sample",
    birthDate: "1992-07-14",
    birthTime: "09:30",
    latitude: 37.7749,
    longitude: -122.4194,
    houseSystem: "Placidus",
  },
  {
    name: "New York Midnight",
    birthDate: "1987-11-03",
    birthTime: "00:15",
    latitude: 40.7128,
    longitude: -74.006,
    houseSystem: "Placidus",
  },
  {
    name: "London Noon",
    birthDate: "2001-03-21",
    birthTime: "12:00",
    latitude: 51.5074,
    longitude: -0.1278,
    houseSystem: "Placidus",
  },
];

function normalizeDiff(a: number, b: number): number {
  let diff = Math.abs(a - b);
  if (diff > 180) diff = 360 - diff;
  return diff;
}

function buildPlanetMap(
  chart: { positions?: Array<{ name: string; longitude: number; sign?: string }> }
): Map<string, { longitude: number; sign: string }> {
  const map = new Map<string, { longitude: number; sign: string }>();
  for (const p of chart.positions || []) {
    map.set(p.name, {
      longitude: p.longitude,
      sign: p.sign || "Unknown",
    });
  }
  return map;
}

export async function runWasmParityHarness(options?: {
  threshold?: number;
  cases?: WasmParityCase[];
}): Promise<WasmParityReport> {
  const threshold = options?.threshold ?? 2.0;
  const inputCases = options?.cases ?? DEFAULT_WASM_PARITY_CASES;

  let calculateBirthChartWasm:
    | ((args: {
        birthDate: string;
        birthTime: string;
        latitude: number;
        longitude: number;
        houseSystem?: "Placidus" | "Koch" | "Equal" | "Whole";
      }) => Promise<{ positions?: Array<{ name: string; longitude: number; sign?: string }> }>)
    | null = null;

  try {
    const wasm = await import("@/lib/astrology/engine-wasm");
    calculateBirthChartWasm = wasm.calculateBirthChartWasm;
  } catch (error) {
    return {
      wasmAvailable: false,
      error: error instanceof Error ? error.message : String(error),
      threshold,
      summary: {
        ran: 0,
        passed: 0,
        failed: 0,
      },
      cases: [],
    };
  }

  const results: WasmParityCaseResult[] = [];

  for (const testCase of inputCases) {
    const fallback = calculateFallbackBirthChart(
      testCase.birthDate,
      testCase.birthTime,
      testCase.latitude,
      testCase.longitude
    );

    let wasm: { positions?: Array<{ name: string; longitude: number; sign?: string }> };

    try {
      wasm = await calculateBirthChartWasm({
        birthDate: testCase.birthDate,
        birthTime: testCase.birthTime,
        latitude: testCase.latitude,
        longitude: testCase.longitude,
        houseSystem: testCase.houseSystem,
      });
    } catch (error) {
      return {
        wasmAvailable: false,
        error: error instanceof Error ? error.message : String(error),
        threshold,
        summary: {
          ran: 0,
          passed: 0,
          failed: 0,
        },
        cases: [],
      };
    }

    const fallbackPlanets = buildPlanetMap(fallback);
    const wasmPlanets = buildPlanetMap(wasm);

    const subjects = ["Sun", "Moon", "Mercury", "Venus", "Mars"];
    const deltas: WasmParityDelta[] = [];

    for (const subject of subjects) {
      const fallbackPoint = fallbackPlanets.get(subject);
      const wasmPoint = wasmPlanets.get(subject);
      if (!fallbackPoint || !wasmPoint) continue;

      deltas.push({
        subject,
        fallbackLongitude: fallbackPoint.longitude,
        wasmLongitude: wasmPoint.longitude,
        delta: normalizeDiff(fallbackPoint.longitude, wasmPoint.longitude),
        signMatch: fallbackPoint.sign === wasmPoint.sign,
      });
    }

    const maxDelta = deltas.reduce((max, item) => Math.max(max, item.delta), 0);
    const passed = deltas.length > 0 && deltas.every((item) => item.delta <= threshold);

    results.push({
      name: testCase.name,
      passed,
      maxDelta,
      deltas,
    });
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;

  return {
    wasmAvailable: true,
    threshold,
    summary: {
      ran: results.length,
      passed,
      failed,
    },
    cases: results,
  };
}