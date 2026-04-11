import { useEffect, useMemo, useState } from "react";
import { useAuthFetch } from "../hooks/useAuthFetch.js";

const CUSTOM_OPTION = "__custom__";

const ELEVENLABS_VOICE_PRESETS = [
  { id: "21m00Tcm4TlvDq8ikWAM", label: "Rachel (default)" },
  { id: "EXAVITQu4vr4xnSDxMaL", label: "Bella" },
  { id: "TxGEqnHWrfWFTfGW9XjX", label: "Josh" },
  { id: "VR6AewLTigWG4xSOukaG", label: "Arnold" },
  { id: "ErXwobaYiN019PkySvjV", label: "Antoni" },
];

const CARTESIA_VOICE_PRESETS = [
  { id: "a0e99841-438c-4a64-b679-ae501e7d6091", label: "Sonic default" },
  { id: "694f9389-aac1-45b6-b726-9d9369183238", label: "Warm Narrator" },
  { id: "2ee87190-8f84-4925-97da-e52547f9462c", label: "Balanced Voice" },
];

const ELEVENLABS_MODEL_PRESETS = [
  { id: "eleven_multilingual_v2", label: "eleven_multilingual_v2" },
  { id: "eleven_turbo_v2_5", label: "eleven_turbo_v2_5" },
  { id: "eleven_flash_v2_5", label: "eleven_flash_v2_5" },
];

const CARTESIA_MODEL_PRESETS = [
  { id: "sonic-2", label: "sonic-2" },
];

const settingsStyles = `
  .llm-settings {
    display: grid;
    gap: 18px;
  }

  .settings-section {
    border: 1px solid rgba(0, 180, 255, 0.12);
    border-radius: 22px;
    background: rgba(6, 14, 28, 0.72);
    padding: 20px;
    display: grid;
    gap: 14px;
  }

  .settings-section-header {
    display: grid;
    gap: 6px;
  }

  .settings-section-tag {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    padding: 4px 9px;
    border-radius: 999px;
    border: 1px solid rgba(0, 180, 255, 0.18);
    background: rgba(0, 180, 255, 0.06);
    color: #8fdfff;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .settings-section h3 {
    margin: 0;
    font-size: 1.05rem;
    color: var(--text);
  }

  .settings-section p,
  .llm-field p {
    margin: 0;
    color: var(--muted);
    line-height: 1.6;
  }

  .settings-section-copy {
    max-width: 72ch;
    font-size: 0.92rem;
  }

  .llm-grid {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .llm-field {
    display: grid;
    gap: 6px;
  }

  .llm-field-helper {
    font-size: 0.82rem;
  }

  .llm-field label {
    color: var(--muted);
    font-size: 0.86rem;
    font-weight: 700;
  }

  .llm-field input,
  .llm-field select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid rgba(0, 180, 255, 0.16);
    border-radius: 12px;
    background: rgba(6, 14, 28, 0.9);
    color: var(--text);
  }

  .llm-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .llm-actions.compact {
    align-items: flex-start;
  }

  .llm-actions button {
    padding: 10px 16px;
    border: 0;
    border-radius: 999px;
    background: linear-gradient(135deg, var(--accent), var(--accent-deep));
    color: #fff;
    font-weight: 800;
  }

  .llm-actions button.secondary {
    background: rgba(0, 180, 255, 0.06);
    border: 1px solid rgba(0, 180, 255, 0.2);
    color: var(--accent);
  }

  .llm-actions button:disabled {
    opacity: 0.6;
    cursor: wait;
  }

  .llm-toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    border: 1px solid rgba(0, 180, 255, 0.14);
    border-radius: 14px;
    background: rgba(0, 180, 255, 0.05);
  }

  .llm-toggle-copy {
    display: grid;
    gap: 4px;
  }

  .llm-toggle-copy strong {
    color: var(--text);
    font-size: 0.92rem;
  }

  .llm-toggle-copy span {
    color: var(--muted);
    font-size: 0.82rem;
    line-height: 1.5;
  }

  .llm-toggle {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    color: var(--text);
    font-weight: 700;
  }

  .llm-toggle input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: #00bfff;
    cursor: pointer;
  }

  .llm-connected {
    padding: 12px;
    border-radius: 12px;
    border: 1px solid rgba(0, 200, 120, 0.18);
    background: rgba(0, 200, 120, 0.07);
    color: #7fe7b1;
    line-height: 1.6;
    font-size: 0.9rem;
  }

  .llm-connected.info {
    border-color: rgba(0, 180, 255, 0.18);
    background: rgba(0, 180, 255, 0.07);
    color: #8fdfff;
  }

  @media (max-width: 900px) {
    .llm-grid {
      grid-template-columns: 1fr;
    }
  }
`;

function fallbackProviders() {
  return [
    { id: "openai", name: "OpenAI", baseUrl: "https://api.openai.com/v1" },
    { id: "grok", name: "Grok (xAI)", baseUrl: "https://api.x.ai/v1" },
    { id: "groq", name: "Groq", baseUrl: "https://api.groq.com/openai/v1" },
    { id: "openrouter", name: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1" },
    { id: "together", name: "Together", baseUrl: "https://api.together.xyz/v1" },
    { id: "mistral", name: "Mistral", baseUrl: "https://api.mistral.ai/v1" },
    { id: "anthropic", name: "Anthropic", baseUrl: "https://api.anthropic.com/v1" },
    { id: "custom", name: "Custom OpenAI-Compatible", baseUrl: "" },
  ];
}

export default function LlmSettingsPanel({ onStatus }) {
  const authFetch = useAuthFetch();
  const [providers, setProviders] = useState([]);
  const [savedProviders, setSavedProviders] = useState([]);
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [availableModels, setAvailableModels] = useState([]);
  const [model, setModel] = useState("");
  const [connected, setConnected] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [ttsProviders, setTtsProviders] = useState([]);
  const [ttsProvider, setTtsProvider] = useState("elevenlabs");
  const [ttsApiKey, setTtsApiKey] = useState("");
  const [ttsVoiceId, setTtsVoiceId] = useState("");
  const [ttsModel, setTtsModel] = useState("");
  const [ttsProviderOptions, setTtsProviderOptions] = useState({
    elevenlabs: {
      voices: ELEVENLABS_VOICE_PRESETS,
      builtinVoices: ELEVENLABS_VOICE_PRESETS,
      customVoices: [],
      models: ELEVENLABS_MODEL_PRESETS,
      error: "",
    },
    cartesia: {
      voices: CARTESIA_VOICE_PRESETS,
      builtinVoices: CARTESIA_VOICE_PRESETS,
      customVoices: [],
      models: CARTESIA_MODEL_PRESETS,
      error: "",
    },
  });
  const [isLoadingTtsProviderOptions, setIsLoadingTtsProviderOptions] = useState(false);
  const [isSavingTts, setIsSavingTts] = useState(false);
  const [isDisconnectingTts, setIsDisconnectingTts] = useState(false);
  const [defaultVoiceSource, setDefaultVoiceSource] = useState("tts");
  const [isSavingDefaultVoiceSource, setIsSavingDefaultVoiceSource] = useState(false);
  const [kokoroSettings, setKokoroSettings] = useState({ connected: false, keyHint: "", updatedAt: "" });
  const [kokoroHfToken, setKokoroHfToken] = useState("");
  const [isSavingKokoroToken, setIsSavingKokoroToken] = useState(false);
  const [isClearingKokoroToken, setIsClearingKokoroToken] = useState(false);
  const [llmEnvInfo, setLlmEnvInfo] = useState({
    envConfigured: false,
    envBaseUrl: "",
    envModel: "",
    envLocked: false,
  });

  const selectedProvider = useMemo(
    () => providers.find((candidate) => candidate.id === provider) || null,
    [providers, provider],
  );

  const selectedSavedCredential = useMemo(() => {
    const normalizedBaseUrl = String(baseUrl || "").trim().replace(/\/$/, "");
    const byExactBaseUrl = savedProviders.find(
      (candidate) =>
        candidate.provider === provider &&
        String(candidate.baseUrl || "").trim().replace(/\/$/, "") === normalizedBaseUrl,
    );

    if (byExactBaseUrl) {
      return byExactBaseUrl;
    }

    return (
      savedProviders.find(
        (candidate) => candidate.provider === provider && !String(candidate.baseUrl || "").trim(),
      ) || null
    );
  }, [baseUrl, provider, savedProviders]);

  const selectedTtsProvider = useMemo(
    () => ttsProviders.find((candidate) => candidate.provider === ttsProvider) || null,
    [ttsProvider, ttsProviders],
  );

  const activeTtsProviderOptions = ttsProviderOptions[ttsProvider] || {
    voices: [],
    builtinVoices: [],
    customVoices: [],
    models: [],
    error: "",
  };

  const activeTtsBuiltinVoices = Array.isArray(activeTtsProviderOptions.builtinVoices)
    ? activeTtsProviderOptions.builtinVoices
    : [];
  const activeTtsCustomVoices = Array.isArray(activeTtsProviderOptions.customVoices)
    ? activeTtsProviderOptions.customVoices
    : [];
  const selectedTtsVoiceOption = activeTtsProviderOptions.voices.some((voice) => voice.id === ttsVoiceId)
    ? ttsVoiceId
    : CUSTOM_OPTION;
  const selectedTtsModelOption = activeTtsProviderOptions.models.some((entry) => entry.id === ttsModel)
    ? ttsModel
    : CUSTOM_OPTION;

  useEffect(() => {
    void initialize();
  }, []);

  useEffect(() => {
    if (provider !== "custom") {
      setBaseUrl(selectedProvider?.baseUrl || "");
    }
  }, [provider, selectedProvider?.baseUrl]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const normalizedBaseUrl = String(baseUrl || "").trim().replace(/\/$/, "");
    const normalizedConnectedBaseUrl = String(connected?.baseUrl || "").trim().replace(/\/$/, "");
    const sameConnection = connected?.provider === provider && normalizedBaseUrl === normalizedConnectedBaseUrl;

    if (!sameConnection) {
      setAvailableModels([]);
      setModel("");
    }
  }, [provider, baseUrl, connected?.provider, connected?.baseUrl, isLoading]);

  useEffect(() => {
    if (!selectedTtsProvider) {
      return;
    }
    setTtsVoiceId(selectedTtsProvider.voiceId || selectedTtsProvider.defaultVoiceId || "");
    setTtsModel(selectedTtsProvider.model || selectedTtsProvider.defaultModel || "");
  }, [selectedTtsProvider?.provider, selectedTtsProvider?.voiceId, selectedTtsProvider?.model]);

  useEffect(() => {
    if (!["elevenlabs", "cartesia"].includes(ttsProvider)) {
      return;
    }

    let ignore = false;

    async function loadTtsProviderOptions() {
      setIsLoadingTtsProviderOptions(true);
      try {
        const response = await authFetch(`/tts/provider-options?provider=${encodeURIComponent(ttsProvider)}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to load provider options.");
        }
        if (ignore) {
          return;
        }

        const fallbackVoices = ttsProvider === "elevenlabs"
          ? ELEVENLABS_VOICE_PRESETS
          : CARTESIA_VOICE_PRESETS;
        const fallbackModels = ttsProvider === "elevenlabs"
          ? ELEVENLABS_MODEL_PRESETS
          : CARTESIA_MODEL_PRESETS;

        const voices = Array.isArray(data.voices) && data.voices.length
          ? data.voices
          : fallbackVoices;
        const models = Array.isArray(data.models) && data.models.length
          ? data.models
          : fallbackModels;

        setTtsProviderOptions((current) => ({
          ...current,
          [ttsProvider]: {
            voices,
            builtinVoices: Array.isArray(data.builtinVoices) && data.builtinVoices.length
              ? data.builtinVoices
              : voices,
            customVoices: Array.isArray(data.customVoices) ? data.customVoices : [],
            models,
            error: String(data.error || "").trim(),
          },
        }));
      } catch (error) {
        if (!ignore) {
          setTtsProviderOptions((current) => ({
            ...current,
            [ttsProvider]: {
              ...(current[ttsProvider] || { voices: [], builtinVoices: [], customVoices: [], models: [] }),
              error: error.message || "Failed to load provider options.",
            },
          }));
        }
      } finally {
        if (!ignore) {
          setIsLoadingTtsProviderOptions(false);
        }
      }
    }

    void loadTtsProviderOptions();
    return () => {
      ignore = true;
    };
  }, [authFetch, ttsProvider]);

  async function initialize() {
    setIsLoading(true);

    try {
      const [providersResponse, settingsResponse, ttsResponse, kokoroResponse] = await Promise.all([
        authFetch("/settings/llm/providers"),
        authFetch("/settings/llm"),
        authFetch("/settings/tts"),
        authFetch("/settings/kokoro"),
      ]);

      const providersData = await providersResponse.json();
      const settingsData = await settingsResponse.json();
      const ttsData = await ttsResponse.json();
      const kokoroData = await kokoroResponse.json();

      if (!providersResponse.ok) {
        throw new Error(providersData.error || "Failed to load providers.");
      }
      if (!settingsResponse.ok) {
        throw new Error(settingsData.error || "Failed to load current settings.");
      }
      if (!ttsResponse.ok) {
        throw new Error(ttsData.error || "Failed to load TTS settings.");
      }
      if (!kokoroResponse.ok) {
        throw new Error(kokoroData.error || "Failed to load Kokoro settings.");
      }

      const providerList = Array.isArray(providersData.providers) && providersData.providers.length
        ? providersData.providers
        : fallbackProviders();

      setProviders(providerList);

      if (settingsData.connected) {
        setConnected(settingsData);
        setSavedProviders(settingsData.savedProviders || []);
        setProvider(settingsData.provider || providerList[0]?.id || "openai");
        setBaseUrl(settingsData.baseUrl || "");
        setAvailableModels(settingsData.models || []);
        setModel(settingsData.model || "");
      } else {
        setConnected(null);
        setSavedProviders(settingsData.savedProviders || []);
        setProvider(providerList[0]?.id || "openai");
        setAvailableModels([]);
        setModel("");
      }

      setLlmEnvInfo({
        envConfigured: Boolean(settingsData.envConfigured),
        envBaseUrl: String(settingsData.envBaseUrl || "").trim(),
        envModel: String(settingsData.envModel || "").trim(),
        envLocked: Boolean(settingsData.envLocked),
      });

      const ttsProviderList = Array.isArray(ttsData.providers) ? ttsData.providers : [];
      setTtsProviders(ttsProviderList);
      setDefaultVoiceSource(ttsData?.voiceDefaults?.source === "llm" ? "llm" : "tts");
      const connectedProvider = ttsProviderList.find((entry) => entry.connected) || ttsProviderList[0] || null;
      if (connectedProvider) {
        setTtsProvider(connectedProvider.provider);
        setTtsVoiceId(connectedProvider.voiceId || connectedProvider.defaultVoiceId || "");
        setTtsModel(connectedProvider.model || connectedProvider.defaultModel || "");
      }

      setKokoroSettings({
        connected: Boolean(kokoroData?.connected),
        keyHint: String(kokoroData?.keyHint || "").trim(),
        updatedAt: String(kokoroData?.updatedAt || "").trim(),
      });
    } catch (error) {
      onStatus?.({ type: "error", message: error.message || "Failed to load LLM settings." });
      setProviders(fallbackProviders());
    } finally {
      setIsLoading(false);
    }
  }

  async function saveTtsProvider() {
    if (!ttsProvider) {
      onStatus?.({ type: "error", message: "Choose a TTS provider first." });
      return;
    }
    if (!ttsApiKey.trim()) {
      onStatus?.({ type: "error", message: "TTS API key is required to save/update provider credentials." });
      return;
    }

    setIsSavingTts(true);
    try {
      const response = await authFetch(`/settings/tts/${ttsProvider}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: ttsApiKey.trim(),
          voiceId: ttsVoiceId.trim(),
          model: ttsModel.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save TTS credentials.");
      }

      setTtsApiKey("");
      await initialize();
      onStatus?.({ type: "success", message: `Saved ${data.name || data.provider} credentials.` });
    } catch (error) {
      onStatus?.({ type: "error", message: error.message || "Failed to save TTS credentials." });
    } finally {
      setIsSavingTts(false);
    }
  }

  async function disconnectTtsProvider() {
    if (!ttsProvider) {
      return;
    }

    setIsDisconnectingTts(true);
    try {
      const response = await authFetch(`/settings/tts/${ttsProvider}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to disconnect TTS provider.");
      }

      await initialize();
      onStatus?.({ type: "success", message: `Disconnected ${data.provider}.` });
    } catch (error) {
      onStatus?.({ type: "error", message: error.message || "Failed to disconnect TTS provider." });
    } finally {
      setIsDisconnectingTts(false);
    }
  }

  async function updateDefaultVoiceSource(nextSource) {
    if (!["tts", "llm"].includes(nextSource) || nextSource === defaultVoiceSource) {
      return;
    }

    setIsSavingDefaultVoiceSource(true);
    try {
      const response = await authFetch("/settings/voice-defaults", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: nextSource }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update default voice source.");
      }

      const normalized = data.source === "llm" ? "llm" : "tts";
      setDefaultVoiceSource(normalized);
      onStatus?.({
        type: "success",
        message:
          normalized === "llm"
            ? "Cloud/LLM is now the default voice source. Dedicated TTS default was turned off."
            : "Dedicated TTS is now the default voice source. Cloud/LLM default was turned off.",
      });
    } catch (error) {
      onStatus?.({ type: "error", message: error.message || "Failed to update default voice source." });
    } finally {
      setIsSavingDefaultVoiceSource(false);
    }
  }

  async function saveKokoroAccessToken() {
    if (!kokoroHfToken.trim()) {
      onStatus?.({ type: "error", message: "Hugging Face token is required before saving." });
      return;
    }

    setIsSavingKokoroToken(true);
    try {
      const response = await authFetch("/settings/kokoro", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: kokoroHfToken.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save Kokoro access token.");
      }

      setKokoroHfToken("");
      setKokoroSettings({
        connected: Boolean(data?.connected),
        keyHint: String(data?.keyHint || "").trim(),
        updatedAt: String(data?.updatedAt || "").trim(),
      });
      onStatus?.({ type: "success", message: "Saved Kokoro Hugging Face token." });
    } catch (error) {
      onStatus?.({ type: "error", message: error.message || "Failed to save Kokoro access token." });
    } finally {
      setIsSavingKokoroToken(false);
    }
  }

  async function clearKokoroAccessToken() {
    setIsClearingKokoroToken(true);
    try {
      const response = await authFetch("/settings/kokoro", {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to clear Kokoro access token.");
      }

      setKokoroHfToken("");
      setKokoroSettings({
        connected: Boolean(data?.connected),
        keyHint: String(data?.keyHint || "").trim(),
        updatedAt: String(data?.updatedAt || "").trim(),
      });
      onStatus?.({ type: "success", message: "Cleared Kokoro Hugging Face token." });
    } catch (error) {
      onStatus?.({ type: "error", message: error.message || "Failed to clear Kokoro access token." });
    } finally {
      setIsClearingKokoroToken(false);
    }
  }

  async function detectProvider() {
    if (!apiKey.trim() && !llmEnvInfo.envConfigured) {
      onStatus?.({ type: "error", message: "Enter an API key before auto-detect." });
      return;
    }

    setIsDetecting(true);

    try {
      const response = await authFetch("/settings/llm/detect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Auto-detect failed.");
      }

      setProvider(data.provider || provider);
      setBaseUrl(data.baseUrl || "");
      setAvailableModels(data.models || []);
      setModel(data.model || "");
      onStatus?.({ type: "success", message: `Detected ${data.providerName || data.provider}.` });
    } catch (error) {
      onStatus?.({ type: "error", message: error.message || "Auto-detect failed." });
    } finally {
      setIsDetecting(false);
    }
  }

  async function connectProvider() {
    if (!provider.trim()) {
      onStatus?.({ type: "error", message: "Choose a provider first." });
      return;
    }

    if (!apiKey.trim() && !selectedSavedCredential?.keyHint && !llmEnvInfo.envConfigured) {
      onStatus?.({ type: "error", message: "API key is required. Paste a key or select a provider that has a saved key." });
      return;
    }

    if (provider === "custom" && !baseUrl.trim()) {
      onStatus?.({ type: "error", message: "Base URL is required for custom provider." });
      return;
    }

    setIsConnecting(true);

    try {
      const response = await authFetch("/settings/llm/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider,
          apiKey: apiKey.trim(),
          baseUrl: provider === "custom" ? baseUrl.trim() : undefined,
          model: model || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to connect provider.");
      }

      setConnected(data);
      setSavedProviders(data.savedProviders || []);
      setAvailableModels(data.models || []);
      setModel(data.model || "");
      setApiKey("");
      // Sync provider dropdown to whichever provider actually connected (may
      // differ from requested when the backend auto-corrects based on key prefix).
      if (data.provider) {
        setProvider(data.provider);
        if (data.baseUrl) setBaseUrl(data.baseUrl);
      }
      const corrected = data.autoCorrectedProvider && data.requestedProvider && data.requestedProvider !== data.provider;
      onStatus?.({
        type: "success",
        message: corrected
          ? `Auto-corrected to ${data.providerName || data.provider} (your key is for ${data.providerName || data.provider}, not ${data.requestedProvider}). Connected successfully.`
          : apiKey.trim()
            ? `Connected ${data.providerName || data.provider} and saved the updated key.`
            : `Connected ${data.providerName || data.provider} using the saved key.`,
      });
    } catch (error) {
      onStatus?.({ type: "error", message: error.message || "Failed to connect provider." });
    } finally {
      setIsConnecting(false);
    }
  }

  async function applyModel(nextModel) {
    if (!nextModel) {
      return;
    }

    setModel(nextModel);

    try {
      const response = await authFetch("/settings/llm/model", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: nextModel }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to apply model.");
      }

      setConnected(data);
      setSavedProviders(data.savedProviders || []);
      onStatus?.({ type: "success", message: `Active model switched to ${nextModel}.` });
    } catch (error) {
      onStatus?.({ type: "error", message: error.message || "Failed to apply model." });
    }
  }

  async function disconnectProvider() {
    setIsDisconnecting(true);

    try {
      const response = await authFetch("/settings/llm", {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to disconnect provider.");
      }

      setConnected(null);
      setSavedProviders(data.savedProviders || []);
      setAvailableModels([]);
      setModel("");
      setApiKey("");
      onStatus?.({ type: "success", message: "Disconnected runtime LLM provider. Saved keys remain available for later reconnects." });
    } catch (error) {
      onStatus?.({ type: "error", message: error.message || "Failed to disconnect provider." });
    } finally {
      setIsDisconnecting(false);
    }
  }

  async function removeSavedCredential(savedProvider) {
    try {
      const response = await authFetch("/settings/llm/saved", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: savedProvider.provider, baseUrl: savedProvider.baseUrl }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to remove saved key.");
      }
      setSavedProviders(data.savedProviders || []);
      onStatus?.({ type: "success", message: `Removed saved key for ${savedProvider.provider}.` });
    } catch (error) {
      onStatus?.({ type: "error", message: error.message || "Failed to remove saved key." });
    }
  }

  return (
    <div className="llm-settings">
      <style>{settingsStyles}</style>
      <section className="settings-section">
        <div className="settings-section-header">
          <span className="settings-section-tag">Runtime LLM</span>
          <h3>Chat Provider</h3>
          <p className="settings-section-copy">
            Connect the provider used for chat, memory, and eval requests. If you only need per-character voice tuning, stay in Voice Lab.
          </p>
        </div>

        {llmEnvInfo.envConfigured ? (
          <div className={`llm-connected ${llmEnvInfo.envLocked ? "warn" : "info"}`}>
            {llmEnvInfo.envLocked
              ? `backend/.env is currently locking chat runtime to ${llmEnvInfo.envBaseUrl || "the env provider"}${llmEnvInfo.envModel ? ` (${llmEnvInfo.envModel})` : ""}. Set LLM_LOCK_ENV=false or remove LLM_* env values to switch providers from this panel.`
              : `backend/.env has an LLM fallback configured${llmEnvInfo.envModel ? ` (${llmEnvInfo.envModel})` : ""}, but runtime providers connected from this panel now take priority.`}
          </div>
        ) : null}

        <div className="llm-grid">
          <div className="llm-field">
            <label htmlFor="llm-provider">Provider</label>
            <select
              id="llm-provider"
              value={provider}
              onChange={(event) => setProvider(event.target.value)}
              disabled={isLoading || isConnecting || isDetecting}
            >
              {(providers.length ? providers : fallbackProviders()).map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}
                </option>
              ))}
            </select>
          </div>

          <div className="llm-field">
            <label htmlFor="llm-api-key">API Key</label>
            <input
              id="llm-api-key"
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder={
                selectedSavedCredential?.keyHint
                  ? "Saved key on file. Enter a new key only to replace it."
                  : llmEnvInfo.envConfigured
                    ? "Env key on file (works for its own provider). Paste a new key to use a different one."
                    : "Paste provider key"
              }
              disabled={isLoading || isConnecting}
            />
            {selectedSavedCredential?.keyHint ? (
              <p className="llm-field-helper">Saved key on file: {selectedSavedCredential.keyHint}</p>
            ) : null}
          </div>

          <div className="llm-field">
            <label htmlFor="llm-base-url">Base URL</label>
            <input
              id="llm-base-url"
              type="text"
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
              placeholder={provider === "custom" ? "https://example.com/v1" : "Provider default base URL"}
              disabled={provider !== "custom" || isLoading || isConnecting}
            />
            <p className="llm-field-helper">Only needed for custom OpenAI-compatible providers.</p>
          </div>

          <div className="llm-field">
            <label htmlFor="llm-model">Model</label>
            <select
              id="llm-model"
              value={model}
              onChange={(event) => void applyModel(event.target.value)}
              disabled={!availableModels.length || isConnecting || isLoading}
            >
              <option value="">Choose model</option>
              {availableModels.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {(candidate.name || candidate.id) + (candidate.isFree ? " (free)" : "")}
                </option>
              ))}
            </select>
            {!availableModels.length ? (
              <p className="llm-field-helper">Switching providers clears the previous model list. Click Detect Provider or Connect Provider to load models for the selected provider.</p>
            ) : null}
          </div>
        </div>

        <div className="llm-actions compact">
          <button type="button" className="secondary" onClick={() => void detectProvider()} disabled={isDetecting || isLoading || isConnecting}>
            {isDetecting ? "Detecting..." : "Detect Provider"}
          </button>
          <button type="button" onClick={() => void connectProvider()} disabled={isConnecting || isLoading}>
            {isConnecting ? "Connecting..." : "Connect Provider"}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => void disconnectProvider()}
            disabled={!connected?.connected || isDisconnecting || isLoading}
          >
            {isDisconnecting ? "Disconnecting..." : "Disconnect"}
          </button>
        </div>

        {connected?.connected ? (
          <div className="llm-connected">
            Connected provider: {connected.provider} | Active model: {connected.model || "not selected"} | Key hint: {connected.keyHint}
          </div>
        ) : (
          <div className="llm-connected info">
            No runtime LLM is connected right now. Env fallbacks can still be used server-side if configured.
          </div>
        )}

        {savedProviders.length > 0 ? (
          <div className="llm-field">
            <label>Saved Keys</label>
            {savedProviders.map((sp) => (
              <div key={`${sp.provider}::${sp.baseUrl}`} style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                <span style={{ flex: 1, fontSize: "0.86rem", color: "var(--muted)" }}>
                  {sp.provider}{sp.baseUrl ? ` (${sp.baseUrl})` : ""} — {sp.keyHint}
                </span>
                <button
                  type="button"
                  className="secondary"
                  style={{ padding: "2px 10px", fontSize: "0.78rem" }}
                  onClick={() => void removeSavedCredential(sp)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="settings-section">
        <div className="settings-section-header">
          <span className="settings-section-tag">Global Voice</span>
          <h3>Voice Defaults</h3>
          <p className="settings-section-copy">
            These defaults affect global runtime behavior. Character-specific engine and voice choices still live in Voice Lab.
          </p>
        </div>

        <div className="llm-grid">
          <div className="llm-field">
            <label htmlFor="voice-routing-default">Auto Voice Routing</label>
            <select
              id="voice-routing-default"
              value={defaultVoiceSource}
              onChange={(event) => void updateDefaultVoiceSource(event.target.value)}
              disabled={isSavingDefaultVoiceSource || isLoading}
            >
              <option value="tts">Prefer dedicated TTS first</option>
              <option value="llm">Prefer cloud/LLM first</option>
            </select>
            <p className="llm-field-helper">Applies only when a character uses the <strong>auto</strong> voice engine.</p>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section-header">
          <span className="settings-section-tag">Voice Providers</span>
          <h3>Voice Provider Credentials</h3>
          <p className="settings-section-copy">
            Save ElevenLabs or Cartesia credentials once and reuse them across Voice Lab and chat playback.
          </p>
        </div>

        <div className="llm-grid">
        <div className="llm-field">
          <label htmlFor="tts-provider">TTS Provider</label>
          <select
            id="tts-provider"
            value={ttsProvider}
            onChange={(event) => setTtsProvider(event.target.value)}
            disabled={isLoading || isSavingTts || isDisconnectingTts}
          >
            {ttsProviders.map((candidate) => (
              <option key={candidate.provider} value={candidate.provider}>
                {candidate.name}
              </option>
            ))}
          </select>
        </div>

        <div className="llm-field">
          <label htmlFor="tts-api-key">API Key</label>
          <input
            id="tts-api-key"
            type="password"
            autoComplete="off"
            value={ttsApiKey}
            onChange={(event) => setTtsApiKey(event.target.value)}
            placeholder={selectedTtsProvider?.keyHint ? "Saved key on file. Enter a new one to replace it." : "Paste provider key"}
            disabled={isLoading || isSavingTts}
          />
          {selectedTtsProvider?.keyHint ? (
            <p className="llm-field-helper">Saved key on file: {selectedTtsProvider.keyHint}</p>
          ) : null}
        </div>

        <div className="llm-field">
          <label htmlFor="tts-voice-id">Voice ID</label>
          <select
            id="tts-voice-id"
            value={selectedTtsVoiceOption}
            onChange={(event) => {
              const next = event.target.value;
              if (next === CUSTOM_OPTION) {
                setTtsVoiceId("");
                return;
              }
              setTtsVoiceId(next);
            }}
            disabled={isLoading || isSavingTts || isLoadingTtsProviderOptions}
          >
            <option value="" disabled>
              {isLoadingTtsProviderOptions ? "Loading provider voices..." : "Select a voice"}
            </option>
            {activeTtsBuiltinVoices.map((voice) => (
              <option key={voice.id} value={voice.id}>{voice.label}</option>
            ))}
            {activeTtsCustomVoices.length ? <option value="__my_voices__" disabled>My Voices</option> : null}
            {activeTtsCustomVoices.map((voice) => (
              <option key={voice.id} value={voice.id}>{voice.label}</option>
            ))}
            <option value={CUSTOM_OPTION}>Custom voice id</option>
          </select>
          {selectedTtsVoiceOption === CUSTOM_OPTION ? (
            <input
              type="text"
              value={ttsVoiceId}
              onChange={(event) => setTtsVoiceId(event.target.value)}
              placeholder={selectedTtsProvider?.defaultVoiceId || "Provider default voice"}
              disabled={isLoading || isSavingTts}
            />
          ) : null}
          <p className="llm-field-helper">{activeTtsProviderOptions.error || `Auto-loaded from your ${selectedTtsProvider?.name || "provider"} key when available.`}</p>
        </div>

        <div className="llm-field">
          <label htmlFor="tts-model">Model</label>
          <select
            id="tts-model"
            value={selectedTtsModelOption}
            onChange={(event) => {
              const next = event.target.value;
              if (next === CUSTOM_OPTION) {
                setTtsModel("");
                return;
              }
              setTtsModel(next);
            }}
            disabled={isLoading || isSavingTts || isLoadingTtsProviderOptions}
          >
            <option value="" disabled>
              {isLoadingTtsProviderOptions ? "Loading provider models..." : "Select a model"}
            </option>
            {activeTtsProviderOptions.models.map((entry) => (
              <option key={entry.id} value={entry.id}>{entry.label}</option>
            ))}
            <option value={CUSTOM_OPTION}>Custom model id</option>
          </select>
          {selectedTtsModelOption === CUSTOM_OPTION ? (
            <input
              type="text"
              value={ttsModel}
              onChange={(event) => setTtsModel(event.target.value)}
              placeholder={selectedTtsProvider?.defaultModel || "Provider default model"}
              disabled={isLoading || isSavingTts}
            />
          ) : null}
          <p className="llm-field-helper">{activeTtsProviderOptions.error || `Auto-loaded from your ${selectedTtsProvider?.name || "provider"} key when available.`}</p>
        </div>
        </div>

        <div className="llm-actions compact">
          <button type="button" onClick={() => void saveTtsProvider()} disabled={isSavingTts || isLoading}>
            {isSavingTts ? "Saving..." : "Save Credentials"}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => void disconnectTtsProvider()}
            disabled={!selectedTtsProvider?.connected || isDisconnectingTts || isLoading}
          >
            {isDisconnectingTts ? "Disconnecting..." : "Disconnect Provider"}
          </button>
        </div>

        {selectedTtsProvider ? (
          <div className="llm-connected info">
            {selectedTtsProvider.name}: {selectedTtsProvider.connected ? "connected" : "not connected"}
            {" | "}Pricing: {selectedTtsProvider.pricingNote}
          </div>
        ) : null}
      </section>

      <section className="settings-section">
        <div className="settings-section-header">
          <span className="settings-section-tag">Optional Kokoro</span>
          <h3>Kokoro Access</h3>
          <p className="settings-section-copy">
            Only use this if the server cannot download Kokoro model files anonymously.
          </p>
        </div>

        <div className="llm-grid">
        <div className="llm-field">
          <label htmlFor="kokoro-hf-token">Hugging Face Token</label>
          <input
            id="kokoro-hf-token"
            type="password"
            autoComplete="off"
            value={kokoroHfToken}
            onChange={(event) => setKokoroHfToken(event.target.value)}
            placeholder={kokoroSettings.connected ? "Saved token on file. Enter a new one only to replace it." : "hf_..."}
            disabled={isSavingKokoroToken || isClearingKokoroToken}
          />
          {kokoroSettings.connected ? <p className="llm-field-helper">Saved token on file: {kokoroSettings.keyHint}</p> : null}
        </div>

        <div className="llm-field">
          <label>Kokoro Token Actions</label>
          <div className="llm-actions compact">
            <button type="button" onClick={() => void saveKokoroAccessToken()} disabled={isSavingKokoroToken || isClearingKokoroToken}>
              {isSavingKokoroToken ? "Saving..." : kokoroSettings.connected ? "Update Token" : "Save Token"}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => void clearKokoroAccessToken()}
              disabled={!kokoroSettings.connected || isSavingKokoroToken || isClearingKokoroToken}
            >
              {isClearingKokoroToken ? "Clearing..." : "Clear Token"}
            </button>
          </div>
          <p className="llm-field-helper">Only needed when the server cannot fetch Kokoro model files without authentication.</p>
        </div>
        </div>
      </section>
    </div>
  );
}
