import 'server-only';

import type {
  User,
  PersonalResonance,
  GlobalResonance,
  ClusterResonance,
  FeedbackLog,
  ResonanceStats,
  FeedbackData,
} from './resonance-types';
import { hasPrismaDelegate, hasResonanceStore, prisma } from '@/lib/prisma';
import { isPrismaStoreUnavailableError } from '@/lib/prisma-errors';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function serializeBig5(big5?: User['big5']): string | null {
  return big5 ? JSON.stringify(big5) : null;
}

function deserializeBig5(big5Json?: string | null): User['big5'] | undefined {
  if (!big5Json) return undefined;
  try {
    return JSON.parse(big5Json) as User['big5'];
  } catch {
    return undefined;
  }
}

class ResonanceDatabase {
  private isStoreReady(): boolean {
    return hasResonanceStore();
  }

  async createUser(user: User): Promise<void> {
    await prisma.resonanceUser.create({
      data: {
        userId: user.userId,
        mbtiType: user.mbtiType,
        enneagramType: user.enneagramType,
        big5Json: serializeBig5(user.big5),
        createdAt: user.createdAt,
      },
    });
  }

  async getUser(userId: string): Promise<User | null> {
    if (!hasPrismaDelegate('resonanceUser')) return null;

    const user = await prisma.resonanceUser.findUnique({ where: { userId } });
    if (!user) return null;

    return {
      userId: user.userId,
      mbtiType: user.mbtiType || undefined,
      enneagramType: user.enneagramType || undefined,
      big5: deserializeBig5(user.big5Json),
      createdAt: user.createdAt,
    };
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    await prisma.resonanceUser.update({
      where: { userId },
      data: {
        mbtiType: updates.mbtiType,
        enneagramType: updates.enneagramType,
        big5Json: updates.big5 ? serializeBig5(updates.big5) : undefined,
      },
    });
  }

  async ensureUser(user: User): Promise<void> {
    await prisma.resonanceUser.upsert({
      where: { userId: user.userId },
      create: {
        userId: user.userId,
        mbtiType: user.mbtiType,
        enneagramType: user.enneagramType,
        big5Json: serializeBig5(user.big5),
        createdAt: user.createdAt,
      },
      update: {
        mbtiType: user.mbtiType ?? undefined,
        enneagramType: user.enneagramType ?? undefined,
        big5Json: user.big5 ? serializeBig5(user.big5) : undefined,
      },
    });
  }

  async getPersonalResonance(userId: string, aspectId: string, theme: string): Promise<PersonalResonance | null> {
    if (!hasPrismaDelegate('personalResonanceRecord')) return null;

    const record = await prisma.personalResonanceRecord.findUnique({
      where: { userId_aspectId_theme: { userId, aspectId, theme } },
    });
    if (!record) return null;

    return {
      userId: record.userId,
      aspectId: record.aspectId,
      theme: record.theme,
      personalWeight: record.personalWeight,
      confidence: record.confidence,
      feedbackCount: record.feedbackCount,
    };
  }

  async updatePersonalResonance(userId: string, aspectId: string, theme: string, feedback: FeedbackData): Promise<void> {
    const existing = await this.getPersonalResonance(userId, aspectId, theme);
    const adjustment = feedback.resonated ? feedback.accuracyScore : -feedback.accuracyScore;
    const learningRate = 0.1;

    if (existing) {
      await prisma.personalResonanceRecord.update({
        where: { userId_aspectId_theme: { userId, aspectId, theme } },
        data: {
          personalWeight: existing.personalWeight + learningRate * adjustment,
          confidence: clamp(existing.confidence + learningRate * adjustment * 0.5, 0, 1),
          feedbackCount: existing.feedbackCount + 1,
        },
      });
      return;
    }

    const initialWeight = feedback.resonated ? feedback.accuracyScore * 0.1 : -feedback.accuracyScore * 0.1;
    await prisma.personalResonanceRecord.create({
      data: {
        userId,
        aspectId,
        theme,
        personalWeight: initialWeight,
        confidence: feedback.accuracyScore,
        feedbackCount: 1,
      },
    });
  }

  async getGlobalResonance(aspectId: string, theme: string): Promise<GlobalResonance | null> {
    if (!hasPrismaDelegate('globalResonanceRecord')) return null;

    const record = await prisma.globalResonanceRecord.findUnique({
      where: { aspectId_theme: { aspectId, theme } },
    });
    if (!record) return null;

    return {
      aspectId: record.aspectId,
      theme: record.theme,
      globalWeight: record.globalWeight,
      confidence: record.confidence,
      feedbackCount: record.feedbackCount,
    };
  }

  async updateGlobalResonance(aspectId: string, theme: string, feedback: FeedbackData): Promise<void> {
    const existing = await this.getGlobalResonance(aspectId, theme);
    const adjustment = feedback.resonated ? feedback.accuracyScore : -feedback.accuracyScore;
    const learningRate = 0.05;

    if (existing) {
      await prisma.globalResonanceRecord.update({
        where: { aspectId_theme: { aspectId, theme } },
        data: {
          globalWeight: existing.globalWeight + learningRate * adjustment,
          confidence: clamp(existing.confidence + learningRate * adjustment * 0.3, 0, 1),
          feedbackCount: existing.feedbackCount + 1,
        },
      });
      return;
    }

    const initialWeight = feedback.resonated ? feedback.accuracyScore * 0.05 : -feedback.accuracyScore * 0.05;
    await prisma.globalResonanceRecord.create({
      data: {
        aspectId,
        theme,
        globalWeight: initialWeight,
        confidence: feedback.accuracyScore,
        feedbackCount: 1,
      },
    });
  }

  async getClusterResonance(clusterId: string, aspectId: string, theme: string): Promise<ClusterResonance | null> {
    if (!hasPrismaDelegate('clusterResonanceRecord')) return null;

    const record = await prisma.clusterResonanceRecord.findUnique({
      where: { clusterId_aspectId_theme: { clusterId, aspectId, theme } },
    });
    if (!record) return null;

    return {
      clusterId: record.clusterId,
      aspectId: record.aspectId,
      theme: record.theme,
      clusterWeight: record.clusterWeight,
      confidence: record.confidence,
      feedbackCount: record.feedbackCount,
    };
  }

  async updateClusterResonance(clusterId: string, aspectId: string, theme: string, feedback: FeedbackData): Promise<void> {
    const existing = await this.getClusterResonance(clusterId, aspectId, theme);
    const adjustment = feedback.resonated ? feedback.accuracyScore : -feedback.accuracyScore;
    const learningRate = 0.08;

    if (existing) {
      await prisma.clusterResonanceRecord.update({
        where: { clusterId_aspectId_theme: { clusterId, aspectId, theme } },
        data: {
          clusterWeight: existing.clusterWeight + learningRate * adjustment,
          confidence: clamp(existing.confidence + learningRate * adjustment * 0.4, 0, 1),
          feedbackCount: existing.feedbackCount + 1,
        },
      });
      return;
    }

    const initialWeight = feedback.resonated ? feedback.accuracyScore * 0.08 : -feedback.accuracyScore * 0.08;
    await prisma.clusterResonanceRecord.create({
      data: {
        clusterId,
        aspectId,
        theme,
        clusterWeight: initialWeight,
        confidence: feedback.accuracyScore,
        feedbackCount: 1,
      },
    });
  }

  async logFeedback(feedbackLog: FeedbackLog & { scoreBefore?: number; scoreAfter?: number; userRating?: number }): Promise<void> {
    await prisma.resonanceFeedbackRecord.create({
      data: {
        feedbackId: feedbackLog.feedbackId,
        userId: feedbackLog.userId,
        aspectId: feedbackLog.aspectId,
        theme: feedbackLog.theme,
        date: new Date(feedbackLog.date),
        orb: feedbackLog.orb,
        confidenceScore: feedbackLog.confidenceScore,
        resonated: feedbackLog.resonated,
        accuracyScore: feedbackLog.accuracyScore,
        notes: feedbackLog.notes,
        scoreBefore: feedbackLog.scoreBefore,
        scoreAfter: feedbackLog.scoreAfter,
        userRating: feedbackLog.userRating,
      },
    });
  }

  async getFeedbackHistory(userId: string, limit: number = 50): Promise<FeedbackLog[]> {
    if (!this.isStoreReady()) {
      return [];
    }

    try {
      const rows = await prisma.resonanceFeedbackRecord.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: limit,
      });

      return rows.map((row) => ({
        feedbackId: row.feedbackId,
        userId: row.userId,
        aspectId: row.aspectId,
        theme: row.theme,
        date: row.date.toISOString(),
        orb: row.orb,
        confidenceScore: row.confidenceScore,
        resonated: row.resonated,
        accuracyScore: row.accuracyScore,
        notes: row.notes || undefined,
      }));
    } catch (error) {
      if (isPrismaStoreUnavailableError(error)) {
        return [];
      }
      throw error;
    }
  }

  async getResonanceStats(userId: string, aspectId: string, theme: string): Promise<ResonanceStats> {
    const user = await this.getUser(userId);
    const personal = await this.getPersonalResonance(userId, aspectId, theme);
    const global = await this.getGlobalResonance(aspectId, theme);
    const cluster = user?.mbtiType ? await this.getClusterResonance(user.mbtiType, aspectId, theme) : null;

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
    };
  }

  async calculateFinalWeight(userId: string, aspectId: string, theme: string, baseWeight: number): Promise<number> {
    const stats = await this.getResonanceStats(userId, aspectId, theme);
    const alpha = 0.6;
    const beta = 0.25;
    const gamma = 0.15;

    return baseWeight + alpha * (stats.personal?.weight || 0) + beta * (stats.cluster?.weight || 0) + gamma * stats.global.weight;
  }

  async processFeedback(userId: string, aspectId: string, theme: string, feedback: FeedbackData): Promise<void> {
    const user = await this.getUser(userId);
    const feedbackLog = {
      feedbackId: `${userId}_${aspectId}_${Date.now()}`,
      userId,
      aspectId,
      theme,
      date: new Date().toISOString(),
      orb: 0,
      confidenceScore: 0.8,
      resonated: feedback.resonated,
      accuracyScore: feedback.accuracyScore,
      notes: feedback.notes,
      scoreBefore: feedback.scoreBefore,
      scoreAfter: feedback.scoreAfter,
      userRating: feedback.userRating,
    };

    await this.logFeedback(feedbackLog);
    await this.updatePersonalResonance(userId, aspectId, theme, feedback);

    if (user?.mbtiType) {
      await this.updateClusterResonance(user.mbtiType, aspectId, theme, feedback);
    }

    await this.updateGlobalResonance(aspectId, theme, feedback);
  }

  async getUserAccuracyStats(
    userId: string,
    days: number = 30,
  ): Promise<{
    overallAccuracy: number;
    totalFeedbacks: number;
    strongestResonances: Array<{ aspectId: string; theme: string; accuracy: number }>;
    weakestResonances: Array<{ aspectId: string; theme: string; accuracy: number }>;
  }> {
    const recentFeedback = await this.getFeedbackHistory(userId, 1000);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const relevantFeedback = recentFeedback.filter((log) => new Date(log.date) >= cutoffDate);

    if (relevantFeedback.length === 0) {
      return {
        overallAccuracy: 0,
        totalFeedbacks: 0,
        strongestResonances: [],
        weakestResonances: [],
      };
    }

    const overallAccuracy =
      relevantFeedback.reduce((sum, log) => sum + (log.resonated ? log.accuracyScore : 0), 0) / relevantFeedback.length;

    const aspectThemeStats = new Map<string, { total: number; accuracy: number }>();
    relevantFeedback.forEach((log) => {
      const key = `${log.aspectId}_${log.theme}`;
      const existing = aspectThemeStats.get(key) || { total: 0, accuracy: 0 };
      aspectThemeStats.set(key, {
        total: existing.total + 1,
        accuracy: existing.accuracy + log.accuracyScore,
      });
    });

    const sortedStats = Array.from(aspectThemeStats.entries())
      .map(([key, stats]) => {
        const [aspectId, theme] = key.split('_');
        return {
          aspectId,
          theme,
          accuracy: stats.accuracy / stats.total,
        };
      })
      .sort((a, b) => b.accuracy - a.accuracy);

    return {
      overallAccuracy,
      totalFeedbacks: relevantFeedback.length,
      strongestResonances: sortedStats.slice(0, 5),
      weakestResonances: sortedStats.slice(-5).reverse(),
    };
  }
}

export const resonanceDB = new ResonanceDatabase();

export async function initializeMockData() {
  await resonanceDB.ensureUser({
    userId: 'user_1',
    mbtiType: 'INFJ',
    enneagramType: '2',
    big5: {
      O: 0.72,
      C: 0.65,
      E: 0.31,
      A: 0.84,
      N: 0.76,
    },
    createdAt: new Date(),
  });

  await resonanceDB.updateGlobalResonance('moon_square_saturn', 'Relationships', {
    resonated: true,
    accuracyScore: 0.82,
  });

  await resonanceDB.updateGlobalResonance('sun_opposition_saturn', 'Career', {
    resonated: true,
    accuracyScore: 0.75,
  });
}
