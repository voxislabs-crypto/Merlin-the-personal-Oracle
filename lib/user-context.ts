import 'server-only';

import { prisma } from '@/lib/prisma';

export interface PersistentUserContextSnapshot {
  userId: string;
  situation: string;
  mood: string;
  goals: string[];
  lastFeedbackNotes: string;
  updatedAt: string;
}

export interface UserContextInput {
  userId: string;
  situation?: string;
  mood?: string;
  goals?: string[];
  lastFeedbackNotes?: string;
}

function parseGoals(goalsJson?: string | null): string[] {
  if (!goalsJson) return [];

  try {
    const parsed = JSON.parse(goalsJson);
    return Array.isArray(parsed) ? parsed.filter((goal): goal is string => typeof goal === 'string') : [];
  } catch {
    return [];
  }
}

export async function getUserContextSnapshot(userId: string): Promise<PersistentUserContextSnapshot | null> {
  const record = await prisma.userContextSnapshot.findUnique({
    where: { userId },
  });

  if (!record) return null;

  return {
    userId: record.userId,
    situation: record.situation || '',
    mood: record.mood || '',
    goals: parseGoals(record.goalsJson),
    lastFeedbackNotes: record.lastFeedbackNotes || '',
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function upsertUserContextSnapshot(input: UserContextInput): Promise<PersistentUserContextSnapshot> {
  const goals = input.goals?.map((goal) => goal.trim()).filter(Boolean) || [];

  const record = await prisma.userContextSnapshot.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      situation: input.situation?.trim() || '',
      mood: input.mood?.trim() || '',
      goalsJson: JSON.stringify(goals),
      lastFeedbackNotes: input.lastFeedbackNotes?.trim() || '',
    },
    update: {
      situation: input.situation?.trim() || '',
      mood: input.mood?.trim() || '',
      goalsJson: JSON.stringify(goals),
      lastFeedbackNotes: input.lastFeedbackNotes?.trim() || '',
    },
  });

  return {
    userId: record.userId,
    situation: record.situation || '',
    mood: record.mood || '',
    goals,
    lastFeedbackNotes: record.lastFeedbackNotes || '',
    updatedAt: record.updatedAt.toISOString(),
  };
}