// lib/grok-service.ts - LLM-backed birth chart interpretations (Groq by default)
import "server-only";
import { PlanetPosition, Aspect } from '@/types/astrology';
import { chatCompletion, getLlmConfig, isLlmConfigured } from '@/lib/llm-config';
import { serverCache, generateChartHash } from './cache-service';

const llm = getLlmConfig();
if (!isLlmConfigured(llm)) {
  console.warn(
    `[LLM] ${llm.envKeyName} not configured — interpretations will use fallback (${llm.provider})`
  );
}

// Performance monitoring
const grokMetrics = {
  totalCalls: 0,
  cacheHits: 0,
  avgLatency: 0,
  lastCallDuration: 0
};

export interface GrokInterpretationRequest {
  planets: PlanetPosition[];
  aspects: Aspect[];
  houses?: any[];
  ascendant?: any;
  birthData?: {
    date: string;
    time: string;
    location?: string;
  };
}

export interface GrokInterpretationResponse {
  chartSummary: string;
  planetInterpretations: Array<{
    planet: string;
    interpretation: string;
  }>;
  aspectInterpretations: Array<{
    planets: string;
    interpretation: string;
  }>;
  personalityInsights?: string;
  lifeThemes?: string[];
}

/**
 * Generate a detailed birth chart interpretation using Grok AI
 * With intelligent caching to reduce latency
 */
export async function generateGrokInterpretation(
  request: GrokInterpretationRequest
): Promise<GrokInterpretationResponse> {
  if (!isLlmConfigured()) {
    throw new Error(`${getLlmConfig().envKeyName} not configured`);
  }

  const { planets, aspects, houses, ascendant, birthData } = request;

  // Generate cache key from birth data
  const cacheKey = birthData 
    ? generateChartHash(
        birthData.date, 
        birthData.time, 
        0, 
        0, 
        { useGrok: true }
      )
    : null;

  // Check cache first
  if (cacheKey) {
    const cached = serverCache.get<GrokInterpretationResponse>(cacheKey);
    if (cached) {
      grokMetrics.cacheHits++;
      console.log('[LLM] Cache hit! Retrieved interpretation instantly');
      return cached;
    }
  }

  const startTime = Date.now();
  grokMetrics.totalCalls++;

  // Prepare the chart data as a readable summary for the model
  const chartSummary = formatChartForGrok(planets, aspects, houses, ascendant, birthData);

  // Create the prompt - optimized for faster responses
  const prompt = buildInterpretationPrompt(chartSummary, planets, aspects);

  try {
    const content = await chatCompletion({
      temperature: 0.8,
      maxTokens: 1800,
      messages: [
        {
          role: 'system',
          content: `You are Merlin — a clarity coach, not a mystical astrologer. Interpret charts as who this person is and how life tends to feel for them. Plain human language first; symbols only as optional support. Speak as "you". No fortunes, no cosmic fluff. Response must be valid JSON matching the requested format.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Parse the structured response
    const result = parseGrokResponse(content, planets, aspects);

    // Cache the result
    if (cacheKey) {
      serverCache.set(cacheKey, result);
      console.log('[LLM] Interpretation cached for future use');
    }

    // Update metrics
    const duration = Date.now() - startTime;
    grokMetrics.lastCallDuration = duration;
    grokMetrics.avgLatency =
      (grokMetrics.avgLatency * (grokMetrics.totalCalls - 1) + duration) / grokMetrics.totalCalls;

    const cfg = getLlmConfig();
    console.log(
      `[LLM:${cfg.provider}] Generated interpretation in ${duration}ms (avg: ${grokMetrics.avgLatency.toFixed(0)}ms, cache hit rate: ${((grokMetrics.cacheHits / Math.max(1, grokMetrics.totalCalls)) * 100).toFixed(1)}%)`
    );

    return result;
  } catch (error) {
    console.error('[LLM] Failed to generate interpretation:', error);
    throw error;
  }
}

/**
 * Stream-based interpretation (for progressive display)
 */
export async function generateGrokInterpretationStream(
  request: GrokInterpretationRequest,
  onChunk: (chunk: string) => void
): Promise<GrokInterpretationResponse> {
  const cfg = getLlmConfig();
  if (!isLlmConfigured(cfg)) {
    throw new Error(`${cfg.envKeyName} not configured`);
  }

  const { planets, aspects, houses, ascendant, birthData } = request;

  // Check cache first
  const cacheKey = birthData
    ? generateChartHash(birthData.date, birthData.time, 0, 0, { useGrok: true })
    : null;

  if (cacheKey) {
    const cached = serverCache.get<GrokInterpretationResponse>(cacheKey);
    if (cached) {
      // Simulate streaming from cache with slight delay for natural feel
      const text = JSON.stringify(cached, null, 2);
      const chunks = text.match(/.{1,50}/g) || [text];
      for (const chunk of chunks) {
        await new Promise((resolve) => setTimeout(resolve, 10));
        onChunk(chunk);
      }
      return cached;
    }
  }

  const chartSummary = formatChartForGrok(planets, aspects, houses, ascendant, birthData);
  const prompt = buildInterpretationPrompt(chartSummary, planets, aspects);

  try {
    const response = await fetch(cfg.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        messages: [
          {
            role: 'system',
            content: `You are Merlin — clarity coach. Be personal and precise in human language. No mystic filler. Return valid JSON.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 1800,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`${cfg.provider} API error: ${response.status}`);
    }

    let fullResponse = '';
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((line) => line.trim().startsWith('data: '));

        for (const line of lines) {
          const data = line.replace('data: ', '');
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              fullResponse += content;
              onChunk(content);
            }
          } catch {
            // Skip malformed chunks
          }
        }
      }
    }

    const result = parseGrokResponse(fullResponse, planets, aspects);

    if (cacheKey) {
      serverCache.set(cacheKey, result);
    }

    return result;
  } catch (error) {
    console.error('[LLM] Streaming failed:', error);
    throw error;
  }
}

/**
 * Get Grok service metrics
 */
export function getGrokMetrics() {
  return {
    ...grokMetrics,
    cacheStats: serverCache.getStats()
  };
}

/**
 * Format chart data into a readable summary for Grok
 */
function formatChartForGrok(
  planets: PlanetPosition[],
  aspects: Aspect[],
  houses?: any[],
  ascendant?: any,
  birthData?: any
): string {
  let summary = '';

  if (birthData) {
    summary += `Birth Data: ${birthData.date} at ${birthData.time}`;
    if (birthData.location) summary += ` in ${birthData.location}`;
    summary += '\n\n';
  }

  summary += 'PLANETARY POSITIONS:\n';
  planets.forEach(planet => {
    summary += `- ${planet.name}: ${planet.degree}° ${planet.sign}`;
    if (planet.house) summary += ` (House ${planet.house})`;
    if (planet.retrograde) summary += ' ℞';
    summary += '\n';
  });

  if (ascendant) {
    summary += `\nAscendant: ${ascendant.degree}° ${ascendant.sign}\n`;
  }

  summary += '\nMAJOR ASPECTS:\n';
  aspects.slice(0, 10).forEach(aspect => {
    const p1 = aspect.planet1?.name || 'Planet';
    const p2 = aspect.planet2?.name || 'Planet';
    const exact = aspect.exact ? ' (exact)' : '';
    summary += `- ${p1} ${aspect.type} ${p2}${exact}\n`;
  });

  return summary;
}

/**
 * Build the interpretation prompt for Grok
 */
function buildInterpretationPrompt(
  chartSummary: string,
  planets: PlanetPosition[],
  aspects: Aspect[]
): string {
  const personalPlanets = planets.filter(p => 
    ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars'].includes(p.name)
  );

  return `I need you to interpret this birth chart with deep insight and personal wisdom. This is the complete natal chart data:

${chartSummary}

Please provide a comprehensive interpretation in the following JSON format:

{
  "chartSummary": "A 2-3 paragraph overview of the chart's main themes, dominant elements, and core personality patterns. Make this deeply personal and insightful.",
  "planetInterpretations": [
    {
      "planet": "Sun",
      "interpretation": "A rich, detailed interpretation of this placement (2-3 sentences), speaking directly to how this manifests in their life and personality"
    },
    // ... for each personal planet: ${personalPlanets.map(p => `${p.name} in ${p.sign}`).join(', ')}
  ],
  "aspectInterpretations": [
    {
      "planets": "Planet1 Aspect Planet2",
      "interpretation": "How this aspect shapes their experience and inner dynamics (2 sentences)"
    },
    // ... for the top 5 most significant aspects
  ],
  "personalityInsights": "A paragraph about their deepest strengths, challenges, and soul purpose revealed by this chart",
  "lifeThemes": ["Major theme 1", "Major theme 2", "Major theme 3"]
}

Be poetic but precise. Be mystical but grounded. Make every word count. This person should feel truly seen and understood.`;
}

/**
 * Parse Grok's response into structured data
 */
function parseGrokResponse(
  grokResponse: string,
  planets: PlanetPosition[],
  aspects: Aspect[]
): GrokInterpretationResponse {
  try {
    // Try to extract JSON from the response
    const jsonMatch = grokResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        chartSummary: parsed.chartSummary || grokResponse,
        planetInterpretations: parsed.planetInterpretations || [],
        aspectInterpretations: parsed.aspectInterpretations || [],
        personalityInsights: parsed.personalityInsights,
        lifeThemes: parsed.lifeThemes || []
      };
    }

    // Fallback: use the entire response as chart summary
    return {
      chartSummary: grokResponse,
      planetInterpretations: [],
      aspectInterpretations: []
    };
  } catch (error) {
    console.error('[Grok] Failed to parse response, using as-is:', error);
    return {
      chartSummary: grokResponse,
      planetInterpretations: [],
      aspectInterpretations: []
    };
  }
}

/**
 * Generate a quick daily forecast using Grok
 */
export async function generateGrokForecast(
  birthChart: any,
  transitData?: any
): Promise<string> {
  void transitData;
  if (!isLlmConfigured()) {
    throw new Error(`${getLlmConfig().envKeyName} not configured`);
  }

  const prompt = `Based on this natal chart and current transits, give a personal daily forecast (2-3 paragraphs):

Natal Chart: ${formatChartForGrok(birthChart.positions || birthChart.planets || [], birthChart.aspects || [])}

Current Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}

Speak as Merlin, directly to the person. What energies are active today? What should they be aware of? What opportunities exist?`;

  try {
    return await chatCompletion({
      temperature: 0.9,
      maxTokens: 500,
      messages: [
        {
          role: 'system',
          content: `You are Merlin. Offer daily life-weather guidance: what today means for this person, why it might feel that way (human stakes), and one concrete move. Not a horoscope. Calm confidence. No absolute predictions. Astrology is infrastructure — clarity is the product.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });
  } catch (error) {
    console.error('[LLM] Forecast generation failed:', error);
    throw error;
  }
}
