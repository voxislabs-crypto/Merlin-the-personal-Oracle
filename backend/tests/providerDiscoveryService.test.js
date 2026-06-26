import { describe, expect, it } from "vitest";
import { afterEach, beforeEach, vi } from "vitest";

describe("providerDiscoveryService", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects obvious provider and API key mismatches before probing", async () => {
    const { fetchProviderModels } = await import("../services/providerDiscoveryService.js");

    await expect(
      fetchProviderModels({
        providerId: "openrouter",
        apiKey: "xai-test-key",
        baseUrl: "https://openrouter.ai/api/v1",
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining("Grok"),
    });
  });

  it("supports keyless Ollama model discovery", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({
        data: [
          { id: "llama3.2:latest" },
          { id: "qwen2.5:latest" },
        ],
      }),
    });

    const { fetchProviderModels } = await import("../services/providerDiscoveryService.js");
    const result = await fetchProviderModels({
      providerId: "ollama",
      apiKey: "",
      baseUrl: "http://127.0.0.1:11434/v1",
    });

    expect(result.provider).toBe("ollama");
    expect(result.baseUrl).toBe("http://127.0.0.1:11434/v1");
    expect(result.models.length).toBeGreaterThan(0);
  });
});