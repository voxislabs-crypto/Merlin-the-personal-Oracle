# Soul Layer - Complete Implementation

The soul layer transforms Merlin from a birth chart calculator into a storyteller. This document outlines all implemented features.

---

## ✨ What We Built

### 1. **Natal Voice Layer** 
*Location: `/lib/soul/natal-voice.ts`*

**What it does:**  
Generates narrative, mythic interpretations of birth chart placements. Instead of "Sun in Leo at 15°", you get:

> "You burn bright, but only after the forge. People feel your warmth — then flinch when they see the steel underneath."

**Key functions:**
- `generateSoulReading(chartData)` — Full soul narrative
- `getSoulWhisper(planet, sign)` — Single-line insights

**Features:**
- Planet-sign voice templates (Sun, Moon, Mercury, Venus, Mars)
- Aspect integration (Saturn square Sun, Moon-Pluto, etc.)
- House system context (12 life areas)
- "Trial by Fire" detection for heavy charts

---

### 2. **House System Toggle**
*Location: `/lib/astrology/house-systems.ts`*

**What it does:**  
Allows users to switch between Placidus, Whole Sign, and Equal house systems and recalculate chart positions.

**Key functions:**
- `recomputeHouses(chartData, houseSystem)` — Recalculate all houses
- `reassignPlanetHouses(chartData, newHouses)` — Update planet house placements
- `calculateWholeSignHouses(ascendant)` — Whole sign system
- `calculateEqualHouses(ascendant)` — Equal house system
- `calculatePlacidusHouses(asc, mc, lat)` — Placidus (simplified)

**Usage:**
```typescript
import { recomputeHouses, reassignPlanetHouses } from '@/lib/astrology/house-systems';

const newHouses = recomputeHouses(chartData, "Whole Sign");
const updatedChart = reassignPlanetHouses(chartData, newHouses);
```

---

### 3. **Progressed Chart Engine**
*Location: `/lib/astrology/progressions.ts`*

**What it does:**  
Calculates secondary progressions (1 day after birth = 1 year of life). Shows how your chart evolves over time.

**Key functions:**
- `calculateProgressedChart(chartData, targetDate)` — Full progression
- `getProgressionInYears(chartData, years)` — Shortcut for N years
- `checkUpcomingMoonChange(chartData, years)` — Predict Moon sign changes

**Example output:**
> "In 5 years, your progressed Moon enters Pisces. Your intuition floods, and boundaries dissolve into empathy."

**API endpoint:** `POST /api/progressed-chart`

---

### 4. **Synastry Stub**
*Location: `/lib/astrology/synastry.ts`*

**What it does:**  
Compares two birth charts to analyze relationship dynamics.

**Key functions:**
- `generateSynastryReport(chart1, chart2, person1, person2)` — Full report
- `quickCompatibilityCheck(chart1, chart2)` — Fast yes/no compatibility

**Features:**
- Aspect detection between charts (Venus-Mars, Moon-Moon, etc.)
- Chemistry scoring (magnetic, harmonious, challenging, neutral)
- Element balance analysis
- Compatibility percentage (0-100)
- Strengths & challenges list

**Example interpretation:**
> "Their Venus conjunct your Moon — emotional gravity. You feel seen by them in ways you didn't know you needed."

**API endpoint:** `POST /api/synastry`

---

### 5. **Daily Whisper Tone Library**
*Location: `/lib/soul/whisper-library.ts`*

**What it does:**  
Extends MBTI overlay with age, gender, mood, and life phase for hyper-personalized guidance.

**Key functions:**
- `getSoulWhisper(context)` — Personalized daily guidance
- `getDetailedSoulWhisper(context)` — Extended version with all factors

**Context factors:**
- **Age** → Life phases: exploration (18-25), building (26-35), mastery (36-50), wisdom (51-65), integration (66+)
- **Mood** → 8 states: energized, exhausted, anxious, peaceful, restless, grieving, inspired, lost
- **Gender** → Subtle cultural context (non-stereotypical)
- **MBTI** → Cognitive function overlay

**Example:**
```typescript
getSoulWhisper({
  age: 28,
  mood: "exhausted",
  theme: "Career",
  mbti: "INFJ"
});
// Returns: "You're not weak. You're depleted. Rest is not retreat — it's strategy."
```

**API endpoint:** `POST /api/soul-whisper`

---

### 6. **Voice Mode Pipeline**
*Location: `/lib/soul/tts.ts`*

**What it does:**  
Converts text readings to speech using ElevenLabs or PlayHT APIs.

**Voice archetypes:**
- **Mentor** — Deep, calm, wise (default)
- **Mystic** — Ethereal, soft, reverent
- **Warrior** — Firm, direct, grounded
- **Sage** — Balanced, warm, knowing

**Key functions:**
- `textToSpeech(request)` — Main TTS function
- `chooseVoiceForTheme(theme)` — Auto-select voice based on content
- `isTTSConfigured(provider)` — Check if API keys are set

**Setup:**
```bash
# Add to .env
ELEVENLABS_API_KEY=your_key_here
# OR
PLAYHT_API_KEY=your_key_here
PLAYHT_USER_ID=your_user_id_here
```

**API endpoint:** `POST /api/tts`

---

### 7. **Trial by Fire Badge**
*Location: `/lib/soul/badges.ts`*

**What it does:**  
Detects heavy aspect patterns and awards symbolic badges to honor the user's journey.

**Badge types:**

#### Legendary (rare)
- 🔥 **Trial by Fire** — Saturn square Pluto or 5+ hard aspects
- 🦅 **Phoenix Rising** — 3+ hard Pluto aspects (death/rebirth cycle)
- ✨ **Cardinal Cross** — Grand Cross pattern (intense tension)

#### Rare
- ⚔️ **Soul Warrior** — Mars-Saturn hard aspect (disciplined will)
- ⚡ **Lightning Rod** — 3+ hard Uranus aspects (revolutionary energy)

#### Common (meaningful)
- 🌊 **Mystic Heart** — Water placements + Neptune harmony
- 🌀 **Natural Flow** — Grand Trine (natural gifts)

**Key functions:**
- `awardBadges(chartData)` — Analyze and award all eligible badges
- `hasBadge(chartBadges, badgeName)` — Check if user earned specific badge

**Usage:**
```typescript
const badges = awardBadges(chartData);
badges.legendary.forEach(badge => {
  console.log(`${badge.icon} ${badge.name}: ${badge.description}`);
});
```

---

### 8. **Soul Checkpoints**
*Location: `/lib/soul/checkpoints.ts`*

**What it does:**  
Tracks user milestones and celebrates the journey. Every 100 users, every 1000 readings — moments that matter.

**Milestone types:**
- **Users** — 100, 500, 1k, 5k, 10k community milestones
- **Readings** — 1k, 10k, 100k forecasts generated
- **Insights** — 100, 500 unique aspects discovered
- **Connections** — 10, 50 synastry reports (relationship exploration)

**Easter eggs:**
- 111 readings → "Angel numbers. The universe notices you noticing."
- 7-day streak → "You've made this a practice. That's how transformation happens."
- 100-day streak → "You're not visiting anymore. You live here now. Welcome home."

**Key functions:**
- `checkUserCheckpoints(milestones)` — User-specific milestones
- `checkGlobalCheckpoints(stats)` — Community-wide milestones
- `getNextCheckpoint(milestones, type)` — What's next?
- `getJourneySummary(milestones)` — Personalized journey recap

---

## 🚀 API Endpoints

All endpoints return `{ success: boolean, data: any, error?: string }`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/soul-reading` | POST | Generate narrative soul reading + badges |
| `/api/progressed-chart` | POST | Calculate secondary progressions |
| `/api/synastry` | POST | Compare two charts for relationship insights |
| `/api/soul-whisper` | POST | Get personalized daily guidance |
| `/api/tts` | POST | Convert text to speech (voice mode) |

---

## 🎨 UI Components

### `<SoulDashboard />`
*Location: `/components/astrology/SoulDashboard.tsx`*

Comprehensive tabbed interface showcasing all soul features:
- **Soul Voice** tab — Full narrative reading
- **Progressed** tab — Secondary progressions with year slider
- **Badges** tab — All earned badges with rarity display
- **Whisper** tab — Daily personalized guidance (if mood/age provided)

**Props:**
```typescript
{
  chartData: BirthChartData;
  userAge?: number;
  userGender?: "male" | "female" | "non-binary" | "prefer-not-to-say";
  userMood?: "energized" | "exhausted" | "anxious" | "peaceful" | "restless" | "grieving" | "inspired" | "lost";
  mbtiType?: string;
}
```

### Soul Dashboard Page
*Location: `/app/soul-dashboard/page.tsx`*

Visit: `/soul-dashboard`

Full-page implementation with birth chart calculator + user context inputs (age, mood) + soul dashboard display.

---

## 📁 File Structure

```
lib/
  soul/
    natal-voice.ts       # Narrative interpretations
    whisper-library.ts   # Personalized guidance
    tts.ts               # Voice mode (TTS)
    badges.ts            # Achievement system
    checkpoints.ts       # Milestone tracking
  astrology/
    house-systems.ts     # House system toggle
    progressions.ts      # Progressed charts
    synastry.ts          # Relationship analysis

app/api/
  soul-reading/route.ts
  progressed-chart/route.ts
  synastry/route.ts
  soul-whisper/route.ts
  tts/route.ts

components/astrology/
  SoulDashboard.tsx

app/
  soul-dashboard/page.tsx
```

---

## 🔧 Configuration

### Required (already configured)
- Swiss Ephemeris
- MBTI overlay
- Birth chart calculation engine

### Optional (for voice mode)
- **ElevenLabs API** — Primary TTS provider
  - Get key: https://elevenlabs.io/
  - Set: `ELEVENLABS_API_KEY=your_key`

- **PlayHT API** — Alternative TTS provider
  - Get key: https://play.ht/
  - Set: `PLAYHT_API_KEY=your_key`
  - Set: `PLAYHT_USER_ID=your_user_id`

All other features work without TTS credentials.

---

## 🎯 Usage Examples

### Example 1: Generate Soul Reading
```typescript
const response = await fetch('/api/soul-reading', {
  method: 'POST',
  body: JSON.stringify({ chartData })
});
const { data } = await response.json();

console.log(data.soulReading.coreIdentity);
// "You burn bright, but only after the forge..."

console.log(data.badges.legendary);
// [{ name: "Trial by Fire", icon: "🔥", ... }]
```

### Example 2: Check Progression
```typescript
const response = await fetch('/api/progressed-chart', {
  method: 'POST',
  body: JSON.stringify({ chartData, yearsInFuture: 5 })
});
const { data } = await response.json();

console.log(data.narrative);
// "In 5 years, your Moon enters Pisces..."
```

### Example 3: Compare Charts
```typescript
const response = await fetch('/api/synastry', {
  method: 'POST',
  body: JSON.stringify({ 
    chart1: myChart, 
    chart2: theirChart,
    person1Name: "You",
    person2Name: "Them"
  })
});
const { data } = await response.json();

console.log(data.overallCompatibility); // 0-100
console.log(data.narrative);
// "This connection is electric..."
```

---

## 🚢 Deployment Notes

1. **No breaking changes** — All soul features are additive
2. **Backwards compatible** — Existing chart calculations unchanged
3. **API-first** — All logic in backend, UI is optional
4. **TTS is optional** — Voice mode requires API keys, but everything else works without them
5. **Ready to ship** — All features tested and integrated

---

## 🎭 The Philosophy

This isn't just astrology.  
It's not just data.  
It's **story**.

Every chart is a hero's journey.  
Every aspect is a plot point.  
Every progression is a chapter.

Merlin doesn't calculate.  
Merlin **remembers**.

And now, it speaks.

---

*Built with fire, soul, and way too much coffee.*  
*Shipped: February 11, 2026*
