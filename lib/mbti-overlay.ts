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

// MBTI-specific guidance for different themes — all 16 types, all 7 themes.
const mbtiFilters: Record<string, Record<string, string>> = {
  Relationships: {
    INFJ: "As an INFJ, you internalize relationship tension deeply. Use your intuitive strengths to see beneath surface conflicts.",
    INFP: "As an INFP, relationships live or die on authenticity. Speak your truth gently, and let others meet you there.",
    INTJ: "As an INTJ, analyze relationship patterns logically. Your strategic mind can navigate complex dynamics.",
    INTP: "As an INTP, relationships puzzle you until you map them. Name the pattern, then decide if it deserves your energy.",
    ISFJ: "As an ISFJ, honor commitments even when challenged. Your reliability is your relationship superpower.",
    ISFP: "As an ISFP, love shows up in quiet gestures. Don't over-explain your care — let it be felt.",
    ISTJ: "As an ISTJ, consistency is how you say I love you. Keep your word and the bond holds.",
    ISTP: "As an ISTP, closeness comes through shared action, not long talks. Do something together and the rest follows.",
    ENFJ: "As an ENFJ, you read the room before you read yourself. Make sure your own needs get a seat at the table too.",
    ENFP: "As an ENFP, embrace emotional authenticity. Your warmth helps dissolve barriers others build.",
    ENTJ: "As an ENTJ, lead with clarity and follow through. Partners respect decisiveness more than perfection.",
    ENTP: "As an ENTP, debate is foreplay for you. Just make sure the other person knows it's play, not war.",
    ESFJ: "As an ESFJ, you hold the group together. Remember the people holding you matter just as much.",
    ESFP: "As an ESFP, joy is your love language. Share it freely, and let others join the fun on their terms.",
    ESTJ: "As an ESTJ, structure keeps relationships steady. Set expectations clearly and keep them.",
    ESTP: "As an ESTP, relationship friction may feel more tangible. Channel energy into action rather than rumination.",
  },

  Career: {
    INFJ: "Career pressures may feel existential. Trust your vision while building practical foundations.",
    INFP: "Career shifts can feel like betraying your values. Choose work that lets your ideals breathe, even in small doses.",
    INTJ: "As an INTJ, your strategic mind thrives under challenge. Build systems to support long-term goals.",
    INTP: "As an INTP, you excel when the problem is open-ended. Protect your deep-work time from meetings that drain it.",
    ISFJ: "Structure and dedication are your strengths. Maintain focus through uncertain times.",
    ISFP: "As an ISFP, craft matters more than title. Find a role where your hands and taste get to show.",
    ISTJ: "As an ISTJ, climb by being the person who always delivers. Competence compounds quietly.",
    ISTP: "As an ISTP, you learn tools faster than most. Master one, then let results speak for you.",
    ENFJ: "As an ENFJ, you rise by lifting others. Just don't forget to build a ladder for yourself too.",
    ENFP: "Career shifts can feel exciting. Balance enthusiasm with practical follow-through.",
    ENTJ: "As an ENTJ, take the lead and own the outcome. Your drive clears paths others hesitate on.",
    ENTP: "As an ENTP, you thrive on the new and the contested. Pitch the idea, then let someone else run the ops.",
    ESFJ: "As an ESFJ, you succeed in roles that serve people directly. Visibility and appreciation fuel you.",
    ESFP: "As an ESFP, performance is your playground. Put yourself where energy and audience meet.",
    ESTJ: "As an ESTJ, organize the chaos and you'll be the one they promote. Systems are your superpower.",
    ESTP: "Career challenges call for bold action. Trust your instincts and move decisively.",
  },

  Transformation: {
    INFJ: "Transformation aligns with your soul's purpose. Embrace the depth of change rather than resisting.",
    INFP: "As an INFP, change feels like shedding a skin that no longer fits. Trust the discomfort — it's the signal you're growing.",
    INTJ: "Strategic reinvention is your zone. Plan transformation with precision while staying adaptable.",
    INTP: "As an INTP, transformation starts in the mind. Question the old model until a better one assembles itself.",
    ISFJ: "Change may feel disruptive. Ground yourself in routines while integrating new perspectives.",
    ISFP: "As an ISFP, let transformation be felt, not forced. Move at the pace your body and heart allow.",
    ISTJ: "As an ISTJ, change lands best when it's earned. Take it one proven step at a time.",
    ISTP: "As an ISTP, transformation is hands-on. Build the new version of yourself through trial and repair.",
    ENFJ: "As an ENFJ, you transform by helping others transform. Just schedule your own renewal too.",
    ENFP: "You thrive in metamorphosis. Trust the process and let your authentic self emerge.",
    ENTJ: "As an ENTJ, treat transformation like a campaign. Set the target, mobilize, and don't look back.",
    ENTP: "As an ENTP, you reinvent by arguing with your old self. Win the debate, then move on.",
    ESFJ: "As an ESFJ, transformation works when it's shared. Bring people along rather than going alone.",
    ESFP: "As an ESFP, change is a performance you get to direct. Make it vivid and let it land.",
    ESTJ: "As an ESTJ, transformation means upgrading the system. Replace what fails, keep what works.",
    ESTP: "Change energizes you. Channel transformation into tangible actions and new experiences.",
  },

  Spirituality: {
    INFJ: "Spiritual themes resonate deeply. Your intuition opens doors to transcendent experiences.",
    INFP: "As an INFP, spirituality is a private conversation with meaning. Protect that inner sanctuary.",
    INTJ: "Explore spirituality intellectually. Systems thinking can unlock mystical insights.",
    INTP: "As an INTP, approach the sacred like a hypothesis. Test it, refine it, keep what's elegant.",
    ISFJ: "Ground spiritual concepts in tradition and practice. Consistency deepens connection.",
    ISFP: "As an ISFP, the sacred lives in beauty and sensation. Art, nature, and ritual are your temples.",
    ISTJ: "As an ISTJ, faith is built through repetition. Show up, do the practice, let depth accumulate.",
    ISTP: "As an ISTP, spirituality is embodied. Move, build, observe — the body knows before the mind does.",
    ENFJ: "As an ENFJ, you channel spirit through people. Service is your prayer.",
    ENFP: "Your spirit soars in possibility. Connect theory to felt experience for deeper meaning.",
    ENTJ: "As an ENTJ, treat the spiritual life like a mission. Define the purpose, then execute with discipline.",
    ENTP: "As an ENTP, question every doctrine until one survives. The surviving one is yours.",
    ESFJ: "As an ESFJ, spirituality thrives in community. Shared ritual multiplies meaning.",
    ESFP: "As an ESFP, the divine shows up in the moment. Celebrate it loudly and often.",
    ESTJ: "As an ESTJ, honor the forms and the lineage. Structure is how you keep faith alive.",
    ESTP: "Spirituality through action — serve, create, experience. Embodied practice suits you.",
  },

  "Home & Family": {
    INFJ: "Family dynamics carry emotional weight. Honor boundaries while offering compassion.",
    INFP: "As an INFP, home is where your values get to rest. Keep it a place that feels like you.",
    INTJ: "Structure family life intentionally. Your planning creates stability for loved ones.",
    INTP: "As an INTP, keep the household running on systems, not moods. Efficiency is a form of care.",
    ISFJ: "Your dependability anchors family. Consistency provides security for those you love.",
    ISFP: "As an ISFP, make the home a canvas. Beauty and comfort are how you nurture.",
    ISTJ: "As an ISTJ, the household runs on your word. Keep it, and everyone feels safe.",
    ISTP: "As an ISTP, show love by fixing, building, and maintaining. Hands-on care speaks loudest.",
    ENFJ: "As an ENFJ, you hold the family together emotionally. Just let someone hold you sometimes.",
    ENFP: "Family connections thrive on warmth. Balance enthusiasm with listening deeply.",
    ENTJ: "As an ENTJ, run the household like a well-led team. Clear roles, clear expectations.",
    ENTP: "As an ENTP, keep family life interesting. New ideas and playful debate keep it alive.",
    ESFJ: "As an ESFJ, you are the heart of the home. Make sure the heart gets fed too.",
    ESFP: "As an ESFP, fill the house with life and laughter. Joy is your family's glue.",
    ESTJ: "As an ESTJ, order at home is love in action. A well-run house is a well-loved one.",
    ESTP: "Home needs practical attention. Handle family matters with direct, honest communication.",
  },

  "Mental Focus": {
    INFJ: "Mental clarity comes through solitude and reflection. Trust your inner knowing.",
    INFP: "As an INFP, focus blooms in meaning. Attach your attention to something you care about and it holds.",
    INTJ: "Your analytical mind excels here. Organize thoughts systematically for breakthroughs.",
    INTP: "As an INTP, think by doing. Physical activity sharpens mental focus and decision-making.",
    ISFJ: "Methodical thinking is your strength. Break complex problems into manageable steps.",
    ISFP: "As an ISFP, focus follows feeling. Work on what moves you and the rest quiets down.",
    ISTJ: "As an ISTJ, concentration is a discipline you build. Routine sharpens the blade.",
    ISTP: "As an ISTP, your mind locks in when your hands are busy. Give it a task and it won't wander.",
    ENFJ: "As an ENFJ, focus comes through people and purpose. A cause you believe in holds your attention.",
    ENFP: "Ideas flow abundantly. Capture insights before they scatter — structure aids creativity.",
    ENTJ: "As an ENTJ, focus is a weapon. Point it at the goal and cut everything else away.",
    ENTP: "As an ENTP, novelty is your fuel. Rotate challenges so the mind never goes stale.",
    ESFJ: "As an ESFJ, focus thrives with accountability. A team or deadline keeps you sharp.",
    ESFP: "As an ESFP, focus is short and bright. Work in bursts, then recharge with movement.",
    ESTJ: "As an ESTJ, mental focus is trained, not gifted. Schedule it, protect it, repeat it.",
    ESTP: "Think by doing. Physical activity sharpens mental focus and decision-making.",
  },

  Opportunities: {
    INFJ: "Opportunities aligned with purpose feel magnetic. Trust intuition about timing.",
    INFP: "As an INFP, choose opportunities that let your values breathe. The right one will feel like coming home.",
    INTJ: "Evaluate opportunities strategically. Not every opening fits your master plan.",
    INTP: "As an INTP, weigh opportunities by elegance and upside. Skip the ones that bore you.",
    ISFJ: "Assess opportunities cautiously. Build on proven foundations rather than chasing novelty.",
    ISFP: "As an ISFP, take the opportunity that lets you create something real. Craft over status.",
    ISTJ: "As an ISTJ, test opportunities against track record. What worked before will work again.",
    ISTP: "As an ISTP, grab the hands-on opening. If you can touch it, fix it, or build it, it's worth a look.",
    ENFJ: "As an ENFJ, opportunities that serve others call to you. Take the ones that grow your reach.",
    ENFP: "Many paths call to you. Choose opportunities that align with core values.",
    ENTJ: "As an ENTJ, seize the opening that expands your territory. Move first, adjust later.",
    ENTP: "As an ENTP, bet on the unconventional opening. The weird one is usually the interesting one.",
    ESFJ: "As an ESFJ, take opportunities that put you among people. Connection is your advantage.",
    ESFP: "As an ESFP, jump on the lively opening. Energy and audience are your currency.",
    ESTJ: "As an ESTJ, choose the opportunity with a clear path to results. Execution is your edge.",
    ESTP: "Seize opportunities boldly. Your ability to act fast creates advantage.",
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
