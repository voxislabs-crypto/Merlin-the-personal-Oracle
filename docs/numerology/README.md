# Pythagorean Numerology — Merlin Integration

Numerology adds a **numerical/vibrational layer** on top of Merlin’s astrology, personality typing, transits, and atmosphere engine — synastry between planetary positions and life path numbers, timing via personal year cycles, name compatibility, and more.

## Status

| Area | Status |
|------|--------|
| Core calculators (Life Path, Destiny, Soul Urge, Personality) | ✅ MVP in `lib/numerology/` |
| Personal Year / Month / Day cycles | ✅ MVP |
| Dashboard **Numerology** tab | ✅ MVP |
| Astro + numerology blend copy | ✅ MVP |
| Compatibility calculator | 🔲 Planned |
| Name suggester / business name | 🔲 Planned |
| AI narrative reports | 🔲 Planned |
| Karmic lessons / Pinnacles / Challenges | 🔲 Advanced |

## Dashboard

Open **Numerology** from the main dashboard tabs. The **Numerical Blueprint** panel uses:

- Birth date from the existing chart
- Full birth name (stored locally in `merlin_numerology_full_name_v1`)
- Premium unlocks name-based numbers and personal cycles (free tier shows Life Path)

## Core features (roadmap)

### MVP (shipped)

- Life Path, Destiny, Soul Urge, Personality numbers
- Personal Year / Month / Day cycles
- Astrology blend snippet (Sun/Moon + Life Path + Personal Year)
- Ask Merlin integration

### Next

- **Compatibility** — numerology + synastry charts
- **Daily insights** — blend number vibrations with active transits
- **Name analysis** — business / baby name suggester
- **Advanced cycles** — Pinnacles, Challenges, karmic lessons, missing numbers

## Technical implementation

### Backend (`lib/numerology/`)

- `pythagorean.ts` — letter map, reduction, core + cycle calculators
- `interpretations.ts` — classical meanings + astro blend helper
- Master numbers **11, 22, 33** preserved during reduction

### Frontend

- `components/dashboard/panels/NumerologyTabPanel.tsx`
- Mystical card layout aligned with Merlin dashboard aesthetic

### AI enhancement (planned)

Feed calculated numbers + astro data into the Oracle backend for narratives, e.g. *“As a Life Path 7 with Scorpio Moon…”*

## Development roadmap

1. **Prototype** — core calculators ✅
2. **Integrate** — dashboard tab + birth data ✅
3. **UI polish** — sacred geometry / wheels (optional)
4. **Advanced** — compatibility, AI narratives, premium reports
5. **Beta** — user feedback, monetized deep-dive reports

## Value for Merlin

- **Differentiation** — few apps blend Western/Vedic astrology + Pythagorean numerology + MBTI + stateful Oracle this deeply
- **Engagement** — shareable “number + transit” insights, recurring daily hooks
- **Monetization** — tiered numerology reports, Oracle sessions
- **Thematic fit** — numbers as vibrational language alongside cosmic order

## Edge cases

- Privacy: names stored locally by default; handle sensitively in logs
- Accuracy disclaimers on all outputs (insight / entertainment)
- Name variants: legal vs nickname (user-editable full name field)
- Leap years / time zones: cycles use calendar date from birth data

## Related modules

- `lib/astrology/` — transits, returns, synastry
- `lib/atmosphere/` — felt intensity + reality check
- `hooks/useSubscriptionTier` — premium gating