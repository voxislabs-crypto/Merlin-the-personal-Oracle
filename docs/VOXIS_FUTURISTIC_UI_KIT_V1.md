# Voxis FuturisticUI Kit v1 -- 2045 Cognitive OS Edition

This kit is built for the current Voxis frontend stack (React + CSS). It is pure CSS + React components, no extra runtime library.

## 1) Global CSS Variables & Base Styles

File: `frontend/src/styles/futuristic-ui-kit.css`

```css
/* Core tokens + base + glass + utility + component classes + keyframes */
/* Import this file where needed, or once in main.jsx for global use */
@import "../src/styles/futuristic-ui-kit.css";
```

Highlights included in the file:
- Color tokens: deep black, electric cyan, neon magenta, violet, emerald, amber
- Glassmorphism primitives: blur, border, inner glow, holographic border
- Typography: Inter + Space Grotesk
- Reduced-motion compliance

## 2) Full Component Library

File: `frontend/src/components/ui/FuturisticUIKit.jsx`

Exports:
- `FuturisticButton` (`primary`, `secondary`, `ghost`, 3D press)
- `FuturisticCard` (glass + holo border + inner grid)
- `FuturisticPopup` (fade + rise modal with glow close button)
- `FuturisticTabs` (active neon underline + lift)
- `FuturisticPanel` (scanline-ready section container)
- `FuturisticInput` (glow focus + holo placeholder)
- `FuturisticToggle` (neon slider switch)
- `FuturisticBadge` (holo pill + pulse)
- `FuturisticProgress` (neon bar)
- `FuturisticOrb` (floating status orb)
- `FuturisticUIKitExamples` (4 Voxis-flavored examples)

Usage:

```jsx
import {
  FuturisticButton,
  FuturisticCard,
  FuturisticPopup,
  FuturisticTabs,
  FuturisticPanel,
  FuturisticInput,
  FuturisticToggle,
  FuturisticBadge,
  FuturisticProgress,
  FuturisticOrb,
  FuturisticUIKitExamples,
} from "./components/ui/FuturisticUIKit.jsx";
```

## 3) Utility Classes

Included in `futuristic-ui-kit.css`:

```css
.holo-border
.neon-text-cyan
.neon-text-magenta
.glass-bg
.scanline
.pulse-glow
.data-stream
```

Note on `3d-hover` naming:
- CSS class names cannot start with a number unless escaped.
- Use `.hover-3d` in code if you want a dedicated utility alias.

## 4) Animation Keyframes

Included keyframes:

```css
@keyframes fadeInHolo
@keyframes popupRise
@keyframes press3D
@keyframes orbPulse
@keyframes tabSlide
@keyframes pulseGlow
@keyframes dataSweep
```

Durations are kept in the 200ms-400ms range for core interactions and use:

```css
cubic-bezier(0.23, 1, 0.32, 1)
```

## 5) Tailwind Config Additions (Optional)

Voxis currently uses CSS-driven styling, not Tailwind. If Tailwind is added later, mirror this token layer:

```js
// tailwind.config.js (theme.extend)
export default {
  theme: {
    extend: {
      colors: {
        fx: {
          black: "#0a0a0f",
          cyan: "#00f5ff",
          magenta: "#ff00aa",
          violet: "#8b00ff",
          emerald: "#00ff9d",
          amber: "#ffcc00",
        },
      },
      boxShadow: {
        "fx-neon": "0 0 28px rgba(0,245,255,0.2)",
        "fx-card": "0 16px 36px rgba(0,0,0,0.42)",
      },
      transitionTimingFunction: {
        fx: "cubic-bezier(0.23, 1, 0.32, 1)",
      },
      keyframes: {
        fadeInHolo: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "fade-in-holo": "fadeInHolo 260ms cubic-bezier(0.23,1,0.32,1)",
      },
    },
  },
};
```

## 6) Usage Examples (Voxis)

Use the ready demo component:

```jsx
import { FuturisticUIKitExamples } from "./components/ui/FuturisticUIKit.jsx";

export default function BrainTab() {
  return <FuturisticUIKitExamples />;
}
```

Included examples:
- Brain tab header with live tabs + status orb
- Personality card with holographic treatment
- Live mood orb status panel
- Fading confirmation popup with glass backdrop

## Rollout Path

1. Import `futuristic-ui-kit.css` once in `main.jsx` for global scope.
2. Apply root scope class `voxis-futuristic-root` to app root (`body`, `#root`, or app shell).
3. Use the bridge layer in `futuristic-ui-kit.css` to skin existing Voxis classes (`panel`, `tab`, inputs) across all tabs.
4. Swap existing tab pills + action buttons to `FuturisticTabs` and `FuturisticButton` as components are touched.
5. Keep Neural Core rendering untouched; style only surrounding panels and controls.
