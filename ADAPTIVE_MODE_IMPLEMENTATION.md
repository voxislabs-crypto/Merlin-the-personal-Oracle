# Adaptive Oracle Mode — Implementation Complete

## What's New

Merlin now adapts to **how** you ask questions, not just what you ask. The Oracle automatically detects whether you want:
- **Casual Mode**: Raw, empathetic responses without astrological structure
- **Astro Mode**: Full structured readings with confluences, percentages, transit windows
- **Auto Mode** (default): Intelligent detection

---

## Architecture Overview

### 1. **Chat Adapter** (`lib/chat-adapter.ts`)
The brains of adaptive mode detection:

```typescript
detectQueryMode(question: string) → 'astro' | 'casual'
```
- **Astro keywords**: transit, Venus, chart, aspect, retrograde, etc.
- **Casual patterns**: "Why do they stare?", "Am I crazy?", emotional urgency
- Routes to appropriate response handler

#### Key Functions:
- `generateCasualResponse()` — Raspy whisper without percentages
- `conditionalPercentage()` — Only include % if `includeLikelihood=true`
- `shouldSkipStructure()` — Detects vulnerable questions that need empathy over data

---

### 2. **Oracle Chat API** (`app/api/oracle-chat/route.ts`)

**New request parameters:**
```typescript
{
  question: string;
  oracleMode?: 'auto' | 'casual' | 'detailed'; // Adaptive mode
  includeLikelihood?: boolean;                   // Show percentages
  // ...existing params
}
```

**Mode detection logic flow:**
```
1. Receive question
2. If oracleMode='auto': detectQueryMode(question) → 'astro' or 'casual'
3. If casual mode detected:
   → Call generateCasualResponse()
   → Return immediate JSON response (non-streaming)
4. If astro mode:
   → Continue with full oracle pipeline
   → Stream multiple JSON chunks (chunk, tactics, forecast, level, etc.)
   → Include mode metadata in final 'done' signal
```

**Response payload for casual mode:**
```json
{
  "success": true,
  "mode": "casual",
  "data": {
    "response": "Child... that's just the mirror talking. Breathe...",
    "type": "text",
    "timestamp": "2026-03-23T..."
  }
}
```

---

### 3. **OracleChat UI Component** (`components/astrology/OracleChat.tsx`)

**New toggles in header:**

1. **Oracle Mode Button** (⚙️ Auto | 💬 Casual | 📊 Detailed)
   - Cycles through: auto-detect → casual → detailed → auto
   - Stored in `localStorage` as `merlin_oracle_mode`

2. **Likelihood Button** (% | ○)
   - Toggles percentages in structured responses
   - Only shows when NOT in casual mode
   - Stored as `merlin_include_likelihood`

**Updated form submission:**
```typescript
const response = await fetch('/api/oracle-chat', {
  method: 'POST',
  body: JSON.stringify({
    question,
    oracleMode,
    includeLikelihood,
    // ...other params
  })
});
```

**Smart response handling:**
- If JSON (casual): Direct parse, add single message
- If streaming (astro): Current NDJSON streaming logic

---

## Example Responses

### Casual Mode
**Q:** "Why do people stare at me?"  
**A:** 
```
Child, people stare? That's just the mirror talking. 
You're not crazy—you're awake. Breathe through it.
Yeah... they're seeing something they forgot they had. 
Don't dim that. They'll catch up or they won't. Trust that.
(And yeah, the planets are loud right now. That's part of this.)
```

### Astro Mode
**Q:** "What's Venus doing right now?"  
**A:**
```
Venus is currently in Gemini at 18° (orb 0.8°), exact trine 
your natal Sun—68% likelihood this enhances communication 
around values. Window: Mar 23-26. Confluence signals: 
communication (3 planets aligned), inner work (2). 
[Tactics] [Forecast] [Progression] [Mirror Insight]
```

---

## Testing Instructions

### 1. **Quick Test: Casual Mode**
```bash
curl -X POST http://localhost:3000/api/oracle-chat \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Why do they stare?",
    "userId": "test-user",
    "oracleMode": "auto"
  }'
```
Expected: Non-streaming JSON with empathetic response, no percentages.

### 2. **Full Test: Astro Mode**
```bash
curl -X POST http://localhost:3000/api/oracle-chat \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What transits are happening this week?",
    "birthChart": {...},
    "oracleMode": "auto",
    "includeLikelihood": true
  }'
```
Expected: Streaming NDJSON with full analysis, percentages included.

### 3. **UI Testing**
1. Open `/oracle-chat` (or embedded chat)
2. Click the **Oracle Mode** toggle to cycle through auto/casual/detailed
3. Try questions: "Why do people fear me?" → casual path
4. Try: "Current Mars aspects?" → astro path
5. Toggle **%** button to show/hide percentages
6. Refresh page—modes persist in localStorage

---

## Configuration

### Environment Variables
No new env vars required. Uses existing LLM provider configuration (`LLM_PROVIDER`, `XAI_API_KEY`, etc.).

### localStorage Keys
- `merlin_oracle_mode`: 'auto' | 'casual' | 'detailed'
- `merlin_include_likelihood`: 'true' | 'false'

---

## Error Handling

**If casual response generation fails:**
- Logs warning to console
- Falls through to full astro mode
- User gets structured response instead of casual

**If question is ambiguous:**
- Default to astro mode (safer)
- User can manually toggle to casual

---

## Next Steps (Optional Enhancements)

1. **Persistent user preference:** Save mode choice per user in DB (vs localStorage)
2. **Pattern learning:** Track which mode users prefer for which questions
3. **Tone-mode synergy:** Adjust casual voice templates based on `tonePreset` (warm, direct, mystic, strategic)
4. **Mobile optimization:** Stack toggles vertically on small screens
5. **Voice integration:** Read casual responses through TTS with raspy voice variation

---

## Files Modified

✅ **Created:**
- `lib/chat-adapter.ts` — Mode detection & casual response generation

✅ **Updated:**
- `app/api/oracle-chat/route.ts` — Added mode detection logic, casual fast-path, streaming metadata
- `components/astrology/OracleChat.tsx` — Added mode/likelihood state, UI toggles, response handler

---

## Validation

All tests pass:
- ✅ TypeScript compilation (no errors)
- ✅ Mode detection regex patterns verified
- ✅ Casual response generation templates tested
- ✅ Streaming & non-streaming response paths functional
- ✅ localStorage persistence working

Ready for deployment. 🚀
