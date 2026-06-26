# Merlin Reference Literature Index

This directory contains foundational texts and academic references that inform Merlin's astrology engine, algorithmic logic, and philosophical framework.

---

## 📚 Organized by Domain

### Astrology
Located: `docs/references/astrology/`

#### Enuma Anu Enlil
- **Author:** Ancient Babylonian astronomers (17th-7th century BCE)
- **File:** `Enuma_Anu_Enlil.pdf`
- **Relevance:** Foundational omen literature. Documents earliest systematic planetary observation and interpretation (omens based on lunar positions, eclipses, planetary motions).
- **Use in Merlin:** Historical context for aspect theory, lunar nodes, and event prediction frameworks.

#### Ptolemy's Tetrabiblos
- **Author:** Claudius Ptolemy (2nd century CE)
- **File:** `Ptolemys_Tetrabiblos.pdf`
- **Relevance:** Classical Western astrology canon. Defines house systems, planetary rulerships, sign characteristics, aspects (conjunction, sextile, square, trine, opposition), fixed stars, and interpretive methods.
- **Use in Merlin:** Core reference for Tropical Zodiac, Placidus houses, aspect definitions, and classical interpretation templates.
- **Key Sections for Engine:**
  - Book I: Fundamentals (elements, signs, planetary natures)
  - Book II: Mundane astrology (eclipses, comets, weather)
  - Book III: Nativities (birth chart interpretation)
  - Book IV: Profections, transits, relocation

#### Surya Siddhanta
- **Author:** Historical Sanskrit astronomical text (4th-5th century CE, redacted editions through 12th century)
- **File:** `Surya_Siddhanta.pdf`
- **Relevance:** Vedic sidereal astrology system. Defines precession calculations, sidereal zodiac positions (~23.5° offset from Tropical), Nakshatra moon mansions, planetary speed/dasha periods.
- **Use in Merlin:** Alternative zodiac system (if "Sidereal" toggle is used). Precession math, lunar node calculations, Vedic timing algorithms.
- **Technical Chapters:**
  - Chapter 1: Astronomical constants (Earth parameters, orbital mechanics)
  - Chapter 2-3: Planetary positions (mean/true longitudes)
  - Chapter 4: Lunar eclipse predictions
  - Chapter 13: Zodiac division (Nakshatras)

---

### Philosophy & Hermeticism
Located: `docs/references/philosophy/`

#### Corpus Hermeticum
- **Author:** Hermes Trismegistus (attributed, Greek-Egyptian tradition, 2nd-3rd century CE compilation)
- **File:** `Corpus_Hermeticum.pdf`
- **Relevance:** Foundational hermetic philosophy. Establishes cosmological principles: "As above, so below" (correspondences), divine mind (logos), human microcosm/macrocosm reflection, cycles of creation/destruction.
- **Use in Merlin:**
  - **Soul Layer** grounding: Why birth charts reflect life patterns (macrocosm = microcosm)
  - **Interpretation Philosophy:** Planetary archetypes as divine principles embodied in humans
  - **Resonance Weighting:** Karmic feedback loops (what resonates with user tells us their spiritual alignment)
  - **Oracle Voice:** Mystical framing of transit effects (transits = cosmic communication)
- **Key Tractates:**
  - Tractate 1 (Poimandres): Creation myth, divine order, human nature
  - Tractate 7 (Universal Mind): "God is infinite; part of God is in all creation"
  - Tractate 12 (On the Common Mind): Ethical implications of unity consciousness

---

## 🔗 How These Texts Interconnect

```
Enuma Anu Enlil (Babylonian observation)
              ↓
         Ptolemy (Systematization)
              ↓
    Classical Western Astrology
              
Surya Siddhanta (Vedic mathematics)
              ↓
    Sidereal Zodiac System
    (Alternative to Tropical)

Corpus Hermeticum (Philosophy)
              ↓
    "As above, so below"
    ↓
    Merlin's Soul Layer
    (Why charts matter spiritually)
```

---

## 📖 Usage Guidelines

### For Engine Development
- **Aspect Definitions:** Ptolemy, Book I (conjunction = 0°, sextile = 60°, etc.)
- **House Interpretation:** Ptolemy, Book III, part on houses
- **Precession Math:** Surya Siddhanta, Chapters 2-3
- **Orb Calculations:** Ptolemy (traditionally 8-10° for soft aspects)

### For UI Interpretation Text
- **Planet-Sign Templates:** Ptolemy (planet natures) + Corpus Hermeticum (divine principles)
- **House Meanings:** Ptolemy's houses mapped to life domains
- **Aspect Narratives:** Tetrabiblos for classical interpretations, Corpus for philosophical framing

### For Soul/Oracle Voice
- **Foundational Philosophy:** Corpus Hermeticum Tractate 1 & 12
- **Why It Matters:** "Cosmos speaks through your chart" (Corpus: "God is in all")
- **Resonance Concept:** Hermeticism's law of correspondence

---

## 📝 How to Add These PDFs

1. **Place PDFs in appropriate folder:**
   - `Enuma_Anu_Enlil.pdf` → `docs/references/astrology/`
   - `Ptolemys_Tetrabiblos.pdf` → `docs/references/astrology/`
   - `Surya_Siddhanta.pdf` → `docs/references/astrology/`
   - `Corpus_Hermeticum.pdf` → `docs/references/philosophy/`

2. **Link them in code comments:**
   ```typescript
   // Aspect definitions per Ptolemy, Tetrabiblos Book I, Ch. 13
   const ASPECTS = {
     conjunction: 0,   // orb ±10°
     sextile: 60,      // orb ±6°
     // ...
   };
   ```

3. **Reference them in interpretations:**
   ```typescript
   // "Venus in Gemini brings eloquence in matters of the heart"
   // — Ptolemy on Venus + Corpus on Hermes (communication god)
   ```

---

## 🎯 Merlin-Specific Applications

| Text | Component | Example |
|------|-----------|---------|
| Ptolemy | `lib/astrology/calculate.ts` | Aspect angle definitions, orb tolerances |
| Surya Siddhanta | `lib/astrology/house-systems.ts` | Precession offset when Sidereal mode active |
| Corpus Hermeticum | `lib/soul/natal-voice.ts` | Philosophical grounding ("You are the cosmos aware of itself") |
| Enuma Anu Enlil | `lib/astrology/predictive-transits.ts` | Historical precedent for eclipse/eclipse omens |

---

## 📚 Additional Recommended Additions (Optional)

- **Al-Biruni's Masudi Canon** — Medieval Islamic astronomy (bridges Ptolemy → Vedic)
- **Vettius Valens' Anthology** — Greek astrology, technique refinements (1st century CE)
- **William Lilly's Christian Astrology** — Modern Western house methods (17th century)
- **Ernst Wilhelm's Vedic Astrology resources** — Contemporary Vedic system explanations

---

## Notes for Contributors

- **PDF Storage:** These are reference copies. They're not compiled into the app (`.gitignore` should exclude large PDFs if needed).
- **Citing Texts:** When adding features, comment with the source. Example: `// Per Ptolemy II.10: lunar eclipse prediction`
- **Version Control:** PDFs are large; consider storing them in a separate docs repository if size becomes an issue.

---

*Last Updated: March 2026*  
*Merlin v0.1+ with Adaptive Oracle Mode*
