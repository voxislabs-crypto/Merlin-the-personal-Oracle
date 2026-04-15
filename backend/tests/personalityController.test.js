import { beforeEach, describe, expect, it, vi } from "vitest";

const mockClaimLegacyPersonalities = vi.fn();
const mockCreatePersonality = vi.fn();
const mockDeletePersonality = vi.fn();
const mockGetAllPersonalities = vi.fn();
const mockGetLegacyPersonalityCount = vi.fn();
const mockGetPersonalityById = vi.fn();
const mockResetPersonalityState = vi.fn();
const mockUpdatePersonality = vi.fn();
const mockUpdatePersonalityVoiceProfile = vi.fn();
const mockClearChatMessagesForPersonality = vi.fn();
const mockClearPersonalityMemory = vi.fn();
const mockMoodFromLabel = vi.fn();
const mockMapToVoxisPersonality = vi.fn();
const mockGetAllVoicePresets = vi.fn();
const mockRecommendVoicePreset = vi.fn();
const mockSanitizeVoiceProfile = vi.fn((value) => value);

vi.mock("../models/personalityModel.js", () => ({
  claimLegacyPersonalities: mockClaimLegacyPersonalities,
  createPersonality: mockCreatePersonality,
  deletePersonality: mockDeletePersonality,
  getAllPersonalities: mockGetAllPersonalities,
  getLegacyPersonalityCount: mockGetLegacyPersonalityCount,
  getPersonalityById: mockGetPersonalityById,
  resetPersonalityState: mockResetPersonalityState,
  updatePersonality: mockUpdatePersonality,
  updatePersonalityVoiceProfile: mockUpdatePersonalityVoiceProfile,
}));

vi.mock("../models/chatModel.js", () => ({
  clearChatMessagesForPersonality: mockClearChatMessagesForPersonality,
}));

vi.mock("../models/memoryModel.js", () => ({
  clearPersonalityMemory: mockClearPersonalityMemory,
}));

vi.mock("../services/moodEngine.js", () => ({
  moodFromLabel: mockMoodFromLabel,
}));

vi.mock("../services/hybridPersonalityService.js", () => ({
  mapToVoxisPersonality: mockMapToVoxisPersonality,
}));

vi.mock("../services/voicePresetsService.js", () => ({
  getAllVoicePresets: mockGetAllVoicePresets,
  recommendVoicePreset: mockRecommendVoicePreset,
}));

vi.mock("../services/voiceProfileSanitizer.js", () => ({
  sanitizeVoiceProfile: mockSanitizeVoiceProfile,
}));

function createResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

describe("personalityController", () => {
  beforeEach(() => {
    vi.resetModules();
    mockClaimLegacyPersonalities.mockReset();
    mockCreatePersonality.mockReset();
    mockDeletePersonality.mockReset();
    mockGetAllPersonalities.mockReset();
    mockGetLegacyPersonalityCount.mockReset();
    mockGetPersonalityById.mockReset();
    mockResetPersonalityState.mockReset();
    mockUpdatePersonality.mockReset();
    mockUpdatePersonalityVoiceProfile.mockReset();
    mockClearChatMessagesForPersonality.mockReset();
    mockClearPersonalityMemory.mockReset();
    mockMoodFromLabel.mockReset();
    mockMapToVoxisPersonality.mockReset();
    mockGetAllVoicePresets.mockReset();
    mockRecommendVoicePreset.mockReset();
    mockSanitizeVoiceProfile.mockReset();
    mockSanitizeVoiceProfile.mockImplementation((value) => value);
  });

  it("includes the remaining legacy persona count when listing personalities", async () => {
    mockGetAllPersonalities.mockReturnValue([{ id: 910005, name: "Dark Ara" }]);
    mockGetLegacyPersonalityCount.mockReturnValue(10);

    const { listPersonalitiesHandler } = await import("../controllers/personalityController.js");
    const res = createResponse();
    const next = vi.fn();

    listPersonalitiesHandler({ voxisUser: { id: 4 } }, res, next);

    expect(mockGetAllPersonalities).toHaveBeenCalledWith(4);
    expect(mockGetLegacyPersonalityCount).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      personalities: [{ id: 910005, name: "Dark Ara" }],
      legacyPersonaCount: 10,
    });
  });

  it("claims legacy personas into the authenticated user's account", async () => {
    mockClaimLegacyPersonalities.mockReturnValue(10);
    mockGetAllPersonalities.mockReturnValue([
      { id: 910005, name: "Dark Ara", ownerId: 4 },
      { id: 910004, name: "Ara", ownerId: 4 },
    ]);
    mockGetLegacyPersonalityCount.mockReturnValue(0);

    const { claimLegacyPersonalitiesHandler } = await import("../controllers/personalityController.js");
    const res = createResponse();
    const next = vi.fn();

    claimLegacyPersonalitiesHandler({ voxisUser: { id: 4 } }, res, next);

    expect(mockClaimLegacyPersonalities).toHaveBeenCalledWith(4);
    expect(mockGetAllPersonalities).toHaveBeenCalledWith(4);
    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      claimedCount: 10,
      personalities: [
        { id: 910005, name: "Dark Ara", ownerId: 4 },
        { id: 910004, name: "Ara", ownerId: 4 },
      ],
      legacyPersonaCount: 0,
    });
  });

  it("rejects a legacy-claim request without a valid authenticated user", async () => {
    const { claimLegacyPersonalitiesHandler } = await import("../controllers/personalityController.js");
    const res = createResponse();
    const next = vi.fn();

    claimLegacyPersonalitiesHandler({ voxisUser: null }, res, next);

    expect(mockClaimLegacyPersonalities).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "A valid authenticated user is required to claim legacy personas.",
    });
  });
});
