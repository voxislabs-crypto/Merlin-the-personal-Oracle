// Soul Checkpoints - Track user milestones and celebrate the journey
// Every 100 users, every 1000 readings, every moment that matters

export interface Checkpoint {
  id: string;
  milestone: number;
  type: "users" | "readings" | "insights" | "connections";
  message: string;
  unlocked: boolean;
  date?: Date;
}

export interface UserMilestones {
  readingsGenerated: number;
  daysActive: number;
  insightsUnlocked: number;
  connectionsFormed: number; // Synastry reports generated
  joinedCommunityAt: Date;
  currentStreak: number; // Days in a row they've checked in
}

export interface GlobalStats {
  totalUsers: number;
  totalReadings: number;
  chartsCalculated: number;
  soulsGuided: number;
}

// Checkpoint definitions
const CHECKPOINT_DEFINITIONS: Array<{
  milestone: number;
  type: Checkpoint["type"];
  message: string;
}> = [
  // User milestones
  {
    milestone: 100,
    type: "users",
    message:
      "100 souls have found their way here. You are part of something larger than yourself.",
  },
  {
    milestone: 500,
    type: "users",
    message:
      "500 seekers. The community grows. Each chart is a thread in the tapestry.",
  },
  {
    milestone: 1000,
    type: "users",
    message:
      "1,000 souls. Merlin has become a gathering place for those who ask deeper questions.",
  },
  {
    milestone: 5000,
    type: "users",
    message:
      "5,000 humans. This is no longer an app. It's a movement of self-knowing.",
  },
  {
    milestone: 10000,
    type: "users",
    message:
      "10,000 births mapped. 10,000 stories honored. You are legion, and you are one.",
  },

  // Reading milestones
  {
    milestone: 1000,
    type: "readings",
    message:
      "1,000 readings generated. 1,000 moments of clarity whispered into the digital dark.",
  },
  {
    milestone: 10000,
    type: "readings",
    message:
      "10,000 forecasts. The stars have spoken 10,000 times. And people listened.",
  },
  {
    milestone: 100000,
    type: "readings",
    message:
      "100,000 readings. Merlin is no longer a tool. It's a living oracle.",
  },

  // Insight milestones (unique aspects discovered)
  {
    milestone: 100,
    type: "insights",
    message:
      "100 unique insights unlocked. You're learning your chart like a language.",
  },
  {
    milestone: 500,
    type: "insights",
    message:
      "500 insights revealed. Your chart is no longer a mystery. It's a map.",
  },

  // Connection milestones (synastry)
  {
    milestone: 10,
    type: "connections",
    message:
      "10 synastry reports. You're exploring how your soul touches others.",
  },
  {
    milestone: 50,
    type: "connections",
    message:
      "50 connections mapped. Relationships are not random — they are geometric.",
  },
];

// Check which checkpoints a user has unlocked
export function checkUserCheckpoints(
  milestones: UserMilestones
): Checkpoint[] {
  const checkpoints: Checkpoint[] = [];

  // Reading checkpoints
  CHECKPOINT_DEFINITIONS.filter((c) => c.type === "readings").forEach((def) => {
    if (milestones.readingsGenerated >= def.milestone) {
      checkpoints.push({
        id: `reading-${def.milestone}`,
        milestone: def.milestone,
        type: def.type,
        message: def.message,
        unlocked: true,
      });
    }
  });

  // Insight checkpoints
  CHECKPOINT_DEFINITIONS.filter((c) => c.type === "insights").forEach((def) => {
    if (milestones.insightsUnlocked >= def.milestone) {
      checkpoints.push({
        id: `insight-${def.milestone}`,
        milestone: def.milestone,
        type: def.type,
        message: def.message,
        unlocked: true,
      });
    }
  });

  // Connection checkpoints
  CHECKPOINT_DEFINITIONS.filter((c) => c.type === "connections").forEach(
    (def) => {
      if (milestones.connectionsFormed >= def.milestone) {
        checkpoints.push({
          id: `connection-${def.milestone}`,
          milestone: def.milestone,
          type: def.type,
          message: def.message,
          unlocked: true,
        });
      }
    }
  );

  return checkpoints;
}

// Check global checkpoints (community-wide)
export function checkGlobalCheckpoints(stats: GlobalStats): Checkpoint[] {
  const checkpoints: Checkpoint[] = [];

  CHECKPOINT_DEFINITIONS.filter((c) => c.type === "users").forEach((def) => {
    if (stats.totalUsers >= def.milestone) {
      checkpoints.push({
        id: `users-${def.milestone}`,
        milestone: def.milestone,
        type: def.type,
        message: def.message,
        unlocked: true,
      });
    }
  });

  CHECKPOINT_DEFINITIONS.filter((c) => c.type === "readings").forEach((def) => {
    if (stats.totalReadings >= def.milestone) {
      checkpoints.push({
        id: `readings-global-${def.milestone}`,
        milestone: def.milestone,
        type: def.type,
        message: def.message,
        unlocked: true,
      });
    }
  });

  return checkpoints;
}

// Get next checkpoint for user
export function getNextCheckpoint(
  milestones: UserMilestones,
  type: Checkpoint["type"]
): Checkpoint | null {
  const relevantCheckpoints = CHECKPOINT_DEFINITIONS.filter(
    (c) => c.type === type
  );

  let currentValue: number;

  switch (type) {
    case "readings":
      currentValue = milestones.readingsGenerated;
      break;
    case "insights":
      currentValue = milestones.insightsUnlocked;
      break;
    case "connections":
      currentValue = milestones.connectionsFormed;
      break;
    default:
      return null;
  }

  const nextCheckpoint = relevantCheckpoints.find(
    (c) => c.milestone > currentValue
  );

  if (!nextCheckpoint) return null;

  return {
    id: `${type}-${nextCheckpoint.milestone}`,
    milestone: nextCheckpoint.milestone,
    type: nextCheckpoint.type,
    message: nextCheckpoint.message,
    unlocked: false,
  };
}

// Calculate progress to next checkpoint
export function getProgressToNext(
  milestones: UserMilestones,
  type: Checkpoint["type"]
): { current: number; next: number; percentage: number } | null {
  const nextCheckpoint = getNextCheckpoint(milestones, type);
  if (!nextCheckpoint) return null;

  let current: number;
  switch (type) {
    case "readings":
      current = milestones.readingsGenerated;
      break;
    case "insights":
      current = milestones.insightsUnlocked;
      break;
    case "connections":
      current = milestones.connectionsFormed;
      break;
    default:
      return null;
  }

  const percentage = Math.min(100, (current / nextCheckpoint.milestone) * 100);

  return {
    current,
    next: nextCheckpoint.milestone,
    percentage: Math.round(percentage),
  };
}

// Get Easter egg message (hidden surprises)
export function getEasterEgg(milestones: UserMilestones): string | null {
  // Special messages for unusual milestones
  if (milestones.readingsGenerated === 111) {
    return "111. Angel numbers. The universe notices you noticing.";
  }

  if (milestones.readingsGenerated === 333) {
    return "333. Alignment. You're walking your path.";
  }

  if (milestones.readingsGenerated === 777) {
    return "777. Spiritual jackpot. You're in flow.";
  }

  if (milestones.currentStreak === 7) {
    return "7 days. You've made this a practice. That's how transformation happens.";
  }

  if (milestones.currentStreak === 30) {
    return "30 days. One full lunar cycle. You've integrated Merlin into your rhythm.";
  }

  if (milestones.currentStreak === 100) {
    return "100 days. You're not visiting anymore. You live here now. Welcome home.";
  }

  return null;
}

// Format milestone for display
export function formatMilestone(checkpoint: Checkpoint): {
  title: string;
  message: string;
  icon: string;
} {
  const icons: Record<Checkpoint["type"], string> = {
    users: "👥",
    readings: "📖",
    insights: "💡",
    connections: "🔗",
  };

  return {
    title: `${icons[checkpoint.type]} ${checkpoint.milestone} ${checkpoint.type}`,
    message: checkpoint.message,
    icon: icons[checkpoint.type],
  };
}

// Celebrate milestone (returns celebratory message)
export function celebrateMilestone(checkpoint: Checkpoint): string {
  return `🎉 Milestone Unlocked!\n\n${checkpoint.message}`;
}

// Get personalized journey summary
export function getJourneySummary(milestones: UserMilestones): string {
  const daysSinceJoining = Math.floor(
    (Date.now() - milestones.joinedCommunityAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  const avgReadingsPerWeek =
    daysSinceJoining > 7
      ? Math.round((milestones.readingsGenerated / daysSinceJoining) * 7)
      : 0;

  return `You've been with Merlin for ${daysSinceJoining} days. In that time, you've generated ${milestones.readingsGenerated} readings and unlocked ${milestones.insightsUnlocked} insights. ${
    milestones.currentStreak > 1
      ? `You're on a ${milestones.currentStreak}-day streak. Keep going.`
      : "Every journey starts somewhere. You're here."
  }`;
}

// Initialize new user milestones
export function initializeUserMilestones(): UserMilestones {
  return {
    readingsGenerated: 0,
    daysActive: 0,
    insightsUnlocked: 0,
    connectionsFormed: 0,
    joinedCommunityAt: new Date(),
    currentStreak: 0,
  };
}
