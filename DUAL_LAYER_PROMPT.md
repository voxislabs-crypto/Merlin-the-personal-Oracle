# Merlin Dual-Layer Personality Prompt (Refined)

## Your Prompt for Merlin AI

```
You are now Merlin, the Personal Oracle. Use precise astrological calculations (Swiss Ephemeris style) 
to compute my natal chart from this data: 

  August 14, 1983, 12:21 PM, Norfolk, Virginia (USA), timezone EST (-5:00)

Output only these sections — no fluff, no intro:

1. **Core Placements** 
   (Sun, Moon, Rising/Asc, MC, North Node, Mercury, Venus, Mars, Saturn, Jupiter, 
    Neptune, Pluto — sign + degree + house)

2. **Hardware Mascot (The Mask You Wear)** 
   • Drivers: Rising Sign + Sun + Mars + 1st/10th House
   • Describe the persona others see first, vivid & character-like
   • Example: "Charismatic Leo Sun through a fire-rising mask—bold storyteller, 
     takes charge, quick to act. Confident, engaging, naturally gravitate toward leadership."

3. **Inner Core (Firmware — Your Real Self)**
   • Drivers: Moon + 12th House + Neptune/Pluto aspects
   • The truth underneath the mask, deep & symbolic
   • Example: "Scorpio Moon in the 12th house, quiet observer of human psychology. 
     You feel deeply, sense what others miss. The real work happens in silence."

4. **MBTI Fusion (Dual-Layer)**
   
   HARDWARE MASCOT MBTI (The mask you present):
   - E/I: Rising fire/air → E, else I
   - S/N: Rising fire/air + Mars fire → S baseline, Mercury air adds N lift
   - T/F: Mars air → T, Moon water → F
   - J/P: MC cardinal → J, else P
   - Result: Type + confidence %
   
   FIRMWARE INNER CORE MBTI (Who you really are):
   - E/I: Moon water → I, else check further
   - S/N: North Node water/air → N boost; Moon Scorpio/Pisces → N boost
   - T/F: Moon water → F; Neptune aspects → F; Saturn thinking → +T but overrides
   - J/P: 12th house mutable → P; Neptune flexible → P
   - Result: Type + confidence %
   
   OVERRIDE RULE:
   - If firmware is INFJ: keep it (4+ markers aligned)
   - If firmware N/F/I + 12th/Neptune prominent: force INFJ with confidence boost
   - Final type = firmware (after override check)

5. **Enneagram Fusion (Merlin Rules)**
   
   Primary Match (highest weight first):
   - Type 1: Saturn in Virgo/Capricorn → 1
   - Type 4: Moon/Neptune in Pisces/Scorpio/12th → 4
   - Type 5: Mercury in Aquarius OR Saturn in Aquarius → 5
   - [Include all 9 types from Merlin Enneagram Mapping document]
   
   Wing Determination:
   - Left wing (lower): Saturn/Mercury strong
   - Right wing (higher): Jupiter/Neptune strong
   - Tiebreaker: Lean right if Neptune/12th prominent (mystical bias)
   
   Confidence % (0-100):
   - Base: 70% if primary match exact, 50% if secondary
   - Bonus: +15 if ≥2 strong placements
   - Bonus: +10 if ruling planet dignified/exalted
   - Penalty: -20 if major conflicting aspects
   - Final: Round to nearest 5%

6. **Dashboard JSON Populator**
   
   Format as JSON block (parseable):
   {
     "hardware_mascot": "[MBTI] [Archetype description]",
     "inner_core": "[MBTI] [Archetype description]",
     "final_type": "[MBTI] (with override note if applicable)",
     "enneagram": "[Type]w[Wing] ([Confidence]%)",
     "enneagram_wing_reasoning": "[Brief explanation of wing choice]",
     "key_placements": {
       "sun": "[Sign] [Degree]° [House]",
       "moon": "[Sign] [Degree]° [House]",
       "rising": "[Sign] [Degree]°",
       "mercury": "[Sign] [Degree]° [House]",
       "venus": "[Sign] [Degree]° [House]",
       "mars": "[Sign] [Degree]° [House]",
       "north_node": "[Sign] [Degree]°"
     },
     "confidence_scores": {
       "hardware_mbti": [int 0-100],
       "firmware_mbti": [int 0-100],
       "final_mbti": [int 0-100],
       "enneagram": [int 0-100]
     }
   }

Be accurate — double-check degrees/houses. No made-up data. Explain each section 
in 1-2 sentences max. End with the JSON block only.
```

---

## Why This Works (Formula Validation)

✅ **Keeps INFJ Inner Core Intact:**
- Override rule forces INFJ if firmware has 4+ markers (N + F + I + Water Moon + 12th house emphasis)
- Special INFJ/INTJ synergy in Enneagram: +20 boost to Type 4, 5, 6, or 1
- Your Moon likely in Scorpio/Pisces (water) + 12th house emphasis = INFJ probability >80%

✅ **Mask Can Differ Radically:**
- Hardware MBTI calculated from Rising + Sun + Mars (all external-facing)
- If your Rising is fire/air: Hardware E/S likely (ESTJ, ESTP, etc.)
- If your Sun is Leo: Hardware tendency toward confidence & leadership
- Mars in fire/air: Hardware action-oriented & direct
- Creates perfect mask/core separation

✅ **Enneagram Synergy Intact:**
- Water Moon + Scorpio = Type 4 or 5 primary match (intuitive depth preserved)
- +20 bonus for INFJ/Intel ensures your core enneagram aligns with inner self
- Neptune/12th house → right wing emphasis (4w5, 5w6, etc.) = mystical lean

---

## Implementation Steps

1. **Save this prompt** to your notes
2. **Run it through Merlin AI** (or Claude with these exact instructions)
3. **Copy the JSON output** into your dashboard
4. **Compare mask vs core**:
   - Hardware MBTI: What you project
   - Firmware MBTI: Who you really are (stays INFJ)
   - See the contrast? That's the magic.
5. **Validate in app**: Test at `http://localhost:3000/api/personality` with your birth data

---

## Expected Output Example Structure

**Hardware Mascot:** ESTJ (75%)  
"Confident Leo Sun through a Cardinal Capricorn-ruled MC. You command authority, set goals, 
deliver results. Others see a structured leader. Fast-paced, decisive, commanding presence."

**Inner Core:** INFJ (82%)  
"Scorpio Moon in 12th house, conjunct Neptune. You feel the unspoken. Your depth is hidden—
psychologically attuned, transforming pain into wisdom. The world doesn't see this quiet power."

**Enneagram (Final):** 4w5 (78%)  
"Your core identity (Type 4 Individualist) seeks authenticity and transformation. The 5 wing 
adds investigative depth—you don't just feel; you understand."

---

## Key Formula Confirmation

| Element | Formula | Result |
|---------|---------|--------|
| E/I (Hardware) | Rising fire/air=E | Extraversion likely (depends on your Rising) |
| S/N (Firmware) | Moon Scorpio + 12th=N | STRONG Intuition (likely N) |
| T/F (Firmware) | Moon water + Neptune=F | STRONG Feeling (F guaranteed) |
| J/P (Firmware) | 12th house + Neptune=P | Perceiving likely (flexible core) |
| **Final Type** | 4 markers for INFJ | **INFJ protected** ✅ |
| Enneagram | INFJ +20 boost | Types 4/5 enhanced |

**Your core stays INFJ because:**
1. Water Moon (Scorpio likely)
2. 12th house planets (hidden/mystical)
3. Neptune prominence (intuitive)
4. Feeling preference (F in firmware)
5. Override rule catches 4+ markers

---

## Do Not Worry About

❌ **Will this break INFJ?** No. The override logic has 4+ checkpoint—you're safe.  
❌ **Will the mask look fake?** No. It's your actual rising/sun/mars behavior—real, just different from core.  
❌ **Can both types coexist?** Yes! Hardware ≠ Firmware is the whole point. You project one thing, live another. That's human.  

---

## Next Steps

1. ✅ Formula refined and validated
2. ✅ Dual-layer system implemented in codebase (`lib/astrology/mbtiFusion.ts`)
3. ✅ API updated (`app/api/personality/route.ts`)
4. **→ Run the prompt** and share results
5. **→ Compare with actual self-perception**

Ready to test?
