import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// --- module-level mock factories (hoisted) ---

const mockGetCognitionLoopConfig = vi.fn();
const mockSetCognitionLoopConfig = vi.fn();
const mockGetCognitionLoopStatus = vi.fn();
const mockRefreshCognitionLoopSchedule = vi.fn();
const mockRunCognitionLoopOnce = vi.fn();

vi.mock("../models/settingsModel.js", () => ({
  getCognitionLoopConfig: mockGetCognitionLoopConfig,
  setCognitionLoopConfig: mockSetCognitionLoopConfig,
}));

vi.mock("../services/cognitionLoopService.js", () => ({
  getCognitionLoopStatus: mockGetCognitionLoopStatus,
  refreshCognitionLoopSchedule: mockRefreshCognitionLoopSchedule,
  runCognitionLoopOnce: mockRunCognitionLoopOnce,
}));

// --- helpers ---

function mockRes() {
  const res = { jsonValue: null, statusCode: 200 };
  res.json = vi.fn((val) => {
    res.jsonValue = val;
    return res;
  });
  res.status = vi.fn((code) => {
    res.statusCode = code;
    return res;
  });
  return res;
}

function buildConfig(overrides = {}) {
  return {
    enabled: true,
    intervalMinutes: 15,
    deliveryEnabled: true,
    deliveryPriorityThreshold: 0.6,
    quietHoursEnabled: true,
    quietHoursStartHour: 1,
    quietHoursEndHour: 7,
    startupGraceMinutes: 10,
    ...overrides,
  };
}

// Import controller handlers. vi.mock hoisting ensures mocks are in place first.
const {
  getCognitionLoopConfigHandler,
  saveCognitionLoopConfigHandler,
  getCognitionLoopStatusHandler,
  runCognitionLoopNowHandler,
} = await import("../controllers/cognitionController.js");

describe("cognitionController", () => {
  beforeEach(() => {
    mockGetCognitionLoopConfig.mockReset();
    mockSetCognitionLoopConfig.mockReset();
    mockGetCognitionLoopStatus.mockReset();
    mockRefreshCognitionLoopSchedule.mockReset();
    mockRunCognitionLoopOnce.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // --- GET /api/cognition-loop/config ---

  describe("getCognitionLoopConfigHandler", () => {
    it("returns the current config object", () => {
      const config = buildConfig();
      mockGetCognitionLoopConfig.mockReturnValue(config);

      const res = mockRes();
      getCognitionLoopConfigHandler({}, res);

      expect(res.json).toHaveBeenCalledOnce();
      expect(res.jsonValue).toEqual(config);
    });
  });

  // --- PUT /api/cognition-loop/config ---

  describe("saveCognitionLoopConfigHandler", () => {
    it("saves config and returns updated config + status", () => {
      const incomingBody = { intervalMinutes: 30, deliveryEnabled: false };
      const savedConfig = buildConfig({ intervalMinutes: 30, deliveryEnabled: false });
      const runtimeStatus = { started: true, running: false, loopCount: 2 };

      mockSetCognitionLoopConfig.mockReturnValue(savedConfig);
      mockRefreshCognitionLoopSchedule.mockReturnValue(runtimeStatus);

      const req = { body: incomingBody };
      const res = mockRes();
      saveCognitionLoopConfigHandler(req, res);

      expect(mockSetCognitionLoopConfig).toHaveBeenCalledWith(incomingBody);
      expect(mockRefreshCognitionLoopSchedule).toHaveBeenCalledOnce();
      expect(res.jsonValue).toEqual({ config: savedConfig, status: runtimeStatus });
    });

    it("handles missing or non-object body gracefully", () => {
      const savedConfig = buildConfig();
      mockSetCognitionLoopConfig.mockReturnValue(savedConfig);
      mockRefreshCognitionLoopSchedule.mockReturnValue({});

      // body is absent
      const req = {};
      const res = mockRes();
      saveCognitionLoopConfigHandler(req, res);

      expect(mockSetCognitionLoopConfig).toHaveBeenCalledWith({});
    });

    it("handles body as a non-object primitive gracefully", () => {
      const savedConfig = buildConfig();
      mockSetCognitionLoopConfig.mockReturnValue(savedConfig);
      mockRefreshCognitionLoopSchedule.mockReturnValue({});

      const req = { body: "not-an-object" };
      const res = mockRes();
      saveCognitionLoopConfigHandler(req, res);

      expect(mockSetCognitionLoopConfig).toHaveBeenCalledWith({});
    });
  });

  // --- GET /api/cognition-loop/status ---

  describe("getCognitionLoopStatusHandler", () => {
    it("returns current runtime status", () => {
      const status = {
        started: true,
        running: false,
        loopCount: 5,
        lastRunAt: "2026-04-23T10:00:00.000Z",
        nextRunAt: "2026-04-23T10:15:00.000Z",
        deliveriesTotal: 3,
      };
      mockGetCognitionLoopStatus.mockReturnValue(status);

      const res = mockRes();
      getCognitionLoopStatusHandler({}, res);

      expect(res.json).toHaveBeenCalledOnce();
      expect(res.jsonValue).toEqual(status);
    });
  });

  // --- POST /api/cognition-loop/run ---

  describe("runCognitionLoopNowHandler", () => {
    it("triggers a manual run and returns the summary", async () => {
      const summary = {
        ok: true,
        reason: "manual",
        personalitiesProcessed: 2,
        deliveredReachOut: 1,
        loopCount: 6,
      };
      mockRunCognitionLoopOnce.mockResolvedValue(summary);

      const res = mockRes();
      const next = vi.fn();
      await runCognitionLoopNowHandler({}, res, next);

      expect(mockRunCognitionLoopOnce).toHaveBeenCalledWith({ reason: "manual" });
      expect(res.jsonValue).toEqual(summary);
      expect(next).not.toHaveBeenCalled();
    });

    it("calls next(error) on unexpected rejection", async () => {
      const err = new Error("LLM unreachable");
      mockRunCognitionLoopOnce.mockRejectedValue(err);

      const res = mockRes();
      const next = vi.fn();
      await runCognitionLoopNowHandler({}, res, next);

      expect(next).toHaveBeenCalledWith(err);
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
