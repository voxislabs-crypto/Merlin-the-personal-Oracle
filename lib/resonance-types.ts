// Resonance Types - TypeScript interfaces for the resonance learning system

export interface User {
  userId: string
  mbtiType?: string
  enneagramType?: string
  big5?: {
    O: number // Openness
    C: number // Conscientiousness
    E: number // Extraversion
    A: number // Agreeableness
    N: number // Neuroticism
  }
  createdAt: Date
}

export interface Aspect {
  aspectId: string
  planet1: string
  planet2: string
  aspectType: string
  baseWeight: number
}

export interface PersonalResonance {
  userId: string
  aspectId: string
  theme: string
  personalWeight: number
  confidence: number
  feedbackCount: number
}

export interface GlobalResonance {
  aspectId: string
  theme: string
  globalWeight: number
  confidence: number
  feedbackCount: number
}

export interface ClusterResonance {
  clusterId: string
  aspectId: string
  theme: string
  clusterWeight: number
  confidence: number
  feedbackCount: number
}

export interface FeedbackLog {
  feedbackId: string
  userId: string
  aspectId: string
  theme: string
  date: string
  orb: number
  confidenceScore: number
  resonated: boolean
  accuracyScore: number
  notes?: string
}

export interface ResonanceStats {
  personal?: {
    weight: number
    confidence: number
    feedbackCount: number
  }
  cluster?: {
    weight: number
    confidence: number
    feedbackCount: number
  }
  global: {
    weight: number
    confidence: number
    feedbackCount: number
  }
}

export interface FeedbackData {
  resonated: boolean
  accuracyScore: number
  notes?: string
}

export interface TransitWithResonance {
  transitId: string
  planet1: string
  planet2: string
  aspect: string
  orb: number
  confidenceScore: number
  theme: string
  themeScore: number
  filtersApplied: {
    mbti?: string
    enneagram?: string
    big5?: User["big5"]
  }
  resonanceStats?: ResonanceStats
  feedback?: FeedbackData
}
