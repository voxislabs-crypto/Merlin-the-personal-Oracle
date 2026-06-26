# Voxis Recent Implementation Snapshot + Connection Matrix

Date: 2026-04-13
Branch: NeuronMap
Window reviewed: last several days (primarily Apr 11-13)

## What We Implemented Recently

### 1) Mood runtime and emotional-state safeguards
- Runtime-configurable mood inertia, responsiveness, per-turn delta cap, and recovery curves.
- Stronger emotional-state stabilization logic (intensity floors, carryover turns, counter-signal handling).
- Hostility spike behavior that can bypass smoothing for immediate response.
- Detailed mood diagnostics path for debugging.

Primary files:
- backend/services/moodEngine.js
- backend/controllers/chatController.js
- backend/models/settingsModel.js
- backend/controllers/settingsController.js
- backend/routes/settingsRoutes.js
- backend/tests/moodEngine.test.js

### 2) Expression sampling and runtime controls
- Added bounded expression sampling service and tests.
- Added settings persistence and settings API for expression sampling.
- Added chat pipeline integration so sampled expressions appear in streamed debug payloads.

Primary files:
- backend/services/expressionSampler.js
- backend/controllers/chatController.js
- backend/models/settingsModel.js
- backend/controllers/settingsController.js
- backend/routes/settingsRoutes.js
- backend/tests/expressionSampler.test.js

### 3) Preference memory evolution and conflict handling
- Preference extraction gating and cooldown behavior.
- Preference conflict resolution and lifecycle decay logic.
- Preference-driven mood deltas applied during mood stepping.

Primary files:
- backend/services/preferencesService.js
- backend/models/preferencesModel.js
- backend/controllers/chatController.js
- backend/db/db.js
- backend/tests/preferencesModel.test.js
- backend/tests/preferencesService.test.js

### 4) Voice/TTS and chat UX improvements
- Quick Voice panel improvements (engine-aware selection, autoplay fix).
- Per-message replay button under assistant bubbles.
- SFX preload when SFX tokens are detected in assistant output.
- Kokoro timeout hardening and fallback robustness updates.

Primary files:
- frontend/src/components/ChatWindow.jsx
- frontend/src/components/VoiceLab.jsx
- frontend/src/components/LlmSettingsPanel.jsx
- backend/services/ttsService.js
- backend/controllers/ttsController.js

### 5) Settings UX wiring for new runtime controls
- New UI panels for Mood Runtime Settings and Expression Sampling Settings.
- Panels mounted in app and connected to settings endpoints.

Primary files:
- frontend/src/components/MoodRuntimeSettings.jsx
- frontend/src/components/ExpressionSamplingSettings.jsx
- frontend/src/App.jsx

---

## Quick Connection Matrix

Legend:
- Connected = route is mounted and actively consumed by frontend/chat runtime.
- Partially connected = implemented and mounted, but only backend-internal use or partial UI coverage.
- Not connected (UI) = route exists but no current frontend caller found.

| Capability | Backend Route / Entry | Backend Logic | Frontend Caller | Status | Notes |
|---|---|---|---|---|---|
| Chat streaming + mood runtime application | POST /chat | chatController + moodEngine + settingsModel | frontend/src/App.jsx, frontend/src/components/ChatWindow.jsx | Connected | Mood runtime config is pulled in chat pipeline and applied per turn. |
| Mood runtime settings API | GET/PUT /settings/mood-runtime | settingsController + settingsModel | frontend/src/components/MoodRuntimeSettings.jsx | Connected | UI read/write confirmed. |
| Expression sampling settings API | GET/PUT /settings/expression-sampling | settingsController + settingsModel | frontend/src/components/ExpressionSamplingSettings.jsx | Connected | UI read/write confirmed. |
| Expression sampling in live chat | POST /chat path | chatController + expressionSampler | Debug surfaces in chat flow | Connected | Sampling results included in streamed debug data. |
| Persona preference influence in chat | POST /chat path | chatController + preferencesService + preferencesModel | Indirect via chat runtime | Connected | No dedicated UI editor flow required for runtime effect. |
| Persona preference CRUD | /personality/:id/preferences + /personality-preference/:prefId | preferencesController | No caller found in frontend/src | Not connected (UI) | APIs exist and are mounted. |
| Personality memory journal | /personality/:id/memory + backfill | memoryController | frontend/src/components/MemoryJournal.jsx | Connected | Read and backfill calls present. |
| User memory CRUD | /users/:id/memory | userMemoryController | No caller found in frontend/src | Not connected (UI) | Mounted in user routes, no active UI usage detected. |
| Harness run | POST /personality/:id/harness | harnessController | frontend/src/components/HarnessReport.jsx | Connected | End-to-end usage present. |
| Performance stream | POST /personality/:id/performance | performanceController | frontend/src/components/PerformancePlayer.jsx | Connected | NDJSON stream path used by player. |
| Performance parse | POST /personality/:id/performance/parse | performanceController | No caller found in frontend/src | Not connected (UI) | Route exists, no current frontend call detected. |
| Prosody template extraction | POST /personality/:id/prosody-template | prosodyController | PersonaEditor, PersonalityForm, VoiceLab | Connected | Multiple callers in frontend. |
| Voice sample extraction/confirm/audio | /personality/:id/voice-samples* | voiceSampleController | VoiceSampleSelector and related flows | Connected | Extraction + confirm + preview paths are wired. |
| TTS provider options | GET /tts/provider-options | ttsController | VoiceLab + LlmSettingsPanel | Connected | Used for provider-specific options in UI. |
| TTS provider status list | GET /tts/providers | ttsController | No caller found in frontend/src | Not connected (UI) | Mounted, but not currently consumed. |
| SFX audio fetch | GET /api/sfx/audio/:name | sfxController | ChatWindow + PerformancePlayer | Connected | SFX preload and playback calls present. |
| Loop manifest/audio | GET /api/loops/manifest, GET /api/loops/audio/:filename | loopController | PerformancePlayer | Connected | Runtime loop playback is wired. |
| Loop admin endpoints | GET /api/loops/status, POST /api/loops/refresh* | loopController | No caller found in frontend/src | Not connected (UI) | Intended for admin/manual operations. |
| Auth/session bootstrap | GET /me and user profile routes | userController | frontend/src/App.jsx + ApiDiagnosticsPanel | Connected | Core auth bootstrap and profile fetch/update are used. |

---

## High-Confidence Takeaway

The newest emotional runtime work is not just stored in settings; it is actively consumed in live chat.

Most advanced backend capabilities are mounted. The remaining gaps are mostly frontend surfaces for a handful of existing admin or specialist endpoints (preferences CRUD UI, user memory CRUD UI, performance parse UI, loop admin controls, provider status display).

## Suggested Next UI Wiring Targets (if you want to close gaps fast)
- Add a Persona Preferences editor panel that calls the existing preferences CRUD routes.
- Add a User Memory manager surface under profile settings for users/:id/memory.
- Expose loop cache status/refresh in a small admin diagnostics card.
- Add a lightweight Performance Parse action in PerformancePlayer.
- Add provider-status badges in VoiceLab or LLM/TTS settings.
