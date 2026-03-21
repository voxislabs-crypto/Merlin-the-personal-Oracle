// API Route: Oracle Chat - Streaming Q&A with chart context
import { NextRequest, NextResponse } from 'next/server';
import { generateGrokInterpretationStream } from '@/lib/grok-service';
import {
  buildOracleSystemPrompt,
  generateTacticalSuggestions,
  generateMicroForecast,
  identifyCurrentLevel,
  oracleMemory,
  OracleContext,
  OracleMessage,
  TransitData,
} from '@/lib/oracle-service';
import { getCurrentTransits } from '@/lib/astrology/transits';
import { getTodaysForecast } from '@/lib/astrology/ephemeris';
import { detectWeeklyStorms } from '@/lib/astrology/storms';
import { getMBTIDual } from '@/lib/personality/fusion';
import { getUserContextSnapshot, upsertUserContextSnapshot } from '@/lib/user-context';
import { BirthChartData } from '@/types/astrology';
import { generateIdentityPack } from '@/lib/identity-pack';
import { advanceArcProgression } from '@/lib/progression';

interface OracleChatRequest {
  question: string;
  birthChart?: any;
  progressedChart?: any;
  userId?: string;
  plainEnglish?: boolean; // Clarity Mode - strips astro jargon
  mbtiType?: string; // MBTI archetype for storm cross-reference
  tonePreset?: 'warm' | 'direct' | 'mystic' | 'strategic';
}

type LlmProvider = 'xai' | 'groq';

function getOracleLlmConfig() {
  const rawProvider = (process.env.LLM_PROVIDER || 'xai').toLowerCase();
  const provider: LlmProvider = rawProvider === 'groq' ? 'groq' : 'xai';

  if (provider === 'groq') {
    return {
      provider,
      apiUrl: process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions',
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      envKeyName: 'GROQ_API_KEY',
    };
  }

  return {
    provider,
    apiUrl: process.env.XAI_API_URL || 'https://api.x.ai/v1/chat/completions',
    apiKey: process.env.XAI_API_KEY,
    model: process.env.XAI_MODEL || 'grok-3-fast',
    envKeyName: 'XAI_API_KEY',
  };
}

/**
 * POST /api/oracle-chat
 * Streaming oracle chat endpoint with chart context awareness
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as OracleChatRequest;
    const {
      question,
      birthChart,
      progressedChart,
      userId = 'anonymous',
      plainEnglish = true,
      mbtiType,
      tonePreset = 'warm',
    } = body;

    if (!question || question.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Question cannot be empty' },
        { status: 400 }
      );
    }

    // Get conversation history
    const history = oracleMemory.getHistory(userId);

    // Calculate real-time transit and forecast data if birth chart provided
    let transits: TransitData | undefined;
    let dailyForecast;
    let stormsReport;
    
    // Support both .planets (BirthChartData) and .positions (legacy) field names
    const natalPlanets = birthChart?.planets || birthChart?.positions || [];
    
    if (natalPlanets.length > 0) {
      try {
        console.log('[Oracle Chat] Calculating current transits for chart awareness');
        // Get current transits
        const transitMatches = getCurrentTransits(natalPlanets);
        
        // Categorize transits
        const significant = transitMatches.filter((t: any) => t.exact || t.orb < 1.5);
        const approaching = transitMatches.filter((t: any) => !t.exact && t.orb >= 1.5 && t.orb < 3);
        
        transits = {
          all: transitMatches,
          significant,
          approaching,
          summary: {
            total: transitMatches.length,
            exact: significant.length,
            approaching: approaching.length
          }
        };
        
        console.log(`[Oracle Chat] Found ${transits.summary.total} transits (${transits.summary.exact} exact, ${transits.summary.approaching} approaching)`);
        
        // Get today's forecast — ensure planets field is populated for the forecast engine
        const chartForForecast = { ...birthChart, planets: natalPlanets };
        dailyForecast = getTodaysForecast(chartForForecast as BirthChartData);
        console.log(`[Oracle Chat] Generated today's forecast: ${dailyForecast.day_rating}`);

        // Compute MBTI and weekly storms so Grok can use the same navigation intelligence as dashboard cards
        const mbtiFromChart = (birthChart as any)?.personalitySnapshot?.finalType;
        const mbtiDual = mbtiFromChart ? null : getMBTIDual(chartForForecast as BirthChartData);
        const mbtiForStorms = mbtiType || mbtiFromChart || mbtiDual?.type;
        stormsReport = detectWeeklyStorms(chartForForecast as BirthChartData, mbtiForStorms as any);
        console.log(`[Oracle Chat] Weekly storms context: ${stormsReport.storms.length} storm(s), MBTI=${mbtiForStorms || 'n/a'}`);
      } catch (error) {
        console.warn('[Oracle Chat] Could not calculate transits/forecast:', error);
        // Continue without transit data - oracle will still work with natal chart only
      }
    }

    const derivedMbtiType =
      mbtiType ||
      (birthChart as any)?.personalitySnapshot?.finalType ||
      (birthChart as any)?.mbti?.type ||
      stormsReport?.mbtiType;

    let userContext = null;
    let progression: {
      arcPath: string;
      arcLevel: number;
      arcXp: number;
      interactionCount: number;
      lastInteractionAt: string;
      xpGained: number;
    } | null = null;
    if (userId && userId !== 'anonymous') {
      try {
        userContext = await getUserContextSnapshot(userId);

        // Seed identity pack once we have chart + mbti context.
        if (birthChart && (!userContext?.archetypeName || !userContext?.patternSignature || !userContext?.coreContradiction)) {
          const identity = generateIdentityPack(birthChart as BirthChartData, derivedMbtiType);
          userContext = await upsertUserContextSnapshot({
            userId,
            archetypeName: identity.archetypeName,
            patternSignature: identity.patternSignature,
            coreContradiction: identity.coreContradiction,
          });
        }

        progression = advanceArcProgression({
          existing: userContext,
          question,
          chart: birthChart as BirthChartData,
          mbtiType: derivedMbtiType,
        });

        userContext = await upsertUserContextSnapshot({
          userId,
          arcPath: progression.arcPath,
          arcLevel: progression.arcLevel,
          arcXp: progression.arcXp,
          interactionCount: progression.interactionCount,
          lastInteractionAt: progression.lastInteractionAt,
        });
      } catch (error) {
        console.warn('[Oracle Chat] Could not load user context from database:', error instanceof Error ? error.message : 'Unknown error');
        // Continue without user context - oracle will still work
      }
    }

    // Build context
    const context: OracleContext = {
      birthChart,
      progressedChart,
      transits,
      dailyForecast,
      userContext,
      stormsReport,
      conversationHistory: history,
      userId,
      currentDate: new Date(),
      plainEnglish,
      mbtiType: derivedMbtiType,
      tonePreset,
    };

    // Add user message to history
    const userMessage: OracleMessage = {
      role: 'user',
      content: question,
      timestamp: new Date(),
    };
    oracleMemory.addMessage(userId, userMessage);

    // Build system prompt with chart context
    const systemPrompt = buildOracleSystemPrompt(context);

    // Convert conversation history to OpenAI-compatible chat format
    const messages = [
      ...history.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: question,
      },
    ];

    // Use ReadableStream for streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const llmConfig = getOracleLlmConfig();

          if (!llmConfig.apiKey) {
            console.error(`[Oracle] ${llmConfig.envKeyName} is not configured`);
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: 'error',
                  error: `Oracle API key not configured. Please set ${llmConfig.envKeyName} in your environment.`,
                }) + '\n'
              )
            );
            controller.close();
            return;
          }

          console.log(
            `[Oracle Chat] Starting ${llmConfig.provider} stream for user: ${userId}, question: "${question.substring(0, 50)}..."`
          );

          const llmResponse = await fetch(llmConfig.apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${llmConfig.apiKey}`,
            },
            body: JSON.stringify({
              model: llmConfig.model,
              messages: [
                {
                  role: 'system',
                  content: systemPrompt,
                },
                ...messages.map(m => ({
                  role: m.role,
                  content: m.content,
                })),
              ],
              temperature: 0.8,
              max_tokens: 2000,
              stream: true,
            }),
          });

          if (!llmResponse.ok) {
            const error = await llmResponse.text();
            console.error(`[Oracle] ${llmConfig.provider} API error:`, llmResponse.status, error);
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  error: `${llmConfig.provider.toUpperCase()} API failed with status ${llmResponse.status}`,
                  type: 'error',
                }) + '\n'
              )
            );
            controller.close();
            return;
          }

          const reader = llmResponse.body?.getReader();
          if (!reader) {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  error: 'No response stream',
                  type: 'error',
                })
              )
            );
            controller.close();
            return;
          }

          let fullResponse = '';
          const decoder = new TextDecoder();
          let sseBuffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            sseBuffer += decoder.decode(value, { stream: true });
            const lines = sseBuffer.split('\n');
            sseBuffer = lines.pop() || '';

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine.startsWith('data: ')) {
                const data = trimmedLine.slice(6).trim();
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    fullResponse += content;
                    // Send streaming chunk to client
                    controller.enqueue(
                      encoder.encode(
                        JSON.stringify({
                          type: 'chunk',
                          content,
                        }) + '\n'
                      )
                    );
                  }
                } catch (e) {
                  // Skip parse errors in stream
                  continue;
                }
              }
            }
          }

          const trailingLine = sseBuffer.trim();
          if (trailingLine.startsWith('data: ')) {
            const data = trailingLine.slice(6).trim();
            if (data !== '[DONE]') {
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullResponse += content;
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: 'chunk',
                        content,
                      }) + '\n'
                    )
                  );
                }
              } catch {
                // Ignore trailing parse errors
              }
            }
          }

          if (!fullResponse.trim()) {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: 'error',
                  error: 'Oracle returned an empty response stream.',
                }) + '\n'
              )
            );
            controller.close();
            return;
          }

          // After streaming complete, generate enhancements
          const tactics = generateTacticalSuggestions(fullResponse, birthChart, context);
          const forecast = generateMicroForecast(new Date(), birthChart, transits);
          const level = identifyCurrentLevel(context);

          // Send enhancements as separate JSON objects
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'tactics',
                data: tactics,
              }) + '\n'
            )
          );

          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'forecast',
                data: forecast,
              }) + '\n'
            )
          );

          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'level',
                data: level,
              }) + '\n'
            )
          );

          if (progression) {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: 'progression',
                  data: progression,
                }) + '\n'
              )
            );
          }

          // Store assistant message
          const assistantMessage: OracleMessage = {
            role: 'assistant',
            content: fullResponse,
            timestamp: new Date(),
          };
          oracleMemory.addMessage(userId, assistantMessage);

          console.log(`[Oracle Chat] Stream completed successfully for user: ${userId} (response length: ${fullResponse.length})`);

          // Signal completion
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'done',
              }) + '\n'
            )
          );

          controller.close();
        } catch (error) {
          console.error('[Oracle Chat] Stream error:', error, 'for user:', userId);
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                error: 'Stream processing failed',
                type: 'error',
              }) + '\n'
            )
          );
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[Oracle Chat] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/oracle-chat?userId=xxx
 * Retrieve conversation history
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId') || 'anonymous';
    const history = oracleMemory.getHistory(userId);

    return NextResponse.json({
      success: true,
      data: {
        history,
        messageCount: history.length,
      },
    });
  } catch (error) {
    console.error('[Oracle Chat] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve history',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/oracle-chat?userId=xxx
 * Clear conversation history
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId') || 'anonymous';
    oracleMemory.clearHistory(userId);

    return NextResponse.json({
      success: true,
      message: 'Conversation cleared',
    });
  } catch (error) {
    console.error('[Oracle Chat] DELETE error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clear history',
      },
      { status: 500 }
    );
  }
}
