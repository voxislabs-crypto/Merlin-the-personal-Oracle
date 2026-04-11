import { describe, expect, it } from "vitest";

describe("providerDiscoveryService", () => {
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
});