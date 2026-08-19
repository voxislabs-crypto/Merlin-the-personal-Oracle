# Merlin — the personal Oracle

**Not a horoscope. A clear read on your day — through the lens of who you are.**

Astrology is the engine. **Clarity is the product.**

Merlin answers one question people actually pay for:

> Is life friction elevated for *me* — and what’s the one move?

Not another generic sun-sign blurb. Not a bare birth-chart calculator.  
**Life weather first. Identity underneath. Coach voice always.**

| | |
|--|--|
| **Live app** | [merlin-the-personal-oracle-chi.vercel.app](https://merlin-the-personal-oracle-chi.vercel.app/) |
| **Repo** | [github.com/voxislabs-crypto/Merlin-the-personal-Oracle](https://github.com/voxislabs-crypto/Merlin-the-personal-Oracle) |
| **Status** | Beta |
| **Company** | Voxis Labs |

---

## Start here

| If you are… | Read this |
|-------------|-----------|
| **Trying Merlin as a person** | [What Merlin is](#what-merlin-is) → [How to use it](#how-to-use-it) → [Pricing](#pricing) |
| **Running it on your machine** | [Quick start](#quick-start) |
| **Shipping a change** | [Product model](#product-model) · [Voice law](#voice-law) · [Development notes](#development-notes) |
| **Lost in the docs folder** | [Which docs actually matter](#which-docs-actually-matter) |

Voxis (voice companion / personas / TTS) is a **separate product** in its own repo. It is not required to run or deploy Merlin. See [docs/REPO_SCOPE.md](docs/REPO_SCOPE.md).

---

## What Merlin is

Most astrology apps give you a chart, then sprinkle a horoscope. Merlin is the inverse.

1. You enter birth date, time, and place **once**.
2. Merlin builds your **Self** map (natal chart, dual MBTI, operating system).
3. Every day it reads **your** transits — not a sun-sign column — and tells you:
   - how today feels (Clear Flow / Caution / Storm)
   - where friction is elevated (relationships, career, money, energy, home)
   - **one concrete move**

If you strip every astrology word and the copy is useless, it isn’t Merlin. Rewrite it.

---

## How to use it

Open the [live app](https://merlin-the-personal-oracle-chi.vercel.app/), create an account, and enter your birth data. After a chart exists, the dashboard lands on **Today**.

```
WEATHER                              SELF
Today  |  Forecast                   You  |  Bonds  |  Numbers
```

### Weather · Today (the daily habit)

- Greeting with your name and time of day
- Giant tone: **Clear Flow / Caution / Storm** plus intensity
- Domain strip: Relationships · Career · Money · Energy · Home with ▲ ▬ ▼ and risk %
- **Today’s move** — one reversible action, never “stay mindful of cosmic energies”
- How it feels, in human weather prose
- Why — domain friction + optional transit pills for people who want the sky catalog
- Share button for stories / group chats

### Weather · Forecast

- Life risk radar (friction 0–100, disruption risk, confidence, friction-by-day bars)
- Storm playbook by domain (Social / Work / Financial / Health) — when, confidence, navigate vs avoid
- Date strip shared by storms and the 7-day horizon

### Self · You

- Natal chart with **Swiss Ephemeris** precision
- Interactive wheel, placements, aspects
- **Dual MBTI** (core / mask) derived from the chart
- **Your edge** — shareable identity synthesis
- **Default operating system** — how you decide, stress, communicate, recharge; strengths and blind spots (evergreen, not transit weather)
- Active storyline — dynamic timing, separate from the OS

### Self · Bonds / Numbers

- **Bonds** — synastry / relationship space
- **Numbers** — Pythagorean life path, destiny, soul urge, personality, and personal year cycles

### Oracle (Merlin chat)

Ask Merlin about today or about who you are. Chat sees the chart, risk, storms, transits, and dual personality. Every reply follows the same shape: **headline → human why → move**.

Guardrails: probability is not fate, no fabrication, agency stays with you.

Merlin is also a **PWA** — install it on your phone for a native-like daily check.

---

## Product model

| Pillar | User question | What they get |
|--------|---------------|---------------|
| **Weather** (what we sell) | What does *now* feel like for me? | Today instrument, friction radar, storm playbook, weekly horizon |
| **Self** (depth / retention) | Who am I in that weather? | Chart, dual MBTI, edge takeaway, default operating system |
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

Hard rules:

1. Self never imports life-weather internals.
2. Life weather may depend on the chart and IdentityPacket — weather is personal.
3. MBTI is computed on Self, then used as **tone**, not as weather physics.
4. User-facing copy says **life weather / Weather**, never “sky weather” (internal ids may still say `sky`).

Full architecture: [docs/TWO_PILLARS.md](docs/TWO_PILLARS.md).

---

## Voice law

Merlin writes like an insightful coach, not an astrologer.

| Never | Always |
|-------|--------|
| Mystical / “dear seeker” | Human and composed |
| Vague uplift | Specific lived stakes |
| Absolute predictions | Probability + agency |
| Aspect soup in the hero | One memorable line + one move |

Every major card has three layers:

1. **Headline** — one sentence people still hold five minutes later
2. **Why** — the emotional / life pattern, not the sky catalog
3. **Move** — something actionable and specific

Canonical guide: [docs/MERLIN_VOICE.md](docs/MERLIN_VOICE.md)  
Enforced in code: `lib/voice/` and `lib/safety/copy-safety.ts`.

---

## Pricing

Beta founder pricing.

| Plan | What you get | Price |
|------|----------------|-------|
| **Free peek** | Up to 3 chart builds, dual MBTI, a Today sample, 3 Oracle messages / day | $0 |
| **Monthly** | Full weather + Self + unlimited Oracle | **$9.99/mo** · 7-day free trial |
| **Lifetime** | Same as monthly, one-time | **$50** (listed $299) |

Auth is **Clerk**. Billing is **Stripe**.

---

## Tech stack

| Layer | Stack |
|-------|--------|
| App | Next.js 15 (App Router), React 18, TypeScript, Tailwind |
| Chart math | Swiss Ephemeris (`sweph` + files in `ephe/`), D3 wheel |
| Data | Prisma · SQLite locally · Postgres (Neon) in production |
| Auth / pay | Clerk, Stripe |
| LLM | Groq by default (`llama-3.3-70b-versatile`); optional xAI |
| Tests | Jest |
| Host | Vercel |

Node **≥ 20**. Runtime backend is `app/api/*` — there is no separate Express server.

---

## Quick start

### Prerequisites

- Node 20+
- A [Clerk](https://dashboard.clerk.com) project
- A [Stripe](https://dashboard.stripe.com) account (test mode is fine)
- Optional: `GROQ_API_KEY` for Oracle / AI copy
- Swiss Ephemeris files in `./ephe` (already in the repo; override with `SWEPH_PATH`)

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

Minimum for local development:

```env
NEXT_PUBLIC_URL=http://localhost:3000
NEXT_PUBLIC_DEV_MODE=true
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
DATABASE_URL="file:./dev.db"
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_...
```

`NEXT_PUBLIC_DEV_MODE=true` bypasses payment so you can exercise the dashboard without Stripe.

See `.env.example` for Clerk satellite/custom domain, Stripe price IDs, atmosphere flags, Resend, and analytics.

### Scripts

```bash
npm run dev              # Next.js dev server
npm run build            # prisma generate + production build
npm run start            # production server
npm test                 # Jest
npm run test:watch
npm run lint
npm run prisma:studio
npx prisma db push       # after schema changes
npx prisma generate
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

---

## What’s in the repo

```
app/                 Next App Router — pages + API routes
  dashboard/         Weather + Self (Today, Forecast, You, Bonds, Numbers)
  api/               atmosphere, forecast, storms, oracle-chat, stripe, chart…
  checkout*/         Stripe checkout
  sign-in, sign-up   Clerk hosted auth
components/
  dashboard/         Today brief, domain strip, OS, LifeRiskRadar, share, shells
  astrology/         Wheel, placements, chart chrome
  sections/          Marketing landing (hero, features, pricing, FAQ)
lib/
  atmosphere/        LifeRiskPacket, life-weather copy, domain strip
  self/              IdentityPacket, operating-system, edge-takeaway
  astrology/         Chart math, transits, storms, MBTI fusion
  voice/             MERLIN_VOICE system block, lint, product claim
  oracle-*.ts        Oracle prompt + app sight
  llm-config.ts      Groq / xAI client
  safety/            Copy safety
  numerology/        Pythagorean numbers + cycles
prisma/              Merlin data models (SQLite local, Postgres in prod)
hooks/               Client data hooks
tests/               Jest (api, atmosphere, astrology, lib, components)
ephe/                Swiss Ephemeris .se1 files
public/              PWA, logo, OG image
shared/schema.ts     Shared MBTI type config
docs/                Canonical product + engine docs (see below)
```

---

## Which docs actually matter

This repo has a lot of markdown. Most of the root-level `*_COMPLETE.md` / `*_SUMMARY.md` files are **historical implementation logs**. Treat them as archaeology, not current spec.

### Canonical (read these)

| Doc | What it is |
|-----|------------|
| [docs/MERLIN_VOICE.md](docs/MERLIN_VOICE.md) | **Voice & copy law** — every sentence in the product |
| [docs/TWO_PILLARS.md](docs/TWO_PILLARS.md) | Product architecture: Weather vs Self vs Oracle |
| [docs/REPO_SCOPE.md](docs/REPO_SCOPE.md) | Merlin vs Voxis boundary |
| [docs/atmosphere-engine/](docs/atmosphere-engine/) | Atmosphere engine contracts, roadmap, pattern store |
| [docs/numerology/README.md](docs/numerology/README.md) | Numbers tab |
| [docs/MBTI_FUSION.md](docs/MBTI_FUSION.md) | How dual MBTI is computed from the chart |
| [docs/rework/03-safe-copy-guidelines.md](docs/rework/03-safe-copy-guidelines.md) | Safety language (probability ≠ fate) |

### Product / growth

| Doc | What it is |
|-----|------------|
| [docs/FIRST_10_USERS.md](docs/FIRST_10_USERS.md) | Zero-ad acquisition sprint |
| [docs/MARKETING_PLAYBOOK.md](docs/MARKETING_PLAYBOOK.md) | Marketing angles and share formats |
| [docs/TODAY_FOLLOWUPS.md](docs/TODAY_FOLLOWUPS.md) | Deferred Today polish |

### Deploy / ops

| Doc | What it is |
|-----|------------|
| [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) | Deploy to Vercel + Clerk/Stripe wiring |
| [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) | Env, Stripe products, test-card flow |
| [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) | Production hardening notes |
| `.env.example` | Every environment variable, with comments |

### Ignore unless you are hunting history

Root files like `INDEX.md`, `IMPLEMENTATION_SUMMARY.md`, `MBTI_IMPLEMENTATION_COMPLETE.md`, `GROK_OPTIMIZATION_COMPLETE.md`, `QUICK_REFERENCE.md`, and similar `*_COMPLETE` / `*_SUMMARY` notes. Several of them still mention old ports (`localhost:5000`) or an older “birth chart calculator” product.

`docs/README.md` is an older library-style overview. This file is the source of truth.

---

## Development notes

- **Today** is day-scoped to the user’s local calendar. **Forecast** owns the multi-day friction radar and storm horizon.
- Do not show client atmosphere fallback while the server atmosphere request is still pending (avoids a fake Caution flash).
- Friction scores use a soft ceiling — believable ranges, not walls of 100s.
- Deterministic Today / edge copy rejects horoscope fluff via `lib/voice` and `lib/atmosphere` life-weather copy.
- After Prisma schema changes: `npx prisma db push && npx prisma generate`.
- Local default database is SQLite (`DATABASE_URL="file:./dev.db"`). **SQLite will not work on Vercel** (read-only filesystem). Production needs Postgres (Neon or similar) and `provider = "postgresql"` in `prisma/schema.prisma`.
- Protected routes (`/dashboard`, `/profile`, …) go through Clerk middleware. The marketing homepage and most APIs are public; Oracle chat is currently public for testing.
- Atmosphere engine v1 is **on by default for premium**. Rollback: `NEXT_PUBLIC_MERLIN_ATMOSPHERE_ENGINE_V1=false`.
- Stripe test card: `4242 4242 4242 4242`, any future expiry, any CVC.

When reviewing a PR, ask:

1. Does this answer “what does life feel like now?” → **Weather**
2. Does this answer “who is this person?” → **Self**
3. Is it auth, ephemeris, billing, or oracle transport? → **Shared**
4. Did Self start importing atmosphere internals? → reject
5. Did user-facing copy say “sky weather” or lead with aspect soup? → rewrite

---

## Deploy

Production host: **Vercel**.

1. Push `main` to GitHub (Vercel auto-deploys).
2. Set environment variables in the Vercel project (Clerk live keys, Stripe live keys + webhook secret, `NEXT_PUBLIC_URL`, `DATABASE_URL` pointing at Postgres, `GROQ_API_KEY`).
3. In Clerk: allowed origins / redirect URLs must match the Vercel URL. Sign-in `/sign-in`, sign-up `/sign-up`, after-auth `/dashboard`. Keep satellite mode **off** until a custom domain is fully wired.
4. Stripe webhook endpoint: `https://<your-host>/api/stripe/webhook`.

Step-by-step: [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) and [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md).

---

## FAQ (short)

**Do I need an exact birth time?**  
Best results yes — houses and rising depend on it. No time? Noon or an estimate still gives solid planets; house-based nuance is softer.

**Is this fortune-telling?**  
No. Forecasts are interpretive pressure reads with confidence. Probability ≠ fate. Merlin never claims medical or financial certainty.

**Is my data sold?**  
No. Birth data is treated as sensitive personal context. See [Privacy](https://merlin-the-personal-oracle-chi.vercel.app/privacy).

**Does it work on a phone?**  
Yes. Install the PWA from the browser.

---

## License

Private / proprietary unless otherwise noted. © Voxis Labs.
