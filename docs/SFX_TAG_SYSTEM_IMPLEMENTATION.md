# SFX Tag System Implementation Plan

## Overview
Replace hardcoded "rick" name check with a flexible tag-based SFX system that allows any persona to have burps, giggles, stutters, and other vocal effects that play synchronized with TTS audio.

## Architecture Changes

### 1. Personality Model Extension
Add `sfxTags` array to `vocalMannerisms`:
```javascript
vocalMannerisms: {
  frequency: 0.15,        // Overall frequency of vocal tics
  items: [],              // Legacy vocal mannerisms
  sfxTags: ["burp", "giggle"],  // NEW: SFX tags that trigger audio effects
  sfxFrequency: 0.25,     // NEW: Per-utterance chance (0-1)
  sfxPlacement: "random", // NEW: "start", "random", "end", "throughout"
}
```

### 2. SFX Catalog Extension
Extend `sfxCacheService.js` SFX_CATALOG:
```javascript
const SFX_CATALOG = {
  burp: { query: "belch burp", durationMin: 0.3, durationMax: 4.0 },
  giggle: { query: "giggle laugh chuckle", durationMin: 0.5, durationMax: 3.0 },
  stutter: { query: "stutter hesitation", durationMin: 0.2, durationMax: 1.0 },
  cough: { query: "cough clear throat", durationMin: 0.3, durationMax: 2.0 },
  sigh: { query: "sigh exhale", durationMin: 0.5, durationMax: 3.0 },
};
```

### 3. Enhanced Speech Director
Modify `speechDirector.js` to:
- Support `[SFX:tag]` markers at any position in text
- Return `sfxEvents` array with timing information:
  ```javascript
  sfxEvents: [
    { tag: "burp", position: "before", ms: 0 },
    { tag: "giggle", position: "after", wordIndex: 5 },
  ]
  ```

### 4. Synchronized Playback
Frontend changes in `ChatWindow.jsx`:
- Pre-fetch SFX audio buffers when TTS response received
- Use `AudioContext` to schedule SFX playback relative to TTS progress
- Support sentence-level timing: inject burps between sentences

## Implementation Phases

### Phase 1: Database & Model (Backend)
- [ ] Add `sfxTags`, `sfxFrequency`, `sfxPlacement` to schema
- [ ] Update `normalizeRow` to parse these fields
- [ ] Migration script for existing personas (optional: retroactive tagging)

### Phase 2: Speech Director (Backend)
- [ ] Replace hardcoded "rick" check with tag-based system
- [ ] Add `[SFX:tag]` marker injection based on frequency/placement settings
- [ ] Return `sfxEvents` array with timing metadata

### Phase 3: TTS Service Integration (Backend)
- [ ] Parse `[SFX:tag]` markers in `prepareSpeechSynthesis`
- [ ] Return `sfxTimeline` with timing relative to speech segments
- [ ] HTTP header `X-Voxis-Tts-Sfx-Timeline` with JSON timing data

### Phase 4: Frontend Playback
- [ ] Preload SFX audio buffers when TTS requested
- [ ] Schedule SFX playback using `AudioContext.currentTime` relative to TTS
- [ ] Handle sentence-level injection points

### Phase 5: Persona Editor UI
- [ ] Add SFX Tags multi-select in PersonalityForm
- [ ] Frequency slider (0-100%)
- [ ] Placement dropdown (start/random/end/throughout)

## Migration Path

For existing Rick personas, add migration:
```javascript
function migratePersona(persona) {
  if (persona.name?.toLowerCase().includes('rick')) {
    return {
      ...persona,
      vocalMannerisms: {
        ...persona.vocalMannerisms,
        sfxTags: ['burp'],
        sfxFrequency: 0.28,
        sfxPlacement: 'start',
      }
    };
  }
  return persona;
}
```

## Benefits

1. **Flexibility**: Any persona can have any SFX combination
2. **Composability**: Multiple tags per persona (burp + giggle + stutter)
3. **Timing control**: Play at start, end, or randomly throughout speech
4. **Content-aware**: Frequency adjustable per persona
5. **Extensible**: Easy to add new SFX types to catalog