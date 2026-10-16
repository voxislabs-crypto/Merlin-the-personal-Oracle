# Merlin — functional description

**Audience.** This file describes what the software in this repository actually does, so an outside reader can critique the method. It is not a validation study and it is not a marketing page.

**Claim the product makes.** Merlin turns one birth date, time, and place into a daily “life weather” reading: how pressured the day is, which life areas carry that pressure, and one suggested move, worded through a chart-derived personality lens.

**What is astronomy, and what is not.** Planet longitudes come from the Swiss Ephemeris. Houses, aspects, orbs, personality types, friction scores, storm labels, synastry percents, numerology, and advice sentences are conventions and heuristics written in this codebase. They are not measurements of personality, fate, or clinical risk.

**Live app.** [merlin-the-personal-oracle-chi.vercel.app](https://merlin-the-personal-oracle-chi.vercel.app/)  
**Repo.** [github.com/voxislabs-crypto/Merlin-the-personal-Oracle](https://github.com/voxislabs-crypto/Merlin-the-personal-Oracle)  
**Status.** Beta. Company: Voxis Labs. Voxis the voice-companion product is a different repository and is not required to run Merlin.

Older root files named `*_COMPLETE.md` or `*_SUMMARY.md` are implementation logs. `docs/MBTI_FUSION.md` describes an earlier single-layer weight table. The dual-layer engine in `lib/astrology/mbtiFusion.ts` is the one that runs.

---

## 1. How a session is built

```
Birth date, time, place
        │
        ▼
Geocode place → latitude, longitude, timezone
        │
        ▼
Natal chart (Swiss Ephemeris, tropical zodiac, Placidus houses, 6° default orb)
        │
        ├── Self: dual MBTI, operating system, edge line, shadow name, wheel
        │
        └── Sky now: transits to that natal chart
                │
                ├── Pressure events, storms, life-risk scores, day tone
                ├── Today brief (deterministic sentences, optional LLM polish)
                └── Oracle chat (LLM, with the packets above in the prompt)
```

The dashboard has two pillars.

| Pillar | Tabs | Question it tries to answer |
|--------|------|-----------------------------|
| Weather | Today, Forecast | What does this period feel like for this chart, and what is one move? |
| Self | You, Bonds, Numbers | Who is the chart said to be, and how does that color the weather? |

Oracle chat sits on top of both. It does not calculate the chart. It reads the packets the engines already produced.

Hard product rule in `docs/TWO_PILLARS.md`: Self code does not import life-weather internals. Life weather may read the chart and the identity packet. Personality changes wording and which “inch” is suggested. It does not change ephemeris positions.

---

## 2. Birth data and the natal chart

### 2.1 Geocoding

`lib/astrology/geocoding.ts` and `POST/GET /api/geocoding` turn a place name into coordinates. Chart math uses those coordinates. A wrong city or a missing birth time moves the houses and the Ascendant, and therefore the mask type and many life-area tags.

### 2.2 Chart calculation

`lib/astrology/calculate.ts` (`calculateAll`) and the Swiss Ephemeris runtime (`lib/swiss-ephemeris-core.ts`, `lib/sweph-runtime.ts`, `server-only/engine-sweph.ts`, data files in `ephe/`) compute:

- Julian day from the civil date and time.
- Tropical longitudes for the usual bodies (Sun through Pluto, nodes as coded).
- Placidus houses by default, plus Ascendant and Midheaven.
- Aspects inside a default orb of 6°.

`/api/calculate-birth-chart` and `/api/chart` are the HTTP doors. The client hook is `hooks/useBirthChart.tsx`.

Chart quota (`lib/chart-quota.ts`, `/api/chart-quota`): a free account can store 3 distinct natals (`MAX_CHARTS_PER_ACCOUNT`). Rebuilding one of those natals does not use a new slot. A different birth date does.

### 2.3 What the wheel shows

The You tab draws the natal wheel, placements, and aspects (`components/astrology/WheelVisualization.tsx`, `BirthChart.tsx`, `PlacementsSidebar.tsx`). This layer is a display of the calculated chart. It does not rescore personality by itself.

---

## 3. Personality from the chart

This is the most criticizable layer. The code maps element and modality of planets and angles onto the four MBTI letters. It does not administer the MBTI instrument. It does not cite a published validation sample. Letter votes are hand-set weights.

### 3.1 Two layers

`computeMBTIDual` in `lib/astrology/mbtiFusion.ts` returns two four-letter types:

| Layer | Product name | What the code treats it as | Main inputs |
|-------|----------------|----------------------------|-------------|
| Hardware | Mask | How the person is said to present | Ascendant, Sun, Mars, 1st and 10th house emphasis |
| Firmware | Core | The inner type the rest of the app speaks from | Moon, Ascendant, Sun, Mercury, 12th house, Neptune/Pluto coloring |

`computeMBTI` returns the firmware type as the primary type. Confidence is a chart-clarity score produced by the same function, not an agreement rate with a questionnaire.

### 3.2 Firmware E/I, the letter that used to stick

Core extraversion is a weighted vote, not a sign lock:

- Moon 35 percent, Ascendant 25 percent, Sun 20 percent, Mercury 20 percent.
- Water or earth Moon votes I. Water or earth Ascendant votes I. Fire or air Sun votes E. Fire or air Mercury votes E.
- Introversion wins when the I total is greater than the E total.
- There is no Scorpio hard-lock and no rule that a Leo Sun is E only when Moon and Ascendant agree.

The other three firmware letters use their own thresholds in the same file (element, house, and aspect bumps). Hardware letters use a separate function aimed at the public face.

### 3.3 Retrograde overlay

`computeMBTIDualReads` scores the chart twice. With the overlay off, Core is the base firmware type. With it on, natal retrogrades add small boosts toward I, N, F, and P on **Core only**. Mask stays the base hardware type. The You tab can name both (“base Core” vs “Rx Core”). The preference lives in oracle preferences.

### 3.4 User override

`lib/personality/mbti-override.ts` and `hooks/useMbtiOverride.ts` let the person set a Core type. That paints the displayed Core, the Dimension Map letters, and the type the copy speaks from. It does **not** rerun fusion and it does not move planet positions. Clearing the override restores the calculated Core. Mask stays the chart mask unless a mask override is set.

### 3.5 What the You tab does with the type

| Surface | Function |
|---------|----------|
| Dimension Map | `components/dashboard/MBTIDualBreakdown.tsx` shows E/I · S/N · T/F · J/P for Core and Mask using the **active** type (override applied), not the raw live score. Chart-signal sentences stay on the calculated breakdown when letters disagree. |
| Your edge | `lib/self/edge-takeaway.ts` writes a short Core/Mask contrast meant to be memorable. |
| Default operating system | `lib/self/operating-system.ts` fills six evergreen lines from the four letters: decision, stress, communication, recharge, strengths, blind spots. These do not change when transits change. |
| Shadow name | `components/astrology/YourShadowSection.tsx` looks up `data/mbti-shadows.json` by Core type and picks one of that type’s named archetypes for the session (random among the type’s entries, stable until the type changes). The “What is the Shadow?” note starts open. A tight Mars/Saturn/Pluto hit to Moon or Sun can flag the name as rising or approaching. This is a flavor card, not a Jungian inventory. |
| Blend | `lib/personality/mbti-blend-synthesis.ts` writes a combined sentence when Core and Mask differ. |

`lib/personality/persona-spec.ts` holds per-type voice cards (length, closers, words to avoid). Oracle and some deterministic lines consult them. They are style sheets.

---

## 4. Transits

`lib/astrology/transits.ts` places the current sky with Swiss Ephemeris and compares it to the natal longitudes.

- `getTransitingPositions` — sky at a date.
- `getTransitsForDate` / `getCurrentTransits` — aspects from transiting bodies to natal points, with orb.
- Results are split in the client hook (`hooks/useTransits.tsx`) into significant and approaching lists, plus a predictive packet when the server builds one.

Predictive events (`lib/astrology/predictive-transits.ts`) add timing: building, peaking, releasing, days to peak, a domain tag, and an intensity score. Progressed Moon, lunar timing, profections, and solar arc can be attached as extra timing layers. Those layers are flagged in atmosphere provenance (`progressed-moon`, `annual-profection`, `solar-arc-active`). They are traditional timing techniques, not additional ephemeris planets.

`/api/transits` is the HTTP door.

---

## 5. Life weather scores

Several numbers appear on screen. They are different meters. They are easy to misread as one official probability.

| Meter | What the code treats it as | Typical range |
|-------|----------------------------|---------------|
| Storm Watch / alarm / intensity | How loud the day’s weather tone is | 0–100, tone bands below |
| Friction | Hard-aspect load for the window or the domain | 0–100, passed through a soft ceiling so values do not pile up at 100 |
| Read confidence / chart confidence | How mixed the signals are, not a hit rate | Separate percents on the Today brief |
| Synastry compatibility | A count of inter-chart aspects | 0–100, formula in §8 |

### 5.1 Day intensity

`computeAtmosphere` in `lib/atmosphere/compute.ts` builds an `AtmospherePacket`.

Base intensity (`lib/atmosphere/intensity.ts`), first source that exists:

1. Today’s pressure from predictive events (`computeDaySkyPressure`). If every timed event is later in the horizon, the code does not pretend the window-mean is today.
2. Else the day’s storm, if one is dated today. A numeric storm score is multiplied by 10 and capped at 100. Otherwise severe = 86, moderate = 68, mild = 52.
3. Else the forecast day-rating mapped to a number.
4. Else 55, marked `fallback-neutral`.

Then, in order:

- Progressed-Moon “temperature”: hot ×1.10, warm ×1.05, cool ×0.95, neutral ×1. Signs treated as hot include Scorpio, Capricorn, Aquarius, Virgo; cool includes Taurus, Cancer, Pisces, Sagittarius, Leo. A health emphasis also counts as hot.
- Calibration multiplier, only after at least three feedback samples for the strongest planet (§11).
- Triple-hit amplification when progression, profection, and solar-arc themes align. The lift is modest and then capped (the result is not allowed to sit at 100 just because three techniques agree). Confidence is bumped by 10.
- Pattern-store modifier from learned transit tags (§11).
- Reality check (§5.4) produces a separate **felt** intensity. Chart intensity is kept.

Day rating from intensity, if the forecast did not already set one: ≤45 green, ≤65 yellow, otherwise red.

Tone words (`lib/atmosphere/tone.ts`): the screen says Clear Flow, Caution, or Storm from those bands. Copy is supposed to say “life weather,” not “sky weather.” Internal ids may still say `sky`.

`/api/atmosphere` computes this on the server for charts that are allowed to use the engine. Premium has it on unless `NEXT_PUBLIC_MERLIN_ATMOSPHERE_ENGINE_V1=false`.

### 5.2 Life risk and domain friction

`computeLifeRisk` in `lib/atmosphere/life-risk.ts` turns predictive events and storms into a `LifeRiskPacket` for the Forecast radar.

- Each event and storm becomes a window with a friction number, a phase, and domain tags.
- Overall friction is a weighted blend: top event 0.40, top storm 0.30, day-rating friction 0.15, atmosphere intensity 0.15. If nothing qualifies, the fallback is 42.
- Two hard windows add 3. Three or more add 6. A triple-hit adds 8. An ordinary confluence adds a smaller bump. All of that goes through `softCeilingFriction`.
- `elevatedDisruption` is a boolean derived from level, friction, and confluence. It is a flag, not a probability of a named event.
- Domains (love, career, money, family, health, self) collect the hits tagged to them. The Today strip shows those as Relationships, Career, Money, Energy, and Home, with direction markers. Empty domains are not invented.

Horizon bars (`buildLifeRiskHorizon`) score each day in the window, including quiet days. A day with no scored hits is labeled unscored rather than “calm” by omission.

### 5.3 Storms

`detectWeeklyStorms` / `predictStorms` in `lib/astrology/storms.ts` scan upcoming transits for squares, oppositions, and malefic conjunctions.

Weight, roughly:

- Transiting Saturn or Pluto +3, Uranus or Neptune +2, Mars +2, anything else +1.
- Natal Sun, Moon, or Ascendant +2, Venus or Mercury +1.
- Opposition or square +2. A malefic conjunction +1.

Weight ≥7 is severe, ≥4 moderate, else mild. The playbook (`lib/astrology/storm-playbook.ts`) groups storms into Social, Work, Financial, and Health, and attaches a “when,” a confidence, a navigate line, and an avoid line. Navigation text can be swapped for the chart’s MBTI type via `data/mbti-storm-responses.json`.

`/api/storms` serves this. The Forecast tab and `/dashboard/storm-radar` display it. Free accounts see the surface locked; paid accounts get the full playbook.

### 5.4 Reality check

`lib/atmosphere/reality-check.ts` compares chart intensity with a felt score.

- A check-in supplies mood, stress, and energy. `computeCheckinSentimentScore` reduces them to one number.
- An optional journal line is scored with a small word list (`scoreJournalSentiment`), not a clinical language model.
- Felt intensity is chart intensity times a readiness modifier from that blend.
- The gap picks a guidance branch: chart heavier than the person feels, person heavier than the chart, or roughly aligned. The sentence in `buildRealityGuidance` follows the branch.

Check-ins persist through `/api/checkin` when the account is allowed to persist. The journal opt-in is local until it is sent with atmosphere.

### 5.5 Today brief

`composeTodayOracle` (`lib/atmosphere/today-oracle/`) writes the Today card without an LLM:

1. Pick the lead transit (tightest relevant hit).
2. Rank a theme from `THEME_CATALOG` in `meaning.ts` (for example sudden shift, thin clarity, restraint).
3. Fill four slots: what is happening, why it matters for this chart, how to ride it, and one move.
4. Attach domain, watch-for window, do-not line, and two confidences (chart vs read).
5. If yesterday’s memory has the same sky, the move advances one inch instead of repeating the same homework.
6. Core vs Mask changes the move sentence (`typedStormMove`, `typedSupportMove` in `headline.ts`). Example: an INFP storm move is “One honest sentence, then silence.” An INFJ storm move is “State the feeling before the analysis.” These are templates, not inferences from the person’s words.

`polishTodayBrief` (`personal-ai.ts`, `POST /api/today-brief`) may ask the LLM to sharpen the why and the watch line. The move string is passed as “do not rewrite.” If the model is off, the body is cut off, or the call fails, the deterministic sentences stay. The dashboard waits briefly after the snapshot settles and does not abort the request on a re-render.

Share (`lib/share-weather.ts`) exports a short card for a story or a chat. It uses the same tone and score labels.

---

## 6. Forecast surfaces beyond today

| Function | Where | What it does |
|----------|--------|----------------|
| Weekly forecast | `/api/weekly-forecast`, `hooks/useWeeklyForecast.tsx` | Multi-day theme and whisper text over the transit week. |
| Domain forecast | `/api/domain-forecast` | Per-domain pressure for drill-down. |
| Pressure window | `/api/pressure-window`, `lib/astrology/pressure-engine/` | Explains a window: drivers, domain scores, lay-language reason. Weights live in `weights.ts` (outer planets, Saturn, Uranus, Pluto, exact-aspect bonus, house bonus, progressed Moon, a small lunar-phase term, Mercury retrograde). |
| Returns | `/api/returns`, solar and lunar return modules | Solar-return briefing and lunar-return weather. Traditional return charts, then Merlin copy. |
| Life arc | `lib/astrology/life-arc.ts`, `/api/life-arc` | A biography of standard ages: Jupiter returns, Saturn returns, Uranus opposition, Neptune square, Chiron return, nodal returns, progressed Moon return, plus a Pluto note from the chart. Beats are selected from the person’s current age. This is a timetable of traditional periods, not a prediction that an event occurred. |
| Prophecy | `lib/astrology/prophecy.ts`, `/api/prophecy` | Picks a “blessing” planet (prefers Jupiter, Sun, Venus, Moon) and a “challenge” planet (prefers Saturn, Mars, Moon), hashes them with style, era, and a salt, and fills a verse template (omen or stricter meter). Regenerating changes the salt so the verse changes. Optional LLM polish (`lib/prophecy-polish.ts`) may not change the factual planets. This is a literary layer. |
| Ancient layer | `lib/astrology/ancient-astrology.ts` | Optional traditional phrasing when the user asks for it. It does not replace the ephemeris. |
| Fixed stars, profections, progressions, solar arc | matching files under `lib/astrology/` | Extra traditional techniques. They show up when a surface or the confluence detector asks for them. |

---

## 7. Oracle chat

`POST /api/oracle-chat` streams a reply. `lib/oracle-service.ts` builds the system prompt. The model does not see the raw ephemeris file. It sees a text packet: placements, dual type, life-risk, storms, transits, atmosphere, and recent turns.

### 7.1 What the prompt requires

`lib/voice/merlin-voice.ts` is the voice contract:

- Talk about the person’s situation, not a list of aspects. If a planet is named, the same breath has to say what it feels like.
- Probability language. No guaranteed outcomes.
- Do not invent placements, scores, or life facts that are absent from the packet.
- A closing action has to fit the problem. Writing a note, a journal line, or a 25-minute timer is allowed when the person asked to draft or capture something, or the work itself is a draft. It is not the default resolution of a disagreement.
- If the person says a suggested step would signal agreement they do not hold, the model is told not to assign that step again in private. Allowed shapes include saying the difference once, declining, waiting, asking one question, or making no public move.

### 7.2 Discussion controller

`lib/discussion-controller.ts` classifies the turn.

- A meter question (“how bad is today?”) or a mechanics question is a **reading**. Percents are allowed only if the user has not turned likelihoods off, and a percent has to name its meter (“Storm Watch 85 alarm, friction 71”).
- Anything else, including “elaborate” and “go on,” is a **conversation**. Percents, Storm Watch numbers, and friction scores are withheld from that prompt.
- In both registers the model is told to write paragraphs. A line that is literally `Headline:`, `Why:`, or `Move:` is a failed reply.

On a conversation turn, if the reply still looks like that card, or if it resolves the turn by telling the person to write something down when they did not ask to capture anything, the server asks the model once to rewrite. If the rewrite is still a card, labels and score sentences are stripped.

Prior assistant cards in the history are replaced with a short instruction not to copy them, so one bad card does not teach the next reply.

Identity questions (“how do people misread me,” dual type) take a longer band and are not pinned as a tactic list.

### 7.3 Tactics, forecast chip, level

If the reply contains imperative sentences, those lines are extracted as “moves” under Show moves & timing (`generateTacticalSuggestions`). The server does not invent a move when the reply has none. A small micro-forecast and an arc “level” can be attached for the same drawer. The level is a progression label from saved interaction state, not an astronomical phase.

### 7.4 Quotas and memory

`/api/oracle-quota` limits free daily messages (the product page states 3 per day). Paid tiers are not on that cap.

Short-term chat memory is in the browser (`lib/oracle-chat-memory.ts`). Durable user context (situation, mood, goals, last notes, arc counters) is `UserContextSnapshot` in Prisma via `/api/user-context`.

Daily Oracle (`/api/daily-oracle`, `DailyOraclePulse`) is a separate short pulse for the day, with “That hit” / “Missed me” feedback. It is not the full chat transcript.

Text-to-speech is `POST /api/tts`. Speech-in uses the browser hook `useSpeechRecognition`.

---

## 8. Bonds (synastry)

`generateSynastryReport` in `lib/astrology/synastry.ts`, served by `/api/synastry`.

The other person’s birth data is geocoded and charted the same way. The function finds aspects between the two charts and tags each aspect magnetic, harmonious, or challenging by aspect type.

Compatibility score:

```
min(100, round(magnetic×15 + harmonious×10 − challenging×5 + 50))
```

The narrative is one of three canned paragraphs depending on which tag is more common. Strengths are the first five easy aspects; challenges are the first three hard ones. `quickCompatibilityCheck` calls the score ≥70 “strong,” ≥50 “balanced,” otherwise “needs work.”

This is an aspect counter with a floor of 50 before penalties. It is not a validated couples instrument. The relationship report is not stored as a second user’s account unless that person has their own Merlin account.

---

## 9. Numbers

`lib/numerology/pythagorean.ts` and `lib/numerology/interpretations.ts`. The dashboard tab is under You → More, or the Numbers destination.

Pythagorean chart (A=1 … I=9, J=1 …). Master numbers 11, 22, and 33 are kept. Everything else is digit-summed to a single digit.

| Number | Input |
|--------|--------|
| Life Path | Birth date digits |
| Destiny | Full name, all letters |
| Soul Urge | Vowels in the name |
| Personality | Consonants in the name |
| Personal Year / Month / Day | Birth month and day against the calendar year, then month, then day |

The birth name is stored in the browser under `merlin_numerology_full_name_v1`. Life Path can show on the free tier from the birth date already on the chart. Name numbers and personal cycles are the paid layer.

Interpretations are written strings in `interpretations.ts`, including a “shadow” line per number. A short blend mentions Sun, Moon, Life Path, and Personal Year together. There is no numerology-to-transit physics. Compatibility between two names, pinnacles, and challenges are not shipped (see `docs/numerology/README.md`).

---

## 10. Feedback, calibration, and pattern memory

These loops change later scores. They do not change the natal chart.

| Store | What a signal does |
|-------|--------------------|
| Resonance (`PersonalResonanceRecord`, `GlobalResonanceRecord`, `ClusterResonanceRecord`) | A thumb or “that hit / missed me” updates a weight for an aspect id and a theme. `/api/resonance-feedback` and `/api/oracle-feedback`. |
| Calibration | `/api/calibration/recompute` rebuilds planet multipliers from feedback. Atmosphere applies the strongest planet’s multiplier only after three samples. |
| Atmosphere patterns | `AtmospherePatternRecord` stores a sensitivity score per user and transit-pattern key. `pattern-tags.ts` can nudge the packet when a current transit matches a learned tag. |
| Yesterday’s move | `useTodayMoveMemory` remembers the move and theme so the next same-sky day does not repeat it. |
| Window landed | `YesterdayLandCheck` asks whether yesterday’s call landed. That vote is local weather-window memory (`lib/atmosphere/window-land.ts`). |

None of these estimate a population accuracy rate. A “confidence” field on a resonance row is the row’s own running confidence, starting near 0.5.

---

## 11. Accounts, paywall, and safety

**Auth.** Clerk. Middleware protects `/dashboard` and `/profile`. The marketing home is public.

**Billing.** Stripe checkout and webhook (`/api/stripe/webhook`, `/api/create-checkout-session`). Tier is resolved from Clerk metadata (`lib/subscription-tier.ts`): `free`, `trial`, `monthly`, `lifetime`. A 7-day trial is a trial. Canceled subscriptions fall back to free unless the tier is lifetime.

**What free can do.** A Today sample, the chart, and dual MBTI (`selfPeek`). Oracle is capped. Storm radar, full forecast depth, timeline, and server persistence of check-ins are paid (`premiumInsights`). Development mode can bypass payment (`NEXT_PUBLIC_DEV_MODE=true`).

**Copy safety.** `lib/safety/copy-safety.ts` and `lintMerlinVoice` reject a short list of horoscope clichés and fortune claims (“you will meet,” “money is coming,” “the universe wants”). This is a phrase filter, not a fact check.

**Not a clinician.** The oracle prompt forbids diagnosis, trading instructions, and “you must leave them” legal framing. Crisis language is supposed to point at emergency services. That instruction is only as strong as the model’s compliance.

---

## 12. Data the app stores

Prisma schema (`prisma/schema.prisma`). Local default is SQLite (`DATABASE_URL="file:./dev.db"`). Production on Vercel needs Postgres (Neon); a SQLite file cannot serve a serverless function.

| Model | Holds |
|-------|--------|
| `UserContextSnapshot` | Situation, mood, goals, last notes, tone preset, archetype labels, arc level and xp |
| `ResonanceUser` | Optional MBTI / Enneagram / Big Five json if a path wrote them |
| `PersonalResonanceRecord` and global/cluster twins | Learned weights |
| `ResonanceFeedbackRecord` | One feedback event |
| `UserInteractionEvent` | Pattern-mirror log |
| `AtmospherePatternRecord` | Per-user transit sensitivity |

The natal chart itself is session state in the client, rebuilt from birth data, not a long-lived chart document in this schema. Birth data for the signed-in user is held by the chart session / Clerk profile path the dashboard already uses (`lib` chart-session helpers).

---

## 13. Limits a critique should assume

1. **Ephemeris ≠ interpretation.** Swiss Ephemeris longitudes are the only part that is standard astronomy. House system, orb, and which aspects count are choices.
2. **MBTI-from-chart is an in-house rubric.** Official MBTI is a questionnaire with its own manual. This mapping will disagree with a person’s tested type. The override exists because of that.
3. **Scores are not calibrated probabilities.** Friction 71 does not mean a 71 percent chance of a named outcome. Soft ceilings, fallbacks (intensity 55, friction 42), and fixed weights encode taste.
4. **Personality does not move the sky.** It changes sentences. Two charts under the same transit can get different moves and the same planets.
5. **The Today move is a template.** It is not a plan inferred from the person’s calendar, job, or relationships unless those were typed into user context or the chat.
6. **Chat can still miss.** The rewrite pass catches card-shaped replies and stock “write it down” endings. It does not guarantee the prose is true to the chart.
7. **Synastry and numerology are separate symbol systems** bolted on as extra tabs. They do not feed the ephemeris.
8. **Feedback learning is personal and small-n.** Three thumbs can change a multiplier. That is a product memory, not a study.
9. **Stale docs exist.** Prefer this file, `lib/astrology/mbtiFusion.ts`, `lib/atmosphere/compute.ts`, and `lib/discussion-controller.ts` over `docs/MBTI_FUSION.md` and root `*_COMPLETE.md` logs.
10. **No outcome dataset is shipped** that would let a reader compute hit rate, calibration, or discrimination of the friction score against later events.

---

## 14. Where to read the code

| Concern | Path |
|---------|------|
| Natal math | `lib/astrology/calculate.ts`, `lib/swiss-ephemeris-core.ts` |
| Dual MBTI | `lib/astrology/mbtiFusion.ts` |
| Override and dimension-map display | `lib/personality/mbti-override.ts` |
| Identity packet, OS, edge | `lib/self/` |
| Transits | `lib/astrology/transits.ts`, `lib/astrology/predictive-transits.ts` |
| Storms | `lib/astrology/storms.ts`, `lib/astrology/storm-playbook.ts` |
| Atmosphere packet | `lib/atmosphere/compute.ts`, `intensity.ts`, `life-risk.ts`, `reality-check.ts` |
| Today copy | `lib/atmosphere/today-oracle/` |
| Dual-type move lines | `lib/self/dual-layer-maps.ts` |
| Chat prompt and tactics | `lib/oracle-service.ts`, `lib/discussion-controller.ts`, `app/api/oracle-chat/route.ts` |
| Voice rules | `lib/voice/merlin-voice.ts`, `docs/MERLIN_VOICE.md` |
| Synastry | `lib/astrology/synastry.ts` |
| Numerology | `lib/numerology/` |
| Prophecy and life arc | `lib/astrology/prophecy.ts`, `lib/astrology/life-arc.ts` |
| Dashboard shell | `app/dashboard/page.tsx` |
| Tests that lock behavior | `tests/atmosphere/`, `tests/lib/`, `tests/mbtiFusion.test.ts` |

---

## 15. Stack and how to run it

| Layer | Choice |
|-------|--------|
| App | Next.js 15 App Router, React 18, TypeScript, Tailwind |
| Chart | Swiss Ephemeris (`sweph`) and `ephe/*.se1` |
| Data | Prisma. SQLite locally. Postgres in production |
| Auth / pay | Clerk, Stripe |
| LLM | Groq by default, model `openai/gpt-oss-120b` (`lib/llm-config.ts`). `LLM_PROVIDER=xai` switches to xAI |
| Tests | Jest (`npm test`) |
| Host | Vercel |
| Runtime | Node ≥ 20. API routes are the backend. There is no separate Express server |

```bash
npm install
cp .env.example .env.local
npx prisma db push
npx prisma generate
npm run dev
```

Minimum local env:

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

`NEXT_PUBLIC_DEV_MODE=true` bypasses the paywall. Swiss Ephemeris files ship in `ephe/`. Override the directory with `SWEPH_PATH` if needed.

```bash
npm run dev
npm test
npm run lint
npm run build
```

Beta prices stated in the product UI: free peek; monthly $9.99 with a 7-day trial; lifetime $50 against a $299 list. Stripe test card `4242 4242 4242 4242`.

Further operational notes: `VERCEL_DEPLOYMENT.md`, `LAUNCH_CHECKLIST.md`, `.env.example`, `docs/TWO_PILLARS.md`, `docs/atmosphere-engine/README.md`.
