import { DEFAULT_WASM_PARITY_CASES, runWasmParityHarness } from "@/lib/astrology/wasm-parity";

describe("WASM parity harness", () => {
  it("runs parity checks when WASM is available", async () => {
    const report = await runWasmParityHarness({
      threshold: 2.0,
      cases: DEFAULT_WASM_PARITY_CASES.slice(0, 2),
    });

    if (!report.wasmAvailable) {
      expect(report.summary.ran).toBe(0);
      return;
    }

    expect(report.summary.ran).toBeGreaterThan(0);
    expect(report.summary.failed).toBe(0);
  });
});