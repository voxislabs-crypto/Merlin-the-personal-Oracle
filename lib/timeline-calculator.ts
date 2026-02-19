import type { MBTIType } from "./mbti-system"

export interface TimelineEvent {
 id: string
  year: number
  month?: number
  title: string
  description: string
  type: "saturn" | "jupiter" | "uranus" | "neptune" | "pluto" | "chiron" | "major"
  intensity: "low" | "medium" | "high"
  theme: string
  advice: string
  mbtiAdvice?: Record<MBTIType, string>
}

export interface YearlyTheme {
  year: number
  title: string
  description: string
  keyEvents: TimelineEvent[]
  overallTone: "challenging" | "growth" | "transformation" | "stability" | "expansion"
  mbtiGuidance?: Record<MBTIType, string>
}

// Mock timeline data - in production this would be calculated from birth data
export function generateTimeline(birthYear: number, _mbtiType?: MBTIType): YearlyTheme[] {
  const currentYear = new Date().getFullYear()
  const timeline: YearlyTheme[] = []

  for (let year = currentYear; year <= currentYear + 3; year++) {
    const yearAge = year - birthYear
    const events: TimelineEvent[] = []

    // Saturn cycles (every ~29 years)
    if (yearAge % 29 === 0 || Math.abs((yearAge % 29) - 29) <= 1) {
      events.push({
        id: `saturn-${year}`,
        year,
        title: "Saturn Return",
        description: "Major life restructuring and maturity test. Time to build solid foundations.",
        type: "saturn",
        intensity: "high",
        theme: "Responsibility & Structure",
        advice: "Embrace accountability, simplify your life, and commit to long-term goals.",
        mbtiAdvice: {
          INTJ: "Use this time to refine your strategic vision and eliminate inefficiencies.",
          INFJ: "Focus on aligning your ideals with practical reality. Set healthy boundaries.",
          ENTJ: "Apply your leadership skills to restructure your life for maximum efficiency.",
          ENFJ: "Balance serving others with building structures that support your own growth.",
          ENTP: "Channel your ideas into concrete structures. Follow through is essential now.",
          ENFP: "Ground your enthusiasm in realistic commitments. Quality over quantity.",
          ISTJ: "This energy aligns with your nature. Build systems that will serve you long-term.",
          ISFJ: "Don't take on everyone else's responsibilities. Focus on your own growth.",
          ESTJ: "Perfect time for organizational restructuring and leadership development.",
          ESFJ: "Balance helping others with taking care of your own foundational needs.",
          ISTP: "Develop sustainable routines without sacrificing your independence.",
          ISFP: "Create stability while honoring your need for creative expression.",
          ESTP: "Time to add structure to your dynamic lifestyle. Build something lasting.",
          ESFP: "Balance spontaneity with responsible planning. Establish stable foundations.",
          INTP: "Translate your theories into practical applications. Commitment is key.",
          INFP: "Ground your ideals in reality. Set boundaries and honor your limits."
        }
      })
    }

    // Jupiter expansion (every ~12 years)
    if (yearAge % 12 === 0) {
      events.push({
        id: `jupiter-${year}`,
        year,
        title: "Jupiter Return",
        description: "Major growth opportunity and expansion. Lucky breaks and new horizons.",
        type: "jupiter",
        intensity: "medium",
        theme: "Growth & Opportunity",
        advice: "Take calculated risks, expand your worldview, and seize opportunities."
      })
    }

    // Uranus awakening (every ~84 years, transitions at ~42)
    if (yearAge === 42 || yearAge === 41) {
      events.push({
        id: `uranus-${year}`,
        year,
        title: "Uranus Opposition",
        description: "Mid-life awakening. Time to break free from limitations and reinvent yourself.",
        type: "uranus",
        intensity: "high",
        theme: "Liberation & Reinvention",
        advice: "Embrace change, question everything, and pursue authentic self-expression."
      })
    }

    if (events.length === 0) {
      events.push({
        id: `general-${year}`,
        year,
        title: "General Transits",
        description: "Steady year with typical astrological influences.",
        type: "major",
        intensity: "low",
        theme: "Personal Evolution",
        advice: "Focus on consistent progress and maintaining balance."
      })
    }

    const overallTone: YearlyTheme["overallTone"] = 
      events.some(e => e.type === "saturn") ? "challenging" :
      events.some(e => e.type === "jupiter") ? "expansion" :
      events.some(e => e.type === "uranus") ? "transformation" :
      "stability"

    timeline.push({
      year,
      title: `Year ${year}`,
      description: events[0].description,
      keyEvents: events,
      overallTone
    })
  }

  return timeline
}

export function getTimelineAdvice(event: TimelineEvent, mbtiType?: MBTIType): string {
  if (mbtiType && event.mbtiAdvice?.[mbtiType]) {
    return event.mbtiAdvice[mbtiType]
  }
  return event.advice
}
