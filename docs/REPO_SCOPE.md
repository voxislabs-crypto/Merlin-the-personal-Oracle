# Merlin repository scope

**This repo is Merlin only** — personalized life weather (Next.js).

## What belongs here

| Path | Role |
|------|------|
| `app/` | App Router pages + **Next API routes** (the Merlin backend) |
| `lib/` | Atmosphere, astrology, Oracle, Self, voice contract, Stripe/Clerk helpers |
| `components/` | Dashboard + marketing UI |
| `hooks/` | Client data hooks |
| `prisma/` | Merlin persistence |
| `tests/` | Jest |
| `ephe/` | Swiss Ephemeris |
| `public/` | Static assets |
| `shared/schema.ts` | MBTI type config imported by Merlin |

Production deploy target: **Vercel** (or any Next host).  
Runtime “backend” = **`app/api/*`**, not an Express folder.

## What does **not** belong here

**Voxis** — voice companion / persona forge / TTS-STT stack:

- Express app historically named `voxis-backend`
- Vite chat UI
- Kokoro / Piper / OpenVoice / MeloTTS / SFX / prosody

Canonical location: **`X:\Voxis`** (own repo).

Do **not** re-merge `backend/`, `frontend/`, `MeloTTS/`, `OpenVoice/`, or `ecosystem.config.cjs` into Merlin. They are listed in `.gitignore` as a guardrail.

## Why they were mixed

Historical monorepo merge. Voxis and Merlin share a company brand (Voxis Labs / Clerk domains) but are separate products and data models:

| | Merlin | Voxis |
|--|--------|--------|
| App | Next 15 | Express + Vite |
| Data | Prisma + Clerk metadata | SQLite `voxis.sqlite` + personas |
| Deploy | Vercel | PM2 / VPS |
| Product | Life weather | Voice companions |

## Separation completed

Voxis sources were removed from this repository. Continue Voxis work only under `X:\Voxis` (or its remote).
