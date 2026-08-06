# Merlin — the personal Oracle

**Not a horoscope. A clear read on your day — through the lens of who you are.**

Astrology is the engine. **Clarity is the product.**

Merlin answers one question people actually pay for:

> Is life friction elevated for *me* — and what’s the one move?

Not another generic horoscope. Not a bare birth-chart calculator.  
**Life weather first. Identity underneath. Coach voice always.**

| | |
|--|--|
| **Live** | [merlin-the-personal-oracle-a2ay.vercel.app](https://merlin-the-personal-oracle-a2ay.vercel.app/) |
| **Voice (canonical)** | [docs/MERLIN_VOICE.md](docs/MERLIN_VOICE.md) |
| **Architecture** | [docs/TWO_PILLARS.md](docs/TWO_PILLARS.md) |
| **First users (no ads)** | [docs/FIRST_10_USERS.md](docs/FIRST_10_USERS.md) |
| **Today follow-ups** | [docs/TODAY_FOLLOWUPS.md](docs/TODAY_FOLLOWUPS.md) |

---

## Product model

| Pillar | User question | What they get |
|--------|---------------|---------------|
| **Weather** (primary sell) | What does *now* feel like for me? | Today instrument, friction radar, storm playbook, weekly horizon |
| **Self** (depth / retention) | Who am I in that weather? | Chart, dual MBTI, **edge takeaway**, **default operating system** |
| **Oracle** (shared) | What should I do with this? | Chat that *sees* chart + risk + storms + personality |

```
Birth data
    │
    ▼
Chart engine (Swiss Ephemeris)
    ├── Self → IdentityPacket (OS + edge + placements)
    └── Transits / storms / pressure
            │
            ▼
        AtmospherePacket + LifeRiskPacket
            │
            ▼
     Today · Forecast · Oracle
```

**Voice law:** Merlin explains *you*, not the ephemeris.  
If you strip every astrology word and the copy is useless — rewrite it.  
→ [docs/MERLIN_VOICE.md](docs/MERLIN_VOICE.md)

---

## What Merlin does

### Weather · Today (instrument panel)
- **Greeting** — time-of-day + Clerk first name  
- **Giant tone** — Clear Flow / Caution / Storm + intensity  
- **Domain strip** — Relationships · Career · Money · Energy · Home with ▲ ▬ ▼ + **Risk %**  
- **Weather scale** — Clear → Storm  
- **Today’s move** — one concrete action (never “stay mindful of cosmic energies”)  
- **How it feels** — human weather prose, not sun-sign fluff  
- **Why** — domain friction + transit **pills** (technical as optional depth)  
- **Loading gate** — no fake Caution flash before real day-scoped data lands  
- **Share** — move-first paste for stories / group chats  

### Weather · Forecast
- **Life risk radar** — overall friction 0–100, elevated disruption risk, confidence, friction-by-day bars  
- **Storm playbook** — Social / Work / Financial / Health · when · confidence · navigate / avoid  
- **Date strip** — same day selection for storms + 7-day timeline  

### Self · You
- Natal chart with **Swiss Ephemeris** precision  
- Interactive wheel, placements, aspects  
- **Dual MBTI** (core / mask) from the chart  
- **Your edge** — shareable identity synthesis  
- **Default operating system** — decision · stress · communication · recharge · strengths · blind spots (evergreen; not transit weather)  
- **Active storyline** — dynamic timing (separate from OS)  

### Oracle (Merlin chat)
- Live **app sight**: chart, risk, storms, transits, dual personality  
- **Merlin voice** system block on every turn (headline → human why → move)  
- Guardrails: probability ≠ fate, no fabrication, agency preserved  
- Default LLM: **Groq** (`lib/llm-config.ts`; optional xAI)  

---

## Pricing (beta)

| Plan | Price |
|------|--------|
| Free peek | Limited chart / locked weather depth |
| Monthly | **$9.99/mo** · 7-day free trial |
| Lifetime | **$50** one-time founder pricing |

Stripe + Clerk for auth and billing.

---

## Tech stack

| Layer | Stack |
|-------|--------|
| App | Next.js 15 (App Router), React, TypeScript, Tailwind |
| Chart math | Swiss Ephemeris (`sweph` / `ephe/`), D3 wheel |
| Data | Prisma, Postgres-compatible |
| Auth / pay | Clerk, Stripe |
| LLM | Groq by default; optional xAI |
| Voice | `lib/voice/` + Oracle / copy pipelines |
| Tests | Jest |

Node **≥ 20**.

---

## Quick start

### Prerequisites
- Node 20+  
- Clerk project  
- Stripe account (test mode is fine)  
- Optional: `GROQ_API_KEY` for Oracle / AI  
- Swiss Ephemeris files in `./ephe` (or set `SWEPH_PATH`)  

### Setup

```bash
git clone https://github.com/voxislabs-crypto/Merlin-the-personal-Oracle.git
cd Merlin-the-personal-Oracle

npm install
cp .env.example .env.local
# fill Clerk, Stripe, GROQ_API_KEY, NEXT_PUBLIC_URL

npx prisma db push
npx prisma generate

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

```bash
npm run dev          # Next dev server
npm run build        # prisma generate + production build
npm run start        # production server
npm test             # Jest
npm run test:app     # app tests only (skip backend/)
npm run prisma:studio
```

### LLM configuration

```env
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile

# Optional
# LLM_PROVIDER=xai
# XAI_API_KEY=...
```

See `.env.example` for Clerk, Stripe, atmosphere flags, etc.

---

## Repo map (high signal)

```
app/
  dashboard/              # Weather + Self
  api/                    # atmosphere, forecast, storms, oracle-chat, stripe…
components/
  dashboard/              # Today brief, AtmosphereHeader, LifeDomainStrip,
                          # DefaultOperatingSystem, LifeRiskRadar, share
lib/
  voice/                  # MERLIN_VOICE system block, lint, product claim
  atmosphere/             # LifeRiskPacket, life-weather-copy, domain-strip
  self/                   # IdentityPacket, operating-system, edge-takeaway
  oracle-service.ts       # system prompt + app sight
  llm-config.ts           # Groq / xAI client
docs/
  MERLIN_VOICE.md         # Canonical writing style
  TWO_PILLARS.md
  FIRST_10_USERS.md
  TODAY_FOLLOWUPS.md      # Pill deep-dive, icon nav (deferred)
```

---

## Development notes

- **Today** is day-scoped; **Forecast** owns the multi-day friction radar and storm horizon.  
- Do not show client atmosphere fallback while the server atmosphere request is still pending (avoids tone flash).  
- Friction scores use a soft ceiling (believable ranges, not all 100s).  
- Deterministic Today / edge copy reject horoscope fluff via `lib/voice` + `life-weather-copy`.  
- After schema changes: `npx prisma db push && npx prisma generate`.  

---

## Docs

| Doc | Purpose |
|-----|---------|
| [docs/MERLIN_VOICE.md](docs/MERLIN_VOICE.md) | **Voice & copy law** |
| [docs/TWO_PILLARS.md](docs/TWO_PILLARS.md) | Product architecture |
| [docs/atmosphere-engine/](docs/atmosphere-engine/) | Atmosphere engine contracts |
| [docs/FIRST_10_USERS.md](docs/FIRST_10_USERS.md) | Zero-ad acquisition sprint |
| [docs/TODAY_FOLLOWUPS.md](docs/TODAY_FOLLOWUPS.md) | Deferred Today polish |
| [docs/MARKETING_PLAYBOOK.md](docs/MARKETING_PLAYBOOK.md) | Marketing angles |
| [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) | Deploy / Stripe / env |

---

## Status

**Beta.** Life weather instrument, Self OS + edge, storm playbook, risk radar, and Oracle voice are live and iterating.

The chart is the foundation. The **habit** is daily clarity.  
The **voice** is what makes it Merlin.

---

## License

Private / proprietary unless otherwise noted. © Voxis Labs.
