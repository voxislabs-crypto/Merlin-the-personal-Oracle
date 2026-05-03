# Personality Forge UI Migration Plan

## Objective
Migrate the Personality Forge UI from Voxis 2 to current Voxis, replacing the current AI guide tab (VoxisTab.jsx) while retaining existing chat/preview functionality and VoxisThinking component.

## Current Status
- ✅ PersonalityForge.jsx fully analyzed (1833 lines)
- ✅ VoxisTab.jsx reviewed (current AI guide tab)
- ✅ Backend compatibility confirmed (no changes needed)
- 🔄 In progress: Creating simplified merge

---

## Features Being Migrated (Phase 1 - Now)

### Visual UI Components
- **Waveform Canvas Animation** - Animated waveform visualization with intensity-based rendering
- **Orbital Trait Array** - Circular trait visualization with selectable orbital elements
- **Stats Grid** - Personality stats (confidence, dominance, obsession, deviance, loyalty) with progress bars
- **Refinement Panel** - Left panel showing trait refinement options when traits are selected
- **Forge Header/Footer** - Styling, status bar, and layout structure
- **CSS Styling** - All visual styles (gradients, animations, glass-morphism effects)

### Functional Components (from VoxisTab)
- **Chat Interface** - Message history, input area, send functionality
- **Persona Preview** - Preview panel showing extracted persona data
- **Action Buttons** - Generate Preview, Apply Changes, Create Persona, Reset
- **Mode Selector** - Create vs Modify mode toggle
- **Behavior Explanation** - "Why?" button to explain persona behavior
- **VoxisThinking Integration** - AI thinking phase animation overlay

### Backend Integration
- `/api/voxis/chat` - Chat endpoint for conversational persona creation
- `/extract-persona` - Persona extraction from conversation
- `/personality` - CRUD operations for personalities
- `/explain-behavior` - Behavior explanation endpoint

---

## Features Being Skipped (Phase 1 - Future Consideration)

### TTS (Text-to-Speech) Features
**Functions skipped:**
- `speakText()` - TTS playback function
- `stopSpeaking()` - Stop TTS playback
- `ensureAnalyser()` - Web Audio API analyser setup

**State variables skipped:**
- `autoSpeak` - Auto-speak toggle state
- `isSpeaking` - Speaking status
- `ttsBusy` - TTS processing status
- `ttsAbortRef` - Abort controller for TTS requests
- `audioRef` - Audio element reference
- `audioUrlRef` - Audio blob URL reference
- `audioCtxRef` - Web Audio Context reference
- `analyserRef` - Audio analyser reference
- `analyserDataRef` - Analyser data array
- `audioLevelRef` - Audio level for visualization
- `levelRafRef` - RequestAnimationFrame ID for audio level loop
- `replyTextRef` - Text being spoken for keyword matching
- `lastSpokenIndexRef` - Last spoken character index

**UI elements skipped:**
- Echo speak toggle button (Voice/Muted controls)
- Speaking status indicators in persona echo

**Backend endpoint:**
- `/personality/${id}/tts` - TTS generation endpoint (already exists in backend, just not used)

**Future integration notes:**
- Backend TTS endpoint already exists and is compatible
- Web Audio API is browser-native, no additional dependencies
- Can be added by restoring the skipped functions and state
- Requires adding `speakText()` calls after chat responses if auto-speak is enabled

---

### Speech Recognition Features
**Functions skipped:**
- `startListening()` - Web Speech Recognition API setup
- Recognition event handlers (onresult, onerror, onend, onstart)

**State variables skipped:**
- `recognitionRef` - SpeechRecognition instance reference
- `listening` - Listening status (keeping visual state only)

**UI elements:**
- Mic button will remain but won't trigger speech recognition (visual only)
- Listening animation will remain but won't be activated by actual speech

**Future integration notes:**
- Web Speech Recognition API is browser-native (Chrome/Safari support)
- Requires browser permission for microphone access
- Can be added by restoring `startListening()` function
- Consider adding fallback for browsers without Speech Recognition support

---

### Audio-Driven Trait Flares
**Feature skipped:**
- Real-time audio analysis linking spoken words to trait keywords
- Trait flares in orbital array triggered by TTS playback
- Keyword matching during audio playback

**State variables skipped:**
- `traitKeywordsRef` - Compiled regex patterns for trait keywords
- `flaresRef` - Timestamps for trait flare animations

**Future integration notes:**
- Requires Web Audio analyser to be active
- Requires TTS to be playing to trigger flares
- Can be added after TTS integration is complete

---

### Persona Echo (Chat Response Display)
**Feature partially skipped:**
- The persona echo panel (showing chat responses in character) will be replaced by VoxisTab's chat interface
- VoxisTab's message history serves the same purpose
- Keeping VoxisTab's chat for consistency with existing workflow

**State variables skipped:**
- `echo` - Persona response object
- `echoStreaming` - Streaming response status
- `echoAbortRef` - Abort controller for chat requests

**UI elements skipped:**
- `.persona-echo` panel
- Echo dismiss button
- Echo speak controls

**Rationale:**
- VoxisTab already has a functional chat interface
- Avoids duplication of chat UI
- Maintains consistency with current UX

---

## Future Integration Roadmap

### Phase 2: Speech Recognition (Medium Priority)
1. Restore `startListening()` function
2. Wire up mic button to trigger speech recognition
3. Add browser compatibility checks
4. Test microphone permission flow
5. Integrate recognized text into chat input

### Phase 3: TTS Playback (Medium Priority)
1. Restore `speakText()` function
2. Restore audio-related state variables
3. Add auto-speak toggle in UI
4. Wire up TTS after chat responses
5. Test with existing `/personality/:id/tts` endpoint

### Phase 4: Audio Visualization (Low Priority)
1. Restore Web Audio analyser setup
2. Restore audio level loop
3. Connect waveform to real audio levels
4. Add trait keyword flare system
5. Test keyword matching during TTS playback

---

## Migration Approach

### Step 1: Create Merged Component
- Start with VoxisTab.jsx as base
- Add PersonalityForge styling (CSS)
- Add Waveform component (visual only)
- Add OrbitalArray component
- Add Stats grid
- Add Refinement panel
- Integrate VoxisThinking component

### Step 2: Integrate Functionality
- Connect VoxisTab chat to PersonalityForge UI
- Keep existing VoxisTab action buttons
- Map personality traits to orbital array
- Compute stats from traits/coreValues
- Handle trait selection and refinement

### Step 3: Testing
- Test chat functionality
- Test persona creation/preview
- Test trait visualization
- Test stats computation
- Verify VoxisThinking integration

### Step 4: Deployment
- Replace VoxisTab.jsx with merged component
- Update any imports/references
- Run full test suite
- Commit to feature branch

---

## Risk Assessment

### Low Risk
- Visual UI migration (no backend changes)
- Chat functionality (already tested in VoxisTab)
- Stats computation (pure function, deterministic)

### Medium Risk
- Trait selection/refinement logic (needs testing)
- Orbital array positioning (responsive behavior)
- CSS conflicts with existing styles

### Mitigation
- Test in development environment first
- Keep VoxisTab.jsx as backup (rename to VoxisTab.old.jsx)
- Run full test suite before deployment
- Rollback plan ready if issues arise

---

## Estimated Effort

- Phase 1 (Current): 2-3 hours
- Phase 2 (Speech Recognition): 1-2 hours
- Phase 3 (TTS): 1-2 hours
- Phase 4 (Audio Visualization): 1-2 hours

Total for complete feature parity: 5-9 hours additional
