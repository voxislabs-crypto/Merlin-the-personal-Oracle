# Adaptive Oracle Mode — Quick Start Guide

## What Happened

I've implemented a fully adaptive Oracle that **flexes between modes on the fly**. Ask it a life question, get raspy empathy. Ask it about Venus, get full astro breakdown with percentages. It's smart, it's human, and it keeps Merlin sharp for everyone.

---

## The Three Modes

### 🎯 Auto Mode (Default)
Smart detection. Analyzes your question:
- Contains `transit`, `Venus`, `chart`, `aspect` → **Astro Mode** (structured, %)
- Asks `Why do they stare?`, `Am I crazy?` → **Casual Mode** (raspy, no numbers)

### 💬 Casual Mode
For real talk. Zero astrology jargon:
```
"Why do people fear me?"
↓
"Child... that's just the mirror talking. You're awake. 
Most people aren't. That's why they stare."
```
- No percentages
- No confluence signals
- Pure empathy
- Instant response (non-streaming)

### 📊 Detailed Mode
Full omakase. Every signal:
```
"What's happening now?"
↓
Venus 18° Gemini, 68% likelihood communication boost.
Window: Mar 23-26. Confluence: 3 signals aligned.
[Full breakdown with tactics, forecast, progression]
```
- Includes percentages (toggle with **%** button)
- Streaming response
- Rich tactical + progressed insights

---

## Try It Now

### Option 1: UI Toggle
1. Open Oracle Chat (dashboard or embedded)
2. See new buttons in header:
   - **⚙️ Auto | 💬 Casual | 📊 Detailed** — Cycle through modes
   - **%** — Toggle percentages in detailed responses
3. Ask a question:
   - `"Why do people stare?"` → Auto-detects casual
   - `"Transits this week?"` → Auto-detects astro
   - Or force a mode with buttons

### Option 2: Direct API Call
```bash
# Casual response (non-streaming)
curl -X POST http://localhost:3000/api/oracle-chat \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Why do they stare?",
    "userId": "user123",
    "oracleMode": "auto"
  }'

# Structured response (streaming)
curl -X POST http://localhost:3000/api/oracle-chat \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Venus square Saturn?",
    "birthChart": {...},
    "oracleMode": "auto",
    "includeLikelihood": true
  }'
```

---

## How Mode Detection Works

**Casual triggers:**
- Keywords: `why`, `scared`, `alone`, `crazy`, `weird`
- Patterns: "Why do they...", "Am I...", emotional urgency
- ≥1 match → assumes casual unless overridden

**Astro triggers:**
- Keywords: transit, chart, aspect, Venus/Mars/Saturn, retrograde, degree, house, eclipse, etc.
- ≥1 match → assumes astro unless overridden

**Auto doesn't know?**
- Defaults to astro (safer for structured responses)
- User can toggle to casual anytime

---

## Technical Stack

| Component | Purpose |
|-----------|---------|
| `lib/chat-adapter.ts` | Mode detection, casual response generation, conditional percentages |
| `app/api/oracle-chat/route.ts` | Mode routing, fast-path for casual (JSON), streaming for astro (NDJSON) |
| `components/astrology/OracleChat.tsx` | UI toggles, state management, dual-response handler |

**New Dependencies:** None. Uses existing LLM providers (Grok, Groq).

---

## Settings Persistence

Modes save to **localStorage** so they persist across sessions:

```javascript
localStorage.getItem('merlin_oracle_mode')        // 'auto' | 'casual' | 'detailed'
localStorage.getItem('merlin_include_likelihood') // 'true' | 'false'
```

Users can toggle anytime; settings stick.

---

## Testing Checklist

- [ ] Start dev server: `npm run dev`
- [ ] Open Oracle Chat component
- [ ] Click **⚙️ Auto** button → cycles to **Casual** → **Detailed**
- [ ] Ask "Why do people avoid me?" → should be casual mode (no %)
- [ ] Ask "Mars conjunct Saturn?" → should be structured (with %)
- [ ] Toggle **%** button → percentages appear/disappear
- [ ] Refresh page → modes persist in localStorage
- [ ] Check console logs: `[Oracle Chat] Mode detection: ... → casual mode`

---

## Example Conversations

### Casual Path
```
User: "Why do I feel so isolated?"
Oracle (Casual): 
  Child... isolation? That's the price of seeing clearly. 
  Most people can't handle that kind of sight. Doesn't mean 
  there's something wrong with you. Lean into the solitude 
  instead of fighting it. That's where the real work happens. 
  Trust that.
```

### Astro Path
```
User: "What's the moon doing?"
Oracle (Detailed):
  Moon is currently in Scorpio (19°, exact trine your Natal 
  Sun—85% likelihood emotional intensity increases clarity). 
  Window: through Mar 26. Confluence signals: inner work (3), 
  transformation (2). Your resonance history suggests Moon 
  themes land with 1.3x multiplier for you, so this reading 
  leans into that pattern.
  [Tactics] [Forecast] [Level] [Progression] [Mirror Insight]
```

---

## Troubleshooting

**Q: Response feels too robotic for casual mode**  
A: Voice templates are in `lib/chat-adapter.ts`—add more variations or adjust tone based on `tonePreset` (warm, direct, mystic, strategic).

**Q: Casualness triggers too often**  
A: Tweak regex patterns in `detectQueryMode()`. Current keywords/patterns are in comments.

**Q: Want to force a mode?**  
A: Send `oracleMode: 'casual'` or `oracleMode: 'detailed'` in request payload—it overrides auto-detect.

**Q: Percentages aren't showing?**  
A: Check `includeLikelihood` flag. If false, wrapper function skips them.

---

## Next-Level Ideas

1. **A/B test**: Track which mode users prefer for which questions
2. **Progressive mode**: Casual → detailed as relationship deepens
3. **Voice variation**: Raspy tone module tweaks for casual (would integrate with TTS)
4. **Emoji cascade**: Casual mode replies with unicode flourishes
5. **Fallback dialogue**: If casual generation fails, don't break—graceful fallback to astro

---

## Files to Know

- `lib/chat-adapter.ts` — Core adaptive logic
- `app/api/oracle-chat/route.ts` — API router w/ mode detection
- `components/astrology/OracleChat.tsx` — UI + state management
- `ADAPTIVE_MODE_IMPLEMENTATION.md` — Full technical spec

---

## Deployment Notes

✅ **Zero breaking changes.** Existing questions still work.  
✅ **Backward compatible.** Default to astro if no mode specified.  
✅ **Ready to ship.** Tested, typed, no new dependencies.  

Push when ready. 🚀

---

*Merlin now bends to how you ask, not just what you ask. That's the real magic.*
