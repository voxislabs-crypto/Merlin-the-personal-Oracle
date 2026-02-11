// MBTI Overlay - Translates astrological themes into personality-specific language

export type MBTIType =
  | "INFJ"
  | "INFP"
  | "INTJ"
  | "INTP"
  | "ISFJ"
  | "ISFP"
  | "ISTJ"
  | "ISTP"
  | "ENFJ"
  | "ENFP"
  | "ENTJ"
  | "ENTP"
  | "ESFJ"
  | "ESFP"
  | "ESTJ"
  | "ESTP"

export interface MBTIOverlay {
  mbtiType: MBTIType
  theme: string
  guidance: string
}

// MBTI-specific guidance for different themes
const mbtiFilters: Record<string, Record<string, string>> = {
  // INFJ guidance
  Relationships: {
    INFJ:
      "As an INFJ, you internalize relationship tension deeply. Use your intuitive strengths to see beneath surface conflicts.",
    ESTP: "As an ESTP, relationship friction may feel more tangible. Channel energy into action rather than rumination.",
    INTJ: "As an INTJ, analyze relationship patterns logically. Your strategic mind can navigate complex dynamics.",
    ENFP: "As an ENFP, embrace emotional authenticity. Your warmth helps dissolve barriers others build.",
    ISTJ: "As an ISTJ, honor commitments even when challenged. Your reliability is your relationship superpower.",
  },

  Career: {
    INFJ: "Career pressures may feel existential. Trust your vision while building practical foundations.",
    ESTP: "Career challenges call for bold action. Trust your instincts and move decisively.",
    INTJ: "As an INTJ, your strategic mind thrives under challenge. Build systems to support long-term goals.",
    ENFP: "Career shifts can feel exciting. Balance enthusiasm with practical follow-through.",
    ISTJ: "Structure and dedication are your strengths. Maintain focus through uncertain times.",
  },

  Transformation: {
    INFJ: "Transformation aligns with your soul's purpose. Embrace the depth of change rather than resisting.",
    ESTP: "Change energizes you. Channel transformation into tangible actions and new experiences.",
    INTJ: "Strategic reinvention is your zone. Plan transformation with precision while staying adaptable.",
    ENFP: "You thrive in metamorphosis. Trust the process and let your authentic self emerge.",
    ISTJ: "Change may feel disruptive. Ground yourself in routines while integrating new perspectives.",
  },

  Spirituality: {
    INFJ: "Spiritual themes resonate deeply. Your intuition opens doors to transcendent experiences.",
    ESTP: "Spirituality through action—serve, create, experience. Embodied practice suits you.",
    INTJ: "Explore spirituality intellectually. Systems thinking can unlock mystical insights.",
    ENFP: "Your spirit soars in possibility. Connect theory to felt experience for deeper meaning.",
    ISTJ: "Ground spiritual concepts in tradition and practice. Consistency deepens connection.",
  },

  "Home & Family": {
    INFJ: "Family dynamics carry emotional weight. Honor boundaries while offering compassion.",
    ESTP: "Home needs practical attention. Handle family matters with direct, honest communication.",
    INTJ: "Structure family life intentionally. Your planning creates stability for loved ones.",
    ENFP: "Family connections thrive on warmth. Balance enthusiasm with listening deeply.",
    ISTJ: "Your dependability anchors family. Consistency provides security for those you love.",
  },

  "Mental Focus": {
    INFJ: "Mental clarity comes through solitude and reflection. Trust your inner knowing.",
    ESTP: "Think by doing. Physical activity sharpens mental focus and decision-making.",
    INTJ: "Your analytical mind excels here. Organize thoughts systematically for breakthroughs.",
    ENFP: "Ideas flow abundantly. Capture insights before they scatter—structure aids creativity.",
    ISTJ: "Methodical thinking is your strength. Break complex problems into manageable steps.",
  },

  Opportunities: {
    INFJ: "Opportunities aligned with purpose feel magnetic. Trust intuition about timing.",
    ESTP: "Seize opportunities boldly. Your ability to act fast creates advantage.",
    INTJ: "Evaluate opportunities strategically. Not every opening fits your master plan.",
    ENFP: "Many paths call to you. Choose opportunities that align with core values.",
    ISTJ: "Assess opportunities cautiously. Build on proven foundations rather than chasing novelty.",
  },
}

/**
 * Apply MBTI overlay to a theme
 * Returns personalized guidance string
 */
export function applyMBTIOverlay(theme: string, mbtiType: MBTIType): string {
  const themeGuidance = mbtiFilters[theme]

  if (!themeGuidance) {
    return `As a ${mbtiType}, bring your unique strengths to this ${theme.toLowerCase()} situation.`
  }

  const guidance = themeGuidance[mbtiType]

  if (!guidance) {
    // Fallback based on cognitive functions
    const isFe = ["ENFJ", "ESFJ", "INFJ", "ISFJ"].includes(mbtiType)
    const isTe = ["ENTJ", "ESTJ", "INTJ", "ISTJ"].includes(mbtiType)
    const isFi = ["ENFP", "ESFP", "INFP", "ISFP"].includes(mbtiType)
    const isTi = ["ENTP", "ESTP", "INTP", "ISTP"].includes(mbtiType)

    if (isFe) {
      return `As a ${mbtiType}, consider how this ${theme.toLowerCase()} situation affects those around you. Your empathy is a strength.`
    } else if (isTe) {
      return `As a ${mbtiType}, organize this ${theme.toLowerCase()} challenge systematically. Your strategic thinking creates clarity.`
    } else if (isFi) {
      return `As a ${mbtiType}, honor your values in this ${theme.toLowerCase()} area. Authenticity guides your best decisions.`
    } else if (isTi) {
      return `As a ${mbtiType}, analyze this ${theme.toLowerCase()} situation logically. Understanding the mechanics reveals solutions.`
    }
  }

  return (
    guidance ||
    `As a ${mbtiType}, apply your natural strengths to navigate this ${theme.toLowerCase()} theme with confidence.`
  )
}

/**
 * Get MBTI guidance for multiple themes
 */
export function getMBTIGuidanceForAspects(themes: string[], mbtiType: MBTIType): MBTIOverlay[] {
  return themes.map((theme) => ({
    mbtiType,
    theme,
    guidance: applyMBTIOverlay(theme, mbtiType),
  }))
}

/**
 * Format MBTI guidance for display
 */
export function formatMBTIGuidance(overlay: MBTIOverlay): string {
  return `*${overlay.theme}:* ${overlay.guidance}`
}

/**
 * Get MBTI type description
 */
export function getMBTITypeDescription(mbtiType: MBTIType): string {
  const descriptions: Record<MBTIType, string> = {
    INFJ: "The Advocate - Intuitive, empathetic, visionary",
    INFP: "The Mediator - Idealistic, compassionate, creative",
    INTJ: "The Architect - Strategic, analytical, independent",
    INTP: "The Logician - Theoretical, innovative, curious",
    ISFJ: "The Defender - Practical, caring, traditional",
    ISFP: "The Adventurer - Artistic, sensitive, flexible",
    ISTJ: "The Logistician - Reliable, factual, organized",
    ISTP: "The Virtuoso - Practical, observant, adaptable",
    ENFJ: "The Protagonist - Charismatic, inspiring, altruistic",
    ENFP: "The Campaigner - Enthusiastic, creative, spontaneous",
    ENTJ: "The Commander - Bold, strategic, strong-willed",
    ENTP: "The Debater - Clever, curious, intellectually playful",
    ESFJ: "The Consul - Caring, social, organized",
    ESFP: "The Entertainer - Energetic, spontaneous, friendly",
    ESTJ: "The Executive - Practical, decisive, traditional",
    ESTP: "The Entrepreneur - Bold, perceptive, action-oriented",
  }

  return descriptions[mbtiType] || mbtiType
}

/**
 * Get personality badge text for UI
 */
export function getPersonalityBadgeText(mbtiType: MBTIType): string {
  return mbtiType.split("").join(" · ")
}
