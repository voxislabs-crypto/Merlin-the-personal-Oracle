import 'server-only';

import { prisma } from '@/lib/prisma';
import { isPrismaMissingTableError } from '@/lib/prisma-errors';

export interface PersistentUserContextSnapshot {
  userId: string;
  situation: string;
  mood: string;
  goals: string[];
  lastFeedbackNotes: string;
  oracleTonePreset?: 'warm' | 'direct' | 'mystic' | 'strategic';
  archetypeName?: string;
  patternSignature?: string;
  coreContradiction?: string;
  arcPath?: string;
  arcLevel?: number;
  arcXp?: number;
  interactionCount?: number;
  lastInteractionAt?: string;
  updatedAt: string;
}

export interface UserContextInput {
  userId: string;
  situation?: string;
  mood?: string;
  goals?: string[];
  lastFeedbackNotes?: string;
  oracleTonePreset?: 'warm' | 'direct' | 'mystic' | 'strategic';
  archetypeName?: string;
  patternSignature?: string;
  coreContradiction?: string;
  arcPath?: string;
  arcLevel?: number;
  arcXp?: number;
  interactionCount?: number;
  lastInteractionAt?: string;
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
  let record;

  try {
    record = await prisma.userContextSnapshot.findUnique({
      where: { userId },
    });
  } catch (error) {
    if (isPrismaMissingTableError(error)) {
      console.warn('[UserContext] Database tables missing; run `npm run prisma:push`.');
      return null;
    }
    throw error;
  }

  if (!record) return null;

  return {
    userId: record.userId,
    situation: record.situation || '',
    mood: record.mood || '',
    goals: parseGoals(record.goalsJson),
    lastFeedbackNotes: record.lastFeedbackNotes || '',
    oracleTonePreset: (record.oracleTonePreset as PersistentUserContextSnapshot['oracleTonePreset']) || undefined,
    archetypeName: record.archetypeName || undefined,
    patternSignature: record.patternSignature || undefined,
    coreContradiction: record.coreContradiction || undefined,
    arcPath: record.arcPath || undefined,
    arcLevel: record.arcLevel ?? undefined,
    arcXp: record.arcXp ?? undefined,
    interactionCount: record.interactionCount ?? undefined,
    lastInteractionAt: record.lastInteractionAt?.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function upsertUserContextSnapshot(input: UserContextInput): Promise<PersistentUserContextSnapshot> {
  const normalizedGoals = input.goals?.map((goal) => goal.trim()).filter(Boolean);

  const updateData: {
    situation?: string;
    mood?: string;
    goalsJson?: string;
    lastFeedbackNotes?: string;
    oracleTonePreset?: string;
    archetypeName?: string;
    patternSignature?: string;
    coreContradiction?: string;
    arcPath?: string;
    arcLevel?: number;
    arcXp?: number;
    interactionCount?: number;
    lastInteractionAt?: Date;
  } = {};

  if (input.situation !== undefined) {
    updateData.situation = input.situation.trim();
  }
  if (input.mood !== undefined) {
    updateData.mood = input.mood.trim();
  }
  if (input.goals !== undefined) {
    updateData.goalsJson = JSON.stringify(normalizedGoals || []);
  }
  if (input.lastFeedbackNotes !== undefined) {
    updateData.lastFeedbackNotes = input.lastFeedbackNotes.trim();
  }
  if (input.oracleTonePreset !== undefined) {
    updateData.oracleTonePreset = input.oracleTonePreset;
  }
  if (input.archetypeName !== undefined) {
    updateData.archetypeName = input.archetypeName;
  }
  if (input.patternSignature !== undefined) {
    updateData.patternSignature = input.patternSignature;
  }
  if (input.coreContradiction !== undefined) {
    updateData.coreContradiction = input.coreContradiction;
  }
  if (input.arcPath !== undefined) {
    updateData.arcPath = input.arcPath;
  }
  if (input.arcLevel !== undefined) {
    updateData.arcLevel = input.arcLevel;
  }
  if (input.arcXp !== undefined) {
    updateData.arcXp = input.arcXp;
  }
  if (input.interactionCount !== undefined) {
    updateData.interactionCount = input.interactionCount;
  }
  if (input.lastInteractionAt !== undefined) {
    const dt = new Date(input.lastInteractionAt);
    if (!Number.isNaN(dt.getTime())) {
      updateData.lastInteractionAt = dt;
    }
  }

  let record;

  try {
    record = await prisma.userContextSnapshot.upsert({
      where: { userId: input.userId },
      create: {
      userId: input.userId,
      situation: input.situation?.trim() || '',
      mood: input.mood?.trim() || '',
      goalsJson: JSON.stringify(normalizedGoals || []),
      lastFeedbackNotes: input.lastFeedbackNotes?.trim() || '',
      oracleTonePreset: input.oracleTonePreset,
      archetypeName: input.archetypeName,
      patternSignature: input.patternSignature,
      coreContradiction: input.coreContradiction,
      arcPath: input.arcPath,
      arcLevel: input.arcLevel,
      arcXp: input.arcXp,
      interactionCount: input.interactionCount,
      lastInteractionAt: input.lastInteractionAt ? new Date(input.lastInteractionAt) : undefined,
    },
      update: updateData,
    });
  } catch (error) {
    if (isPrismaMissingTableError(error)) {
      console.warn('[UserContext] Database tables missing; skipping context upsert.');
      return {
        userId: input.userId,
        situation: input.situation?.trim() || '',
        mood: input.mood?.trim() || '',
        goals: normalizedGoals || [],
        lastFeedbackNotes: input.lastFeedbackNotes?.trim() || '',
        oracleTonePreset: input.oracleTonePreset,
        archetypeName: input.archetypeName,
        patternSignature: input.patternSignature,
        coreContradiction: input.coreContradiction,
        arcPath: input.arcPath,
        arcLevel: input.arcLevel,
        arcXp: input.arcXp,
        interactionCount: input.interactionCount,
        lastInteractionAt: input.lastInteractionAt,
        updatedAt: new Date().toISOString(),
      };
    }
    throw error;
  }

  return {
    userId: record.userId,
    situation: record.situation || '',
    mood: record.mood || '',
    goals: parseGoals(record.goalsJson),
    lastFeedbackNotes: record.lastFeedbackNotes || '',
    oracleTonePreset: (record.oracleTonePreset as PersistentUserContextSnapshot['oracleTonePreset']) || undefined,
    archetypeName: record.archetypeName || undefined,
    patternSignature: record.patternSignature || undefined,
    coreContradiction: record.coreContradiction || undefined,
    arcPath: record.arcPath || undefined,
    arcLevel: record.arcLevel ?? undefined,
    arcXp: record.arcXp ?? undefined,
    interactionCount: record.interactionCount ?? undefined,
    lastInteractionAt: record.lastInteractionAt?.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}