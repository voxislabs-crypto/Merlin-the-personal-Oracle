// Resonance Database - In-memory storage for the learning system
// Replace with real database (Prisma, MongoDB, etc.) in production

import type {
  User,
  PersonalResonance,
  GlobalResonance,
  ClusterResonance,
  FeedbackLog,
  ResonanceStats,
  FeedbackData,
} from "./resonance-types"

// In-memory storage for prototype (replace with real database later)
class ResonanceDatabase {
  private users: Map<string, User> = new Map()
  private personalResonance: Map<string, PersonalResonance[]> = new Map()
  private globalResonance: Map<string, GlobalResonance> = new Map()
  private clusterResonance: Map<string, ClusterResonance[]> = new Map()
  private feedbackLogs: FeedbackLog[] = []

  // User Management
  async createUser(user: User): Promise<void> {
    this.users.set(user.userId, user)
    this.personalResonance.set(user.userId, [])
  }

  async getUser(userId: string): Promise<User | null> {
    return this.users.get(userId) || null
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const user = this.users.get(userId)
    if (user) {
      this.users.set(userId, { ...user, ...updates })
    }
  }

  // Personal Resonance
  async getPersonalResonance(userId: string, aspectId: string, theme: string): Promise<PersonalResonance | null> {
    const userResonance = this.personalResonance.get(userId) || []
    return userResonance.find((r) => r.aspectId === aspectId && r.theme === theme) || null
  }

  async updatePersonalResonance(
    userId: string,
    aspectId: string,
    theme: string,
    feedback: FeedbackData,
  ): Promise<void> {
    const userResonance = this.personalResonance.get(userId) || []
    const existingIndex = userResonance.findIndex((r) => r.aspectId === aspectId && r.theme === theme)

    if (existingIndex >= 0) {
      const existing = userResonance[existingIndex]
      const adjustment = feedback.resonated ? feedback.accuracyScore : -feedback.accuracyScore
      const learningRate = 0.1

      userResonance[existingIndex] = {
        ...existing,
        personalWeight: existing.personalWeight + learningRate * adjustment,
        confidence: Math.max(0, Math.min(1, existing.confidence + learningRate * adjustment * 0.5)),
        feedbackCount: existing.feedbackCount + 1,
      }
    } else {
      const initialWeight = feedback.resonated ? feedback.accuracyScore * 0.1 : -feedback.accuracyScore * 0.1
      userResonance.push({
        userId,
        aspectId,
        theme,
        personalWeight: initialWeight,
        confidence: feedback.accuracyScore,
        feedbackCount: 1,
      })
    }

    this.personalResonance.set(userId, userResonance)
  }

  // Global Resonance
  async getGlobalResonance(aspectId: string, theme: string): Promise<GlobalResonance | null> {
    const key = `${aspectId}_${theme}`
    return this.globalResonance.get(key) || null
  }

  async updateGlobalResonance(aspectId: string, theme: string, feedback: FeedbackData): Promise<void> {
    const key = `${aspectId}_${theme}`
    const existing = this.globalResonance.get(key)

    if (existing) {
      const adjustment = feedback.resonated ? feedback.accuracyScore : -feedback.accuracyScore
      const learningRate = 0.05 // Slower learning for global

      this.globalResonance.set(key, {
        ...existing,
        globalWeight: existing.globalWeight + learningRate * adjustment,
        confidence: Math.max(0, Math.min(1, existing.confidence + learningRate * adjustment * 0.3)),
        feedbackCount: existing.feedbackCount + 1,
      })
    } else {
      const initialWeight = feedback.resonated ? feedback.accuracyScore * 0.05 : -feedback.accuracyScore * 0.05
      this.globalResonance.set(key, {
        aspectId,
        theme,
        globalWeight: initialWeight,
        confidence: feedback.accuracyScore,
        feedbackCount: 1,
      })
    }
  }

  // Cluster Resonance
  async getClusterResonance(clusterId: string, aspectId: string, theme: string): Promise<ClusterResonance | null> {
    const clusterData = this.clusterResonance.get(clusterId) || []
    return clusterData.find((r) => r.aspectId === aspectId && r.theme === theme) || null
  }

  async updateClusterResonance(
    clusterId: string,
    aspectId: string,
    theme: string,
    feedback: FeedbackData,
  ): Promise<void> {
    const clusterData = this.clusterResonance.get(clusterId) || []
    const existingIndex = clusterData.findIndex((r) => r.aspectId === aspectId && r.theme === theme)

    if (existingIndex >= 0) {
      const existing = clusterData[existingIndex]
      const adjustment = feedback.resonated ? feedback.accuracyScore : -feedback.accuracyScore
      const learningRate = 0.08

      clusterData[existingIndex] = {
        ...existing,
        clusterWeight: existing.clusterWeight + learningRate * adjustment,
        confidence: Math.max(0, Math.min(1, existing.confidence + learningRate * adjustment * 0.4)),
        feedbackCount: existing.feedbackCount + 1,
      }
    } else {
      const initialWeight = feedback.resonated ? feedback.accuracyScore * 0.08 : -feedback.accuracyScore * 0.08
      clusterData.push({
        clusterId,
        aspectId,
        theme,
        clusterWeight: initialWeight,
        confidence: feedback.accuracyScore,
        feedbackCount: 1,
      })
    }

    this.clusterResonance.set(clusterId, clusterData)
  }

  // Feedback Logs
  async logFeedback(feedbackLog: FeedbackLog): Promise<void> {
    this.feedbackLogs.push(feedbackLog)
  }

  async getFeedbackHistory(userId: string, limit: number = 50): Promise<FeedbackLog[]> {
    return this.feedbackLogs
      .filter((log) => log.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit)
  }

  // Resonance Stats Calculation
  async getResonanceStats(userId: string, aspectId: string, theme: string): Promise<ResonanceStats> {
    const user = await this.getUser(userId)
    const personal = await this.getPersonalResonance(userId, aspectId, theme)
    const global = await this.getGlobalResonance(aspectId, theme)

    let cluster = null
    if (user?.mbtiType) {
      cluster = await this.getClusterResonance(user.mbtiType, aspectId, theme)
    }

    return {
      personal: personal
        ? {
            weight: personal.personalWeight,
            confidence: personal.confidence,
            feedbackCount: personal.feedbackCount,
          }
        : undefined,
      cluster: cluster
        ? {
            weight: cluster.clusterWeight,
            confidence: cluster.confidence,
            feedbackCount: cluster.feedbackCount,
          }
        : undefined,
      global: global
        ? {
            weight: global.globalWeight,
            confidence: global.confidence,
            feedbackCount: global.feedbackCount,
          }
        : {
            weight: 0,
            confidence: 0.5,
            feedbackCount: 0,
          },
    }
  }

  // Calculate Final Weight
  async calculateFinalWeight(userId: string, aspectId: string, theme: string, baseWeight: number): Promise<number> {
    const stats = await this.getResonanceStats(userId, aspectId, theme)

    // Personalization factors
    const alpha = 0.6 // Personal weight
    const beta = 0.25 // Cluster weight
    const gamma = 0.15 // Global weight

    const personalWeight = stats.personal?.weight || 0
    const clusterWeight = stats.cluster?.weight || 0
    const globalWeight = stats.global.weight

    return baseWeight + alpha * personalWeight + beta * clusterWeight + gamma * globalWeight
  }

  // Process Feedback
  async processFeedback(userId: string, aspectId: string, theme: string, feedback: FeedbackData): Promise<void> {
    const user = await this.getUser(userId)

    // Log the feedback
    const feedbackLog: FeedbackLog = {
      feedbackId: `${userId}_${aspectId}_${Date.now()}`,
      userId,
      aspectId,
      theme,
      date: new Date().toISOString().split("T")[0],
      orb: 0, // Would be filled from actual transit data
      confidenceScore: 0.8, // Would be filled from engine confidence
      resonated: feedback.resonated,
      accuracyScore: feedback.accuracyScore,
      notes: feedback.notes,
    }

    await this.logFeedback(feedbackLog)

    // Update all resonance levels
    await this.updatePersonalResonance(userId, aspectId, theme, feedback)

    if (user?.mbtiType) {
      await this.updateClusterResonance(user.mbtiType, aspectId, theme, feedback)
    }

    await this.updateGlobalResonance(aspectId, theme, feedback)
  }

  // User Accuracy Stats
  async getUserAccuracyStats(
    userId: string,
    days: number = 30,
  ): Promise<{
    overallAccuracy: number
    totalFeedbacks: number
    strongestResonances: Array<{ aspectId: string; theme: string; accuracy: number }>
    weakestResonances: Array<{ aspectId: string; theme: string; accuracy: number }>
  }> {
    const recentFeedback = await this.getFeedbackHistory(userId, 1000)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const relevantFeedback = recentFeedback.filter((log) => new Date(log.date) >= cutoffDate)

    if (relevantFeedback.length === 0) {
      return {
        overallAccuracy: 0,
        totalFeedbacks: 0,
        strongestResonances: [],
        weakestResonances: [],
      }
    }

    const overallAccuracy =
      relevantFeedback.reduce((sum, log) => sum + (log.resonated ? log.accuracyScore : 0), 0) / relevantFeedback.length

    // Group by aspect-theme combinations
    const aspectThemeStats = new Map<string, { total: number; resonated: number; accuracy: number }>()

    relevantFeedback.forEach((log) => {
      const key = `${log.aspectId}_${log.theme}`
      const existing = aspectThemeStats.get(key) || { total: 0, resonated: 0, accuracy: 0 }

      aspectThemeStats.set(key, {
        total: existing.total + 1,
        resonated: existing.resonated + (log.resonated ? 1 : 0),
        accuracy: existing.accuracy + log.accuracyScore,
      })
    })

    const sortedStats = Array.from(aspectThemeStats.entries())
      .map(([key, stats]) => {
        const [aspectId, theme] = key.split("_")
        return {
          aspectId,
          theme,
          accuracy: stats.accuracy / stats.total,
        }
      })
      .sort((a, b) => b.accuracy - a.accuracy)

    return {
      overallAccuracy,
      totalFeedbacks: relevantFeedback.length,
      strongestResonances: sortedStats.slice(0, 5),
      weakestResonances: sortedStats.slice(-5).reverse(),
    }
  }
}

// Singleton instance
export const resonanceDB = new ResonanceDatabase()

// Initialize with some mock data for demonstration
export async function initializeMockData() {
  // Create a sample user
  await resonanceDB.createUser({
    userId: "user_1",
    mbtiType: "INFJ",
    enneagramType: "2",
    big5: {
      O: 0.72,
      C: 0.65,
      E: 0.31,
      A: 0.84,
      N: 0.76,
    },
    createdAt: new Date(),
  })

  // Add some sample global resonance data
  await resonanceDB.updateGlobalResonance("moon_square_saturn", "Relationships", {
    resonated: true,
    accuracyScore: 0.82,
  })

  await resonanceDB.updateGlobalResonance("sun_opposition_saturn", "Career", {
    resonated: true,
    accuracyScore: 0.75,
  })
}
