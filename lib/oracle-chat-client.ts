export type OracleTonePreset = 'warm' | 'direct' | 'mystic' | 'strategic';
export type OracleMode = 'auto' | 'casual' | 'detailed';

export interface OracleChatRequestPayload {
  question: string;
  birthChart?: unknown;
  progressedChart?: unknown;
  userId?: string;
  plainEnglish?: boolean;
  mbtiType?: string;
  tonePreset?: OracleTonePreset;
  oracleMode?: OracleMode;
  includeLikelihood?: boolean;
  ancientLayer?: boolean;
}

export interface OracleChatStreamResult {
  content: string;
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
  mode?: 'casual' | 'astro';
  includeLikelihood?: boolean;
  ancientLayer?: boolean;
}

interface RequestOracleChatOptions {
  onChunk?: (fullContent: string, delta: string) => void;
}

function applyEvent(
  parsed: any,
  state: {
    fullContent: string;
    tactics: string[];
    forecast: OracleChatStreamResult['forecast'];
    level: OracleChatStreamResult['level'];
    progression: OracleChatStreamResult['progression'];
    mirrorInsight: OracleChatStreamResult['mirrorInsight'];
    streamError: string | null;
    mode: OracleChatStreamResult['mode'];
    includeLikelihood: boolean | undefined;
    ancientLayer: boolean | undefined;
  },
  onChunk?: (fullContent: string, delta: string) => void
) {
  if (!parsed || typeof parsed !== 'object') return;

  if (parsed.type === 'chunk' && typeof parsed.content === 'string') {
    state.fullContent += parsed.content;
    onChunk?.(state.fullContent, parsed.content);
    return;
  }

  if (parsed.type === 'tactics' && Array.isArray(parsed.data)) {
    state.tactics = parsed.data;
    return;
  }

  if (parsed.type === 'forecast' && parsed.data) {
    state.forecast = parsed.data;
    return;
  }

  if (parsed.type === 'level' && parsed.data) {
    state.level = parsed.data;
    return;
  }

  if (parsed.type === 'progression' && parsed.data) {
    state.progression = parsed.data;
    return;
  }

  if (parsed.type === 'mirrorInsight' && parsed.data) {
    state.mirrorInsight = parsed.data;
    return;
  }

  if (parsed.type === 'done') {
    state.mode = parsed.mode;
    state.includeLikelihood = parsed.includeLikelihood;
    state.ancientLayer = parsed.ancientLayer;
    return;
  }

  if (parsed.type === 'error') {
    state.streamError = parsed.error || 'Oracle stream failed';
  }
}

export async function requestOracleChat(
  payload: OracleChatRequestPayload,
  options: RequestOracleChatOptions = {}
): Promise<OracleChatStreamResult> {
  const response = await fetch('/api/oracle-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
  }

  // Backward compatibility with older JSON casual responses.
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await response.json();
    const content = data?.data?.response || '';
    if (!content) throw new Error('Empty response from Oracle');
    options.onChunk?.(content, content);
    return {
      content,
      mode: data?.mode,
    };
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No reader');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  const state = {
    fullContent: '',
    tactics: [] as string[],
    forecast: undefined as OracleChatStreamResult['forecast'],
    level: undefined as OracleChatStreamResult['level'],
    progression: undefined as OracleChatStreamResult['progression'],
    mirrorInsight: undefined as OracleChatStreamResult['mirrorInsight'],
    streamError: null as string | null,
    mode: undefined as OracleChatStreamResult['mode'],
    includeLikelihood: undefined as boolean | undefined,
    ancientLayer: undefined as boolean | undefined,
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || !line.startsWith('{')) continue;

      try {
        const parsed = JSON.parse(line);
        applyEvent(parsed, state, options.onChunk);
      } catch {
        // Ignore malformed lines during stream parsing.
      }
    }
  }

  const finalLine = buffer.trim();
  if (finalLine.startsWith('{')) {
    try {
      const parsed = JSON.parse(finalLine);
      applyEvent(parsed, state, options.onChunk);
    } catch {
      // Ignore trailing parse errors.
    }
  }

  if (!state.fullContent.trim()) {
    throw new Error(state.streamError || 'Empty response from Oracle');
  }

  return {
    content: state.fullContent,
    tactics: state.tactics.length > 0 ? state.tactics : undefined,
    forecast: state.forecast,
    level: state.level,
    progression: state.progression,
    mirrorInsight: state.mirrorInsight,
    mode: state.mode,
    includeLikelihood: state.includeLikelihood,
    ancientLayer: state.ancientLayer,
  };
}