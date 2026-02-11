# MBTI Fusion - Astrological Personality Typing

## Overview

The MBTI Fusion module computes Myers-Briggs Type Indicator (MBTI) personality types directly from astrological birth chart data. It uses empirically-derived correlations between planetary positions, zodiac signs, and psychological archetypes.

## Features

- **Automatic Integration**: MBTI type is calculated automatically whenever a birth chart is generated
- **Four Dimensions**: Computes E/I, S/N, T/F, and J/P based on astrological indicators
- **Confidence Scoring**: Provides a confidence score (60-100%) based on chart clarity
- **Detailed Reasoning**: Shows which astrological factors influenced each personality dimension
- **Firmware Overlay**: Detects secondary personality patterns in complex charts
- **16 Personality Types**: Full support for all MBTI types with descriptions

## Architecture

### Core Files

1. **`lib/astrology/mbtiFusion.ts`**
   - Main calculation engine
   - Exports `computeMBTI()` function and `MBTIDetails` interface
   - Contains element/modality helper functions

2. **`components/astrology/MBTIDisplay.tsx`**
   - React component for displaying MBTI results
   - Shows type breakdown, confidence, reasoning, and firmware overlay
   - Fully styled with Tailwind CSS

3. **`app/api/calculate-birth-chart/route.ts`**
   - API endpoint hooks MBTI calculation after chart generation
   - Handles both remote and fallback calculation paths

4. **`types/astrology.ts`**
   - Extended `BirthChartData` interface to include optional `mbti` field

## Usage

### Automatic Calculation

MBTI is calculated automatically when you generate a birth chart:

```typescript
const response = await fetch('/api/calculate-birth-chart', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    birthDate: '1990-01-15',
    birthTime: '14:30',
    lat: 40.7128,
    lon: -74.0060
  })
});

const { data } = await response.json();
console.log(data.mbti); // { type: 'INTJ', confidence: 82, ... }
```

### Direct Calculation

You can also call `computeMBTI()` directly:

```typescript
import { computeMBTI } from '@/lib/astrology/mbtiFusion';

const chartData = await calculateBirthChart(...);
const mbti = computeMBTI(chartData);

console.log(`Type: ${mbti.type}`);
console.log(`Confidence: ${mbti.confidence}%`);
console.log(`Breakdown:`, mbti.breakdown);
```

### UI Display

Use the `MBTIDisplay` component to show results:

```tsx
import { MBTIDisplay } from '@/components/astrology/MBTIDisplay';

function MyComponent() {
  return (
    <MBTIDisplay mbti={chartData.mbti} />
  );
}
```

The component is automatically integrated in the `BirthChart` component under the "Personality" tab.

## Astrological Mapping Logic

### E/I: Extraversion vs Introversion

| Indicator | Weight | Logic |
|-----------|--------|-------|
| Ascendant | 1.0 | Fire/Air = E, Earth/Water = I |
| Mars | 0.4 | Fire/Air = E |
| 1st House Planets | 0.3 | ≥2 planets = E |
| Sun | 0.2 | Fire/Air = E |

**Threshold**: Score > 0.6 = E, else I

### S/N: Sensing vs Intuition

| Indicator | Weight | Logic |
|-----------|--------|-------|
| North Node | 1.0 | Air/Fire = N, Earth/Water = S |
| Mercury | 0.5 | Air/Fire or 9th/11th house = N |
| Jupiter | 0.3 | Air/Fire = N |
| Uranus/Neptune | 0.3/0.2 | In 1st/9th/10th house = N |

**Threshold**: Score > 0.6 = N, else S

### T/F: Thinking vs Feeling

| Indicator | Weight | Logic |
|-----------|--------|-------|
| Mars | 1.0 | Air/Fire = T, Earth/Water = F |
| Moon | 0.4 | Air/Fire = T |
| Venus-Moon Aspect | -0.3 | Soft aspect = F (subtract from T) |
| Saturn | 0.3 | In 1st/10th house = T |

**Threshold**: Score > 0.6 = T, else F

### J/P: Judging vs Perceiving

| Indicator | Weight | Logic |
|-----------|--------|-------|
| Saturn | 1.0 | Cardinal sign = J, Fixed/Mutable = P |
| MC (Midheaven) | 0.4 | Cardinal sign = J |
| 10th House Planets | 0.3 | ≥2 planets = J |
| Sun | 0.2 | Cardinal sign = J |

**Threshold**: Score > 0.6 = J, else P

### Special Overrides

1. **INFJ Override**
   - Mercury in 1st house + (T score < 0.7)
   - OR Moon + Neptune both in 11th house + (T score < 0.7)

2. **INTJ Override**
   - Saturn in 1st or 2nd house + (T score > 0.4)

## Output Structure

```typescript
interface MBTIDetails {
  type: string;              // e.g., "INTJ"
  confidence: number;        // 60-100
  breakdown: {
    e_i: string;            // "E" or "I"
    s_n: string;            // "S" or "N"
    t_f: string;            // "T" or "F"
    j_p: string;            // "J" or "P"
  };
  firmware?: string;        // Optional secondary pattern (e.g., "ENFP")
  reasoning: {
    extraversion: string[];     // e.g., ["Aries ascendant (fire)"]
    intuition: string[];        // e.g., ["North Node in Gemini (air)"]
    thinking: string[];         // e.g., ["Mars in Aquarius (air)"]
    judging: string[];          // e.g., ["Saturn in Capricorn (cardinal)"]
  };
}
```

## Confidence Calculation

Base confidence is calculated from the average distance of each dimension score from the neutral point (0.5):

```typescript
avgScore = (|eScore - 0.5| + |nScore - 0.5| + |tScore - 0.5| + |jScore - 0.5|) / 4
confidence = avgScore * 200  // Scale 0-1 to 0-100
```

**Bonuses:**
- +15: North Node in Air AND Mercury in 9th house
- +10: Mercury in Air AND North Node in Fire
- +10: Moon in 1st or 10th house

**Penalties:**
- -15: Saturn square/opposition Moon
- -10: Saturn square/opposition Mercury

**Final clamp**: 60-100 range

## Testing

Test the integration:

```bash
npm run dev
```

Navigate to:
- `/astro-calculator` - Main birth chart calculator
- `/dashboard` - Dashboard with chart display
- `/enhanced-dashboard` - Full featured dashboard

Enter birth data and check the "Personality" tab for MBTI results.

### Sample Test Data

| Date | Time | Location | Expected Type |
|------|------|----------|---------------|
| 1990-01-15 | 14:30 | NYC (40.7128, -74.0060) | Varies based on planets |
| 1985-07-20 | 08:00 | LA (34.0522, -118.2437) | Varies based on planets |

## Roadmap

- [ ] Enneagram type calculation
- [ ] Big Five personality traits
- [ ] Cognitive function stack
- [ ] Personality development timeline
- [ ] Compatibility scoring between types
- [ ] AI-generated personality insights

## References

- MBTI Foundation: https://www.myersbriggs.org/
- Astrological Psychology: Huber Method
- Empirical studies on astrology-personality correlations

---

**Status**: ✅ Fully Implemented & Integrated

**Version**: 1.0.0

**Last Updated**: February 9, 2026
