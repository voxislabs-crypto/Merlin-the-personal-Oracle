// API Route: Oracle Chat - Streaming Q&A with chart context
import { NextRequest, NextResponse } from 'next/server';
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
import { getCurrentTransits, getTransitsForDate, getTransitingPositions } from '@/lib/astrology/transits';
import { detectHouseIngressHits } from '@/lib/astrology/natal-angles';
import {
  collectHorizonHits,
  selectMentionWorthy,
  toOracleTransit,
} from '@/lib/astrology/mention-worthy';
import { extractLivedThemesFromMention } from '@/lib/astrology/lived-themes';
import { withReflection } from '@/lib/astrology/meaning-synthesis';
import { natalPointsForTransits } from '@/lib/astrology/natal-angles';
import { calendarDateToLocalNoon, getLocalCalendarDate } from '@/lib/datetime/local-calendar';
import { getTodaysForecast } from '@/lib/astrology/ephemeris';
import { detectWeeklyStorms } from '@/lib/astrology/storms';
import { getMBTIDual } from '@/lib/personality/fusion';
import { getUserContextSnapshot, upsertUserContextSnapshot } from '@/lib/user-context';
import { BirthChartData } from '@/types/astrology';
import { generateIdentityPack } from '@/lib/identity-pack';
import { advanceArcProgression } from '@/lib/progression';
import { detectPatternFromText, getPatternMirror, logInteractionEvent } from '@/lib/pattern-mirror';
import { detectQueryMode, generateCasualResponse, shouldSkipStructure } from '@/lib/chat-adapter';
import { wantsAncientLayer } from '@/lib/astrology/ancient-astrology';
import type { AtmospherePacket } from '@/lib/atmosphere/types';
import { getLlmConfig } from '@/lib/llm-config';
import { consumeOracleQuota, oracleQuotaDeniedResponse } from '@/lib/oracle-quota';
import { normalizeClientConversationHistory } from '@/lib/oracle-chat-memory';

interface OracleChatRequest {
  question: string;
  birthChart?: any;
  progressedChart?: any;
  userId?: string;
  plainEnglish?: boolean; // Clarity Mode - strips astro jargon
  mbtiType?: string; // MBTI archetype for storm cross-reference
  tonePreset?: 'warm' | 'direct' | 'mystic' | 'strategic';
  oracleMode?: 'auto' | 'casual' | 'detailed'; // Adaptive mode: auto-detect or user override
  includeLikelihood?: boolean; // Include percentages in structured responses
  ancientLayer?: boolean; // Toggle ancient source weaving
  atmospherePacket?: AtmospherePacket | null;
  dualPersonality?: {
    core?: string;
    mask?: string;
    final?: string;
  } | null;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
  }>;
}

function seedOracleMemoryFromClient(
  userId: string,
  clientHistory: OracleChatRequest['conversationHistory']
) {
  const incoming = normalizeClientConversationHistory(clientHistory);
  if (!incoming.length) return;

  const existing = oracleMemory.getHistory(userId);
  if (existing.length >= incoming.length) return;

  oracleMemory.clearHistory(userId);
  for (const message of incoming) {
    oracleMemory.addMessage(userId, {
      role: message.role,
      content: message.content,
      timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
    });
  }
}

function getOracleLlmConfig() {
  return getLlmConfig();
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
      oracleMode = 'auto',
      includeLikelihood = true,
      ancientLayer = false,
      atmospherePacket,
      dualPersonality,
      conversationHistory: clientConversationHistory,
    } = body;

    seedOracleMemoryFromClient(userId, clientConversationHistory);

    if (!question || question.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Question cannot be empty' },
        { status: 400 }
      );
    }

    // Free tier: hard daily message cap (paid unlimited). Enforce before any LLM work.
    const quota = await consumeOracleQuota();
    if (!quota.allowed) {
      const denied = oracleQuotaDeniedResponse(quota);
      return NextResponse.json(denied.body, { status: denied.status });
    }

    // ========== ADAPTIVE MODE ==========
    // Small talk only uses casual path when there is no chart/atmosphere to ground answers.
    // With app data present, always use full Merlin (interactive + sight).
    let activeMode =
      oracleMode === 'auto'
        ? detectQueryMode(question)
        : oracleMode === 'casual'
          ? 'casual'
          : 'astro';
    const hasAppData = Boolean(
      birthChart ||
        atmospherePacket ||
        (birthChart?.planets || birthChart?.positions || []).length
    );
    if (activeMode === 'casual' && hasAppData) {
      activeMode = 'astro';
    }
    const shouldSkipPercentages = shouldSkipStructure(question) && !includeLikelihood;

    console.log(
      `[Oracle Chat] Mode: question="${question.substring(0, 40)}..." → ${activeMode} (appData=${hasAppData}, skip_structure=${shouldSkipPercentages})`
    );

    // ========== CASUAL FAST PATH (no chart / no weather) ==========
    if (activeMode === 'casual' && !hasAppData) {
      console.log('[Oracle Chat] Casual small-talk path (no chart loaded)');
      try {
        const casualResponse = await generateCasualResponse(question, userId, {
          birthChart,
          atmospherePacket,
        });

        const userMessage: OracleMessage = {
          role: 'user',
          content: question,
          timestamp: new Date(),
        };
        oracleMemory.addMessage(userId, userMessage);
        oracleMemory.addMessage(userId, {
          role: 'assistant',
          content: casualResponse,
          timestamp: new Date(),
        });

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(
              encoder.encode(JSON.stringify({ type: 'chunk', content: casualResponse }) + '\n')
            );
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: 'done',
                  mode: 'casual',
                  includeLikelihood,
                  ancientLayer,
                  timestamp: new Date().toISOString(),
                }) + '\n'
              )
            );
            controller.close();
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
        console.warn('[Oracle Chat] Casual path failed, falling through to full oracle:', error);
        activeMode = 'astro';
      }
    }

    // ========== FULL MERLIN (app sight + conversation) ==========
    console.log('[Oracle Chat] Full Merlin path — chart / weather / interactive');

    // Get conversation history
    const history = oracleMemory.getHistory(userId);

    // Calculate real-time transit and forecast data if birth chart provided
    let transits: TransitData | undefined;
    let dailyForecast;
    let stormsReport;
    
    // Support both .planets (BirthChartData) and .positions (legacy) field names
    const natalPlanets = natalPointsForTransits(birthChart || {});
    
    if (natalPlanets.length > 0) {
      try {
        console.log('[Oracle Chat] Calculating current transits for chart awareness');
        const asOf = new Date();
        const today = getLocalCalendarDate(asOf);
        const transitMatches = getCurrentTransits(natalPlanets, asOf);
        const horizonHits = [
          ...collectHorizonHits(
            (date) => getTransitsForDate(natalPlanets, calendarDateToLocalNoon(date)),
            today,
            7,
          ),
          ...detectHouseIngressHits(
            getTransitingPositions(asOf),
            birthChart?.houses,
            today,
          ),
        ];
        const mentionWorthy = selectMentionWorthy(horizonHits, today);
        const livedThemes = withReflection(
          extractLivedThemesFromMention(mentionWorthy, {
            planets: natalPlanets,
            houses: birthChart?.houses,
            aspects: birthChart?.aspects,
            ascendantSign: birthChart?.ascendant?.sign,
          }),
        );
        const significant = mentionWorthy.now.map(toOracleTransit);
        const approaching = mentionWorthy.upcoming.map(toOracleTransit);

        transits = {
          all: transitMatches,
          significant,
          approaching,
          mentionWorthy,
          livedThemes,
          summary: {
            total: transitMatches.length,
            exact: significant.length,
            approaching: approaching.length,
          },
        };

        console.log(
          `[Oracle Chat] ${transits.summary.total} in-orb; mentioning ${mentionWorthy.mentioned.length} (headline=${mentionWorthy.headline?.label || 'none'})`,
        );
        
        // Get today's forecast — ensure planets field is populated for the forecast engine
        const chartForForecast = { ...birthChart, planets: natalPlanets };
        dailyForecast = getTodaysForecast(chartForForecast as BirthChartData);
        console.log(`[Oracle Chat] Generated today's forecast: ${dailyForecast.day_rating}`);

        // Compute MBTI and weekly storms so Grok can use the same navigation intelligence as dashboard cards
        const mbtiFromChart = (birthChart as any)?.personalitySnapshot?.finalType;
        const mbtiDual = mbtiFromChart ? null : getMBTIDual(chartForForecast as BirthChartData);
        const mbtiForStorms = mbtiType || mbtiFromChart || mbtiDual?.type;
        stormsReport = detectWeeklyStorms(chartForForecast as BirthChartData, mbtiForStorms as any, 30);
        console.log(
          `[Oracle Chat] Storm playbook: ${stormsReport.storms.length} storm(s), MBTI=${mbtiForStorms || 'n/a'}, riskFromClient=${Boolean(atmospherePacket?.risk)}`
        );
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
    let detectedPattern = null as { key: string; label: string; confidence: number } | null;
    let progression: {
      arcPath: string;
      arcLevel: number;
      arcXp: number;
      interactionCount: number;
      lastInteractionAt: string;
      xpGained: number;
    } | null = null;
    let patternMirror = null;
    if (userId && userId !== 'anonymous') {
      try {
        detectedPattern = detectPatternFromText(question);
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

        await logInteractionEvent({
          userId,
          type: 'question',
          content: question,
          detectedPattern: detectedPattern.key,
          confidence: detectedPattern.confidence,
          metadata: {
            tonePreset,
            plainEnglish,
            xpGained: progression.xpGained,
          },
        });

        patternMirror = await getPatternMirror(userId);
      } catch (error) {
        console.warn('[Oracle Chat] Could not load user context from database:', error instanceof Error ? error.message : 'Unknown error');
        // Continue without user context - oracle will still work
      }
    }

    const stanceMode = ((progression?.arcLevel || userContext?.arcLevel || 1) > 3 ? 'direct' : 'soft') as 'direct' | 'soft';
    const mirrorInsightPayload = patternMirror?.mirrorInsight
      ? {
          ...patternMirror.mirrorInsight,
          trendStatus: patternMirror?.dominant?.trendStatus,
          stanceMode,
        }
      : null;

    // Build context
    const context: OracleContext = {
      birthChart,
      progressedChart,
      transits,
      dailyForecast,
      atmospherePacket: atmospherePacket || undefined,
      userContext,
      stormsReport,
      conversationHistory: history,
      currentQuestion: question,
      userId,
      currentDate: new Date(),
      plainEnglish,
      mbtiType:
        dualPersonality?.final ||
        dualPersonality?.core ||
        derivedMbtiType,
      dualPersonality: dualPersonality || null,
      tonePreset,
      patternMirror,
    };

    // Add user message to history
    const userMessage: OracleMessage = {
      role: 'user',
      content: question,
      timestamp: new Date(),
    };
    oracleMemory.addMessage(userId, userMessage);

    // One writer: VOICE STRATEGY is already in the system prompt.
    // Do not wrap this stream in generateMessage — that would be a second model.
    const baseSystemPrompt = buildOracleSystemPrompt(context);
    const conversationalAddon = shouldSkipStructure(question)
      ? `\n\nEMOTIONAL CARE MODE: The user may be raw. Stay steady and intelligent. Lead with recognition of their state, then one grounding observation from live data if available, then one small reversible step. No percentages dump. No lectures.`
      : '';
    const ancientEnabled = wantsAncientLayer(question, { ancientLayer });
    const ancientPromptAddon = ancientEnabled
      ? `\n\nANCIENT LAYER: ENABLED\n- Keep Merlin's composed intellectual voice.\n- Start with a fluent direct read.\n- If they ask deeper/expand/ancient/old story, add one classical or Hermetic framing line tied to their actual transit data.\n- End with one practical nudge.`
      : '';
    const systemPrompt = `${baseSystemPrompt}${conversationalAddon}${ancientPromptAddon}`;

    console.log(
      `[Oracle Chat] Context sight: chart=${Boolean(birthChart)} risk=${Boolean(atmospherePacket?.risk)} storms=${stormsReport?.storms?.length ?? 0} transits=${transits?.summary?.total ?? 0} dual=${Boolean(dualPersonality?.core)}`
    );

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
              temperature: 0.72,
              max_tokens: 1800,
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
                } catch {
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

          if (mirrorInsightPayload) {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: 'mirrorInsight',
                  data: mirrorInsightPayload,
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

          // Signal completion with metadata
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'done',
                mode: activeMode,
                includeLikelihood,
                ancientLayer: ancientEnabled,
                timestamp: new Date().toISOString(),
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
