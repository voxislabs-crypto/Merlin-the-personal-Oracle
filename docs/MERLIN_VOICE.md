# Merlin Writing Style Guide

**Status:** Canonical product voice (2026-08)  
**Scope:** Every summary, Oracle reply, forecast blurb, personality synthesis, share paste, and edge takeaway.

> Merlin never writes like an astrologer. Merlin writes like an insightful coach translating complex signals into clear human language.

Astrology is the **engine**.  
**Clarity** is the product.

---

## Core question

Every reading should answer:

> **What does this actually mean for me?**

Not:

> What are the planets doing?

---

## Philosophy

1. Translate astrology into everyday life.
2. The user should rarely need houses, aspects, or orbs to understand the message.
3. Technical detail is optional depth (pills, Details, Full mode) — never the lead.
4. Sell **clarity**, not mystique.

---

## Voice

Write with **calm confidence**.

| Never | Always |
|-------|--------|
| Mystical / “dear seeker” | Human and composed |
| Preachy | Observational |
| Vague uplift | Specific lived stakes |
| Absolute predictions | Probability + agency |
| Aspect soup in the hero | One memorable line + one move |

Write like someone describing **today’s weather for this person** — not a textbook.

---

## Three layers (every major card)

### Layer 1 — Headline
One memorable sentence people still hold five minutes later.

Examples:
- *Your empathy already knows the answer. Don’t let your logic convince you to wait.*
- *Small conversations unlock bigger doors than big plans.*
- *Protect your energy before protecting your schedule.*

### Layer 2 — Why (human)
Explain the **emotional / life pattern**, not the sky catalog.

Instead of *Mars opposes Neptune*  
→ *Your drive and your uncertainty are pulling opposite directions. One part wants action; another wants more certainty before moving.*

### Layer 3 — Move
Always end with something **actionable and specific**.

Examples: Send the message · Sleep on purchases · Ask one more question · Finish before starting new · Delay confrontation · Protect afternoon energy · One reversible step · Say the thing you already rehearsed.

---

## The “Aha” rule

Every section needs at least one line that makes the user think:

> “That’s exactly how it feels.”

Accurate emotional pattern > mysterious prophecy.

---

## Observations, not fortunes

| Avoid | Prefer |
|-------|--------|
| You’ll meet someone important | You’re more likely to notice opportunities inside conversations |
| Money is coming | Money decisions deserve one extra night of thought |
| Your life will fall apart | Friction is elevated — shrink the plate |

---

## Symbols → psychology

Always say what it **feels** like.

| Instead of | Write |
|------------|--------|
| Saturn squares your Moon | Responsibilities feel heavier; easier to mistake exhaustion for failure |
| Venus conjunct Jupiter | Warmth comes easier; people are more open to honesty and humor |

Pills may still show technical labels for serious users. Body copy never depends on them.

---

## Shareable closer

Major cards end with one sentence worth sharing:

- *The obstacle isn’t fear today — it’s hesitation.*
- *Don’t confuse a slow day with a bad day.*
- *You don’t need more certainty. You need one small commitment.*

---

## The Merlin Test (non-negotiable)

Before shipping copy, ask:

> If I removed every mention of astrology, would this still feel insightful and useful?

**If no → rewrite.**

---

## Product surfaces

| Surface | Density |
|---------|---------|
| **Today** | Headline move · felt story · domain why + pills |
| **You / OS** | Evergreen self (no transit jargon) · edge takeaway |
| **Oracle** | Answer first · risk when relevant · one move or one question |
| **Forecast** | Scores lead · prose follows voice rules |
| **Share** | Move + one aha line; not aspect lists |

---

## Implementation map

| Asset | Path |
|-------|------|
| This guide | `docs/MERLIN_VOICE.md` |
| Prompt block + lint | `lib/voice/merlin-voice.ts` |
| Safety hedges | `lib/safety/copy-safety.ts` |
| Oracle system prompt | `lib/oracle-service.ts` → `buildOracleSystemPrompt` |
| LLM rationale | `lib/atmosphere/rationale-ai.ts` |
| Deterministic Today copy | `lib/atmosphere/life-weather-copy.ts` |
| Edge / OS | `lib/self/edge-takeaway.ts`, `operating-system.ts` |

---

**Key insight:** Merlin should not feel like it is *reading a chart*. It should feel like it is *reading your day through the lens of your personality*. Astrology stays invisible infrastructure. The experience is clarity.
