export const ORACLE_CHAT_STORAGE_PREFIX = 'merlin_oracle_chat_v1:';
export const ORACLE_CHAT_MAX_STORED = 40;
export const ORACLE_CHAT_MAX_PROMPT_MESSAGES = 20;
const ORACLE_CHAT_MAX_BYTES = 350_000;

export type StoredOracleChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  tactics?: string[];
  forecast?: { timeframe: string; themes: string[] };
  level?: { current: string; challenge: string; reward: string };
  progression?: {
    arcPath: string;
    arcLevel: number;
    arcXp: number;
    interactionCount: number;
    xpGained?: number;
  };
  mirrorInsight?: {
    message: string;
    label?: string;
    count?: number;
    trendStatus?: 'rising' | 'stable' | 'fading' | 'new';
    stanceMode?: 'direct' | 'soft';
  };
};

export type OracleChatHistoryPayload = {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
};

export function oracleChatStorageKey(userId?: string | null): string {
  return `${ORACLE_CHAT_STORAGE_PREFIX}${userId || 'anonymous'}`;
}

function isRole(value: unknown): value is 'user' | 'assistant' {
  return value === 'user' || value === 'assistant';
}

function isDisruptionPlaceholder(content: string): boolean {
  return content.startsWith('Merlin hit a disruption:');
}

export function toStoredOracleChatMessage(message: {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date | string;
  tactics?: string[];
  forecast?: StoredOracleChatMessage['forecast'];
  level?: StoredOracleChatMessage['level'];
  progression?: StoredOracleChatMessage['progression'];
  mirrorInsight?: StoredOracleChatMessage['mirrorInsight'];
}): StoredOracleChatMessage {
  const timestamp =
    message.timestamp instanceof Date
      ? message.timestamp.toISOString()
      : new Date(message.timestamp).toISOString();

  return {
    id: message.id,
    role: message.role,
    content: message.content,
    timestamp: Number.isNaN(Date.parse(timestamp)) ? new Date().toISOString() : timestamp,
    tactics: message.tactics,
    forecast: message.forecast,
    level: message.level,
    progression: message.progression,
    mirrorInsight: message.mirrorInsight,
  };
}

export type HydratedOracleChatMessage = Omit<StoredOracleChatMessage, 'timestamp'> & {
  timestamp: Date;
};

export function fromStoredOracleChatMessage(message: StoredOracleChatMessage): HydratedOracleChatMessage {
  return {
    ...message,
    timestamp: new Date(message.timestamp),
  };
}

export function loadOracleChatMessages(userId?: string | null): StoredOracleChatMessage[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(oracleChatStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((entry): entry is StoredOracleChatMessage => {
        if (!entry || typeof entry !== 'object') return false;
        const row = entry as StoredOracleChatMessage;
        return isRole(row.role) && typeof row.content === 'string' && typeof row.id === 'string';
      })
      .slice(-ORACLE_CHAT_MAX_STORED);
  } catch {
    return [];
  }
}

export function saveOracleChatMessages(
  userId: string | null | undefined,
  messages: StoredOracleChatMessage[]
): void {
  if (typeof window === 'undefined') return;

  const key = oracleChatStorageKey(userId);
  let next = messages.slice(-ORACLE_CHAT_MAX_STORED);

  try {
    while (next.length && JSON.stringify(next).length > ORACLE_CHAT_MAX_BYTES) {
      next = next.slice(1);
    }
    window.localStorage.setItem(key, JSON.stringify(next));
  } catch {
    try {
      window.localStorage.setItem(key, JSON.stringify(next.slice(-10)));
    } catch {
      // Quota or private mode — keep the in-memory thread only.
    }
  }
}

export function clearOracleChatMessages(userId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(oracleChatStorageKey(userId));
  } catch {
    // ignore
  }
}

export function toOracleConversationHistory(
  messages: Array<{ role: string; content: string; timestamp?: Date | string }>
): OracleChatHistoryPayload[] {
  return messages
    .filter(
      (message): message is { role: 'user' | 'assistant'; content: string; timestamp?: Date | string } =>
        isRole(message.role) &&
        typeof message.content === 'string' &&
        message.content.trim().length > 0 &&
        !isDisruptionPlaceholder(message.content)
    )
    .slice(-ORACLE_CHAT_MAX_PROMPT_MESSAGES)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, 8000),
      timestamp:
        message.timestamp instanceof Date
          ? message.timestamp.toISOString()
          : typeof message.timestamp === 'string'
            ? message.timestamp
            : undefined,
    }));
}

export function normalizeClientConversationHistory(raw: unknown): OracleChatHistoryPayload[] {
  if (!Array.isArray(raw)) return [];
  return toOracleConversationHistory(
    raw.map((entry) => {
      const row = entry as { role?: string; content?: string; timestamp?: string };
      return {
        role: row.role || '',
        content: typeof row.content === 'string' ? row.content : '',
        timestamp: row.timestamp,
      };
    })
  );
}
