# Merlin — the personal Oracle

**Personalized life weather for your chart.**

Merlin answers one question people actually pay for:

> Is life friction elevated for *me* — and what’s the one move?

Not another generic horoscope. Not a bare birth-chart calculator.  
**Life weather first. Identity underneath.**

- **Live:** [merlin-the-personal-oracle-a2ay.vercel.app](https://merlin-the-personal-oracle-a2ay.vercel.app/)
- **Architecture:** [docs/TWO_PILLARS.md](docs/TWO_PILLARS.md)
- **First users (no ads):** [docs/FIRST_10_USERS.md](docs/FIRST_10_USERS.md)

---

## Product model

| Pillar | User question | What they get |
|--------|---------------|---------------|
| **Weather** (primary sell) | What does *now* feel like for me? | Today brief, friction radar, storm playbook, weekly horizon |
| **Self** (depth / retention) | Who am I in that weather? | Birth chart, wheel, dual MBTI, identity |
| **Oracle** (shared) | What should I do with this? | Chat that sees chart + risk + storms + personality |

```
Birth data
    │
    ▼
Chart engine (Swiss Ephemeris)
    ├── Self → IdentityPacket
    └── Transits / storms / pressure
            │
            ▼
        AtmospherePacket + LifeRiskPacket
            │
            ▼
     Today · Forecast · Oracle
```

---

## What Merlin does

### Weather
- **Today** — day-scoped life weather (intensity, why, one reversible move)
- **Life risk radar** — overall friction 0–100, bullshit-possible flag, confidence, friction-by-day bar chart
- **Storm playbook** — storms by **Social / Work / Financial / Health**, with when · confidence · navigate / avoid steps
- **Date strip** — click a day; same selection links storm list and 7-day timeline (dedupes multi-day spam)
- **Share** — one-tap share/copy for Today and Forecast (product-led growth)

### Self
- Natal chart with **Swiss Ephemeris** precision
- Interactive wheel, placements, aspects
- **Dual MBTI** from the chart (core / mask) as a lens on weather + Oracle tone

### Oracle (Merlin chat)
- Reads live **app sight**: chart, risk packet, storm playbook, transits, dual personality
- Intellectual, direct, conversational voice with hard guardrails (probability ≠ fate, no fabrication)
- Clean drawer UI so you can actually read the reply
- Default LLM: **Groq** (switchable to xAI via env)

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
| LLM | Groq by default (`lib/llm-config.ts`); optional xAI |
| Tests | Jest |

Node **≥ 20**.

---

## Quick start

### Prerequisites
- Node 20+
- Clerk project
- Stripe account (test mode is fine)
- Optional: `GROQ_API_KEY` for Oracle / AI interpretations
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

Oracle chat and interpretation paths use a shared provider:

```env
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile

# Optional fallback
# LLM_PROVIDER=xai
# XAI_API_KEY=...
```

See `.env.example` for the full list (Clerk satellite domain, Stripe prices, atmosphere flags, etc.).

---

## Repo map (high signal)

```
app/
  dashboard/          # Weather + Self experience
  api/                # forecast, atmosphere, storms, oracle-chat, stripe…
components/
  dashboard/          # LifeRiskRadar, Today brief, date strip, share
  astrology/          # Storms playbook, wheel, transits, chat panel
lib/
  atmosphere/         # AtmospherePacket, LifeRiskPacket, life-weather copy
  astrology/          # storms, storm-playbook, planet-style, ephemeris
  llm-config.ts       # Groq/xAI shared client
  oracle-service.ts   # system prompt, app sight, guardrails
docs/
  TWO_PILLARS.md
  FIRST_10_USERS.md
  atmosphere-engine/
  MARKETING_PLAYBOOK.md
```

---

## Development notes

- **Today** is day-scoped; **Forecast** owns the 30d friction radar and storm horizon.
- Client atmosphere fallback is **not** shown while the server atmosphere request is loading (avoids Today flashing Forecast copy).
- Friction scores use a soft ceiling so domains/days land in a believable range (not all 100s).
- After pulling schema changes: `npx prisma db push && npx prisma generate`.

---

## Docs

| Doc | Purpose |
|-----|---------|
| [docs/TWO_PILLARS.md](docs/TWO_PILLARS.md) | Product architecture |
| [docs/atmosphere-engine/](docs/atmosphere-engine/) | Atmosphere engine roadmap & contracts |
| [docs/FIRST_10_USERS.md](docs/FIRST_10_USERS.md) | Zero-ad acquisition sprint |
| [docs/MARKETING_PLAYBOOK.md](docs/MARKETING_PLAYBOOK.md) | Broader marketing angles |
| [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) | Deploy / Stripe / env checklist |

---

## Status

**Beta.** Core weather math, storm playbook, risk radar, and Oracle sight are live and iterating. The chart is the foundation; the **habit** is daily life weather.

Built with the conviction that astrology tools should not lie — precision first, poetry second.

---

## License

Private / proprietary unless otherwise noted. © Voxis Labs.
