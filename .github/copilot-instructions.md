# Merlin - Copilot Instructions for AI Coding Agents

## Project Overview

**Merlin** is a predictive astrology application—a birth chart calculator with visualization. It's built in sequential sections: backend calculation → raw data display → clean UI → visual enhancements. The architecture separates concerns strictly: `lib/astrology/` for pure calculation logic, `/app/api/` for server endpoints, `/components/` for UI.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, Swiss Ephemeris (`sweph`), D3.js.

---

## Product Framing (V2 North Star)

Use this framing for all new dashboard and forecast work:

- Merlin is a life weather intelligence system blended with horoscope output.
- Forecasts should combine symbolic weather language with personalized astrological context.
- Prioritize meaning, timing, preparation, and user agency over deterministic claims.
- Tone should stay calm, insightful, and slightly mysterious (never generic horoscope filler).
- Every reading should feel specific to the user, not like mass-market copy.

---

## Architecture & Data Flow

### Core Components

1. **Calculation Engine** (`lib/astrology/calculate.ts`, `lib/engine.ts`, `lib/engine-fallback.ts`)
   - Pure JavaScript/TypeScript astrology math—no dependencies on UI
   - Computes planetary positions, house cusps, aspects using Swiss Ephemeris or custom algorithms
   - Input: `ChartCalculationParams` (date, time, lat/lon) → Output: `BirthChartData`
   - **Key exports:** `calculateAll()`, `calculateBirthChart()`

2. **API Layer** (`app/api/calculate-birth-chart/route.ts`, `app/api/chart/route.ts`)
   - POST endpoints validate input, call calculation engine, return JSON
   - Error handling includes console logging for debugging
   - Request format: `{ birthDate, birthTime, lat, lon, houseSystem, zodiac, orb }`

3. **React Hook** (`hooks/useBirthChart.tsx`)
   - Manages state: `chartData`, `loading`, `error`
   - Fetches from `/api/calculate-birth-chart`
   - Provides `calculateChart()` callback and `reset()` function

4. **UI Components** (`components/astrology/`)
   - `BirthChartCalculator.tsx` — input form + calculation logic wrapper
   - `BirthChart.tsx` — displays chart data with optional interactive controls
   - `WheelVisualization.tsx`, `GoldenWheel.tsx` — D3.js-based wheel charts
   - `AstroDashboard.tsx` — full page layout combining all above

### Type System

All types live in `types/astrology.ts` and `types/astrology.d.ts`. Key interfaces:

```typescript
// Birth input data (YYYY-MM-DD, HH:MM 24h format)
interface BirthData {
  date: string;
  time: string;
  latitude: number;
  longitude: number;
  houseSystem?: 'Placidus' | 'Koch' | 'Equal' | 'Whole';
  zodiac?: 'Tropical' | 'Sidereal';
}

// Calculated result for a single planet
interface PlanetPosition {
  name: string;
  longitude: number; // 0-360°
  latitude: number;
  distance: number; // AU
  sign: string; // Zodiac sign name
  degree: number; // 0-29
  minute: number; // 0-59
  house: number; // 1-12
}

// Complete birth chart calculation result
interface BirthChartData {
  planets: PlanetPosition[];
  houses: HousePosition[];
  aspects: Aspect[];
  angles: { ascendant, midheaven, descendant, imumCoeli };
  metadata: { calculatedAt, houseSystem, zodiac };
}
```

**Critical convention:** Components import `BirthData`/`BirthChartData` from `@/components/astrology/BirthChartCalculator.tsx`, not from `/types/`. This is because type definitions are split across multiple files for historical reasons.

---

## Developer Workflows

### Running the App

```bash
npm run dev        # Start Next.js dev server (port 5000 per next.config.js)
npm run build      # Production build
npm run start      # Run production build
npm run test       # Run Jest tests
npm run test:watch # Watch mode
npm run lint       # ESLint
```

**Testing Birth Chart Calculations:**
1. Visit `http://localhost:3000/astro-calculator` (or dashboard route)
2. Enter birth date (YYYY-MM-DD), time (HH:MM), city
3. Check browser console for debug logs (all API calls log via `console.log`)
4. Verify chart data in Network tab: `/api/calculate-birth-chart` response

### Build & Validation

- **No graphics until final section** — keep core unbreakable
- **Test each section** before moving to next:
  - Section 1: Calculator outputs JSON with no UI errors
  - Section 2: Frontend displays text/tables
  - Section 3: Clean UI layout
  - Section 4: Visualizations (Wheel, animations)
- **Type safety:** Always use TypeScript—catch bugs early

### Jest Configuration

- `jest.config.js` ignores `temp_*` and `possible front end stuff` folders (test artifacts)
- `jest.setup.js` provides global test utilities
- Tests live in `/tests/hooks/` (currently minimal)
- Module alias `@/*` works in tests (mapped in jest config)

---

## Key Patterns & Conventions

### 1. Pure Calculation / Impure API

**Rule:** Calculation functions (`lib/astrology/`) must be pure—no side effects, no API calls. All sweph/ephemeris logic lives here.

```typescript
// ✅ OK: Pure function
export function calculatePlanetPosition(jd: number, planetIndex: number) {
  return { longitude, latitude, distance };
}

// ❌ Wrong: Would be mixed into API layer
export async function fetchAndCalculate(birthDate: string) { ... }
```

### 2. Request Validation in API Routes

Every API route validates input before passing to calculation:

```typescript
// app/api/calculate-birth-chart/route.ts pattern
if (!birthDate || !birthTime || lat === undefined || lon === undefined) {
  return NextResponse.json({ success: false, error: 'Missing params' }, { status: 400 });
}
```

### 3. Error Handling: Console + User Messages

- Log all errors with context to console (for debugging)
- Return user-friendly JSON error response
- React components catch API errors and display in UI state

```typescript
try {
  const result = calculateAll({ ... });
  return NextResponse.json({ success: true, data: result });
} catch (error) {
  console.error('Calculation failed:', error);
  return NextResponse.json({ success: false, error: error.message }, { status: 500 });
}
```

### 4. Component Props: Render Children Pattern

`BirthChartCalculator` uses render-children pattern for flexibility:

```typescript
<BirthChartCalculator birthData={data} onCalculate={handler}>
  {({ chartData, loading, error, calculateChart }) => (
    <div>{/* Render based on state */}</div>
  )}
</BirthChartCalculator>
```

### 5. Color & Aesthetics

- **Primary:** Deep cosmic blue `#0f172a` (dark theme)
- **Accent:** Golden `#fcd34d`
- Tailwind utilities: `bg-slate-950`, `text-yellow-300`
- Use Framer Motion for smooth animations (imported in relevant components)

### 6. Module Aliases

- Path: `@/*` maps to root (e.g., `@/lib` → `/lib`, `@/components` → `/components`)
- Use in all imports for consistency

---

## File Organization

```
app/
  layout.tsx              # Root layout
  page.tsx                # Home
  api/
    calculate-birth-chart/route.ts    # Main calculation endpoint
    chart/route.ts                    # Alternative chart endpoint
  astro-calculator/page.tsx           # Calculator UI page
  
lib/astrology/
  calculate.ts            # Core calculation functions (primary engine)
  engine.ts               # Alternative: uses sweph directly
  engine-fallback.ts      # Fallback implementation
  ephemeris.ts, transits.ts, interpretations.ts   # Advanced features
  geocoding.ts            # Location → coordinates

components/astrology/
  BirthChartCalculator.tsx   # Calculation + input form (defines types)
  BirthChart.tsx             # Display + controls
  WheelVisualization.tsx     # D3 wheel render
  AstroDashboard.tsx         # Full page layout

hooks/
  useBirthChart.tsx       # Main state management hook

types/
  astrology.ts            # Primary type definitions
  astrology.d.ts          # Type declaration supplements
```

---

## Integration Points & Dependencies

### External Libraries

- **`sweph` (Swiss Ephemeris):** Accurate planetary calculations—if import fails, fallback to custom math in `engine-fallback.ts`
- **`d3`:** Wheel visualization (SVG rendering)
- **`framer-motion`:** Animations in components
- **`date-fns`:** Date parsing/formatting
- **`@clerk/nextjs` & `@stripe/stripe-js`:** Auth & payments (loaded but not all features active)

### Fallback Strategy

If `sweph` fails to import (Node.js native module issues):
1. `engine-fallback.ts` provides custom JS calculations
2. `lib/engine.ts` attempts sweph; catches error and uses fallback
3. Always verify both paths work in tests

### Cross-Module Communication

- Calculation engine exports `calculateAll()` and `calculateBirthChart()`
- API routes import and call these functions
- React components fetch from API (not calling calculation directly)
- Hooks manage component state and API calls

---

## Common Debugging Patterns

1. **"Chart not calculating"** → Check browser console for API response
2. **"Invalid zodiac sign"** → Verify degree is 0-29 (minute 0-59)
3. **"NaN in calculations"** → Check input date/time/coordinates are valid numbers
4. **"Chart displays but no aspects"** → Aspects computed only if planets > 1 and orb parameter passed
5. **"Sweph import error"** → Expected in some Node.js environments; engine-fallback.ts handles it

---

## Before Starting Work

1. **Read** `.windsurf/rules/merlin.md` for project vision (sequential sections, aesthetic guidelines)
2. **Verify** `npm run dev` starts without errors
3. **Check** the relevant section: are you in calculation (engine), API (endpoints), or UI (components)?
4. **Type first:** Define/update types in `types/astrology.ts` before implementing functions
5. **Test locally:** Always test calculations with known birth data before committing

---

## Advanced Workflows: Ephemeris, Transits & Interpretations

### 1. Ephemeris Workflow (`lib/astrology/ephemeris.ts`)

**Purpose:** Generate daily forecasts by comparing natal chart positions to current transiting positions.

**Key Function:** `getTodaysForecast(birthChart: BirthChartData): DailyForecast`

```typescript
// Returns: { date, summary, planetaryHighlights, moonPhase, transits, advice }
// Example: "Today brings energies from Sun, Moon, Mars. Key highlights: Mercury is at 15° Gemini..."
```

**How It Works:**
1. Takes natal `BirthChartData` from calculated birth chart
2. Calculates current transiting chart (typically at noon UTC)
3. Compares natal positions to today's transiting positions
4. Identifies significant planetary highlights (0°, 15°, 22°, 29° degrees)
5. Determines lunar phase and generates contextual advice

**Implementation Status:** ✅ Fully Implemented
- Backend: `lib/astrology/ephemeris.ts`
- API Endpoint: `POST /api/forecast`
- Hook: `useForecast()` in `hooks/useForecast.tsx`
- UI Component: `DailyForecast` in `components/astrology/DailyForecast.tsx`

**Key Patterns:**
- Loops through natal planets and checks for exact degree positions in transits
- Lunar phase drives advice generation (New Moon = new beginnings, Full Moon = reflection/release)
- Summary automatically includes top 3 planets and phase-specific guidance
- Always extract coordinates from `birthChart.birthData.coordinates` for accurate transit calculation

**When to Use:** Daily reading/forecast features, personalized daily emails, transit alerts

---

### 2. Transits Workflow (`lib/astrology/transits.ts`)

**Purpose:** Calculate current astrological transits and identify major aspects between natal and transiting planets.

**Key Function:** `getCurrentTransits(natalPlanets: PlanetPosition[]): AspectMatch[]`

```typescript
// Returns array of aspect matches:
// [
//   {
//     transitingPlanet: 'Saturn',
//     natalPlanet: 'Sun',
//     aspect: 'Square',
//     orb: 1.5,
//     exact: true
//   }
// ]
```

**How It Works:**
1. Calculates Julian Day (JD) for current UTC time via `sweph` library
2. Maps planet names to `sweph` constants using `getPlanetId()`
3. Computes longitude for each transiting planet
4. Checks against 5 major aspects: Conjunction (0°), Sextile (60°), Square (90°), Trine (120°), Opposition (180°)
5. Returns only aspects within defined orb ranges (8°-10° depending on aspect type)

**Implementation Status:** ✅ Fully Implemented
- Backend: `lib/astrology/transits.ts`
- API Endpoint: `POST /api/transits` (categorizes into significant/approaching)
- Hook: `useTransits()` in `hooks/useTransits.tsx`
- UI Component: `ActiveTransits` in `components/astrology/ActiveTransits.tsx`

**Orb Rules by Aspect:**
- Conjunction/Opposition: 10° orb
- Square/Trine: 8° orb
- Sextile: 6° orb

**Key Patterns:**
- Always normalize angles: `((deg % 360) + 360) % 360` to handle 0-360° range
- Handle angle differences > 180°: `if (diff > 180) diff = 360 - diff`
- Mark aspects as "exact" if orb < 1°
- `getPlanetId()` maps planet names to sweph constants (must use correct mapping)
- API endpoint categorizes transits: `exact` (orb < 1.5), `approaching` (1.5-3)

**When to Use:** Real-time transit alerts, "What's happening now?" features, current aspect widgets, predictive timeline generation

---

### 3. Interpretations Workflow (`lib/astrology/interpretations.ts`)

**Purpose:** Generate human-readable astrological interpretations for planetary placements, aspects, and patterns.

**Core Class:** `InterpretationEngine`

#### 3.1 Planet-Sign Interpretation
```typescript
const engine = new InterpretationEngine();
const interpretation = engine.generateInterpretation({
  planet: 'Venus',
  sign: 'Scorpio',
  house: 8,
  aspect: 'Trine',
  quality: 75  // 0-100 strength score
});
// Output: "Your Venus in Scorpio combines love with transformation, creating..."
```

**Structure:**
1. Base template combines planet + sign keywords (3 random templates for variety)
2. Optional house context adds life area influence (12 house themes)
3. Optional aspect context adds dynamic relationships (positive/negative)
4. Optional dignity context marks essential strength/weakness
5. Quality modifier (0-100) adjusts tone: "exceptional flow" → "highly harmonious" → "requires conscious effort"

**Implementation Status:** ✅ Fully Implemented
- Backend: `lib/astrology/interpretations.ts`
- API Endpoint: `POST /api/interpret` (generates planet + aspect interpretations)
- Hook: `useInterpretations()` in `hooks/useInterpretations.tsx`
- UI Component: `ChartInterpretation` in `components/astrology/ChartInterpretation.tsx`

**Data Models:**
- `signKeywords` (12 signs): 5 traits each (e.g., Aries = "initiative", "courage", "leadership")
- `planetKeywords` (10 planets): 5 traits each (e.g., Venus = "love", "values", "beauty")
- `aspectInterpretations` (5 aspects): positive/negative phrases for soft/hard aspects

#### 3.2 Aspect Pattern Interpretation
```typescript
const aspectInterpretation = engine.generateAspectInterpretation({
  planet1: { name: 'Mars', longitude: 15 },
  planet2: { name: 'Saturn', longitude: 16 },
  type: 'Conjunction',
  orb: 1,
  exact: true
});
// Output: "The exact Conjunction between Mars and Saturn connects your action with discipline..."
```

**How It Works:**
- Precision level: "exact" (< 0.5°) → "very close" (< 2°) → "close" (< 5°) → "wide"
- Influence polarity: orb < 3° = positive keywords, orb ≥ 3° = negative keywords
- Describes interaction between two planetary principles

#### 3.3 Chart Summary & Pattern Recognition
```typescript
const summary = engine.generateChartSummary(planets, aspects);
// Output: "Your chart shows strong emphasis on Fire and Air. Notable patterns include..."
```

**Pattern Detection:**
- `calculateDominantElements()`: Count planets in Fire/Earth/Air/Water signs, return top 2
- `identifyAspectPatterns()`: Detect ≥2 Trines (harmonious), ≥2 Squares (dynamic), ≥2 Oppositions (relational)

**Quality Score Tiers:**
- `quality > 80`: "highly harmonious placement that operates with exceptional flow"
- `quality > 60`: "generally functions well, though occasional awareness needed"
- `quality > 40`: "presents challenges that become growth opportunities"
- `quality ≤ 40`: "requires conscious attention and development"

**When to Use:** Chart reading summaries, personality profile pages, transit reports, AI-generated interpretations for UI display

---

### 4. End-to-End Integration: Enhanced Dashboard

**New Route:** `/enhanced-dashboard`

The enhanced dashboard page (`app/enhanced-dashboard/page.tsx`) demonstrates full integration:

**Tabbed Interface with 4 views:**
1. **Overview** — Quick stats (active transits, moon phase, highlights)
2. **Interpretation** — Full chart summary + planet interpretations + aspect patterns
3. **Today's Forecast** — Daily reading with moon phase, planetary highlights, and cosmic guidance
4. **Active Transits** — Exact transits (red), approaching transits (amber), organized by intensity

**Data Flow:**
```typescript
// User enters birth data → BirthChart component
// → Calls handleChartCalculated() 
// → Triggers 3 parallel API calls:
//    1. POST /api/interpret → useInterpretations()
//    2. POST /api/forecast → useForecast()
//    3. POST /api/transits → useTransits()
// → Renders ChartInterpretation, DailyForecast, ActiveTransits components
```

**Implementation Pattern:**
- Each endpoint returns `{ success, data, error }`
- Hooks manage loading/error states
- UI components handle display with Framer Motion animations
- Tab system allows users to explore different interpretations

**Key Files Created:**
- `app/api/forecast/route.ts` — Daily forecast endpoint
- `app/api/transits/route.ts` — Transit analysis endpoint
- `app/api/interpret/route.ts` — Chart interpretation endpoint
- `hooks/useForecast.tsx` — Forecast state management
- `hooks/useTransits.tsx` — Transit state management
- `hooks/useInterpretations.tsx` — Interpretation state management
- `components/astrology/DailyForecast.tsx` — Forecast UI
- `components/astrology/ActiveTransits.tsx` — Transit UI
- `components/astrology/ChartInterpretation.tsx` — Interpretation UI
- `app/enhanced-dashboard/page.tsx` — Main dashboard page

**When to Use:** This is the recommended entry point for users wanting complete astrological insights. The dashboard loads all three modules in parallel for optimal performance.

---

## When Adding New Features

- **New calculation method?** → Add to `lib/astrology/`, update `calculateAll()` to expose it
- **New API endpoint?** → Create in `app/api/`, validate input, call calculation engine, return JSON
- **New UI component?** → Import from `@/hooks/useBirthChart` and `@/types/astrology`, follow render-children pattern if complex
- **New aspect type or dignity?** → Update type definitions, ensure calculation engine supports it, add interpretations in `lib/astrology/interpretations.ts`
- **New transit analysis?** → Expand `getCurrentTransits()` with additional aspect types or use `getTodaysForecast()` as template
- **New interpretation feature?** → Add keyword mappings to `InterpretationEngine` and implement new `generate*()` method following existing patterns

Always keep the three-layer separation: calculation → API → UI.
