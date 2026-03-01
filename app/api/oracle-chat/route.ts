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
import { BirthChartData } from '@/types/astrology';

interface OracleChatRequest {
  question: string;
  birthChart?: any;
  progressedChart?: any;
  userId?: string;
  plainEnglish?: boolean; // Clarity Mode - strips astro jargon
  mbtiType?: string; // MBTI archetype for storm cross-reference
}

/**
 * POST /api/oracle-chat
 * Streaming oracle chat endpoint with chart context awareness
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as OracleChatRequest;
    const { question, birthChart, progressedChart, userId = 'anonymous', plainEnglish = true, mbtiType } = body;

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
      } catch (error) {
        console.warn('[Oracle Chat] Could not calculate transits/forecast:', error);
        // Continue without transit data - oracle will still work with natal chart only
      }
    }

    // Build context
    const context: OracleContext = {
      birthChart,
      progressedChart,
      transits,
      dailyForecast,
      conversationHistory: history,
      userId,
      currentDate: new Date(),
      plainEnglish,
      mbtiType,
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

    // Convert conversation history to format Grok expects
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
          // Verify Grok API key is configured
          if (!process.env.XAI_API_KEY) {
            console.error('[Oracle] XAI_API_KEY is not configured');
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: 'error',
                  error: 'Grok API key not configured. Please set XAI_API_KEY in your environment.',
                }) + '\n'
              )
            );
            controller.close();
            return;
          }

          console.log(`[Oracle Chat] Starting stream for user: ${userId}, question: "${question.substring(0, 50)}..."`);

          // Call Grok API with streaming
          const grokResponse = await fetch(
            'https://api.x.ai/v1/chat/completions',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.XAI_API_KEY}`,
              },
              body: JSON.stringify({
                model: 'grok-3-fast',
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
            }
          );

          if (!grokResponse.ok) {
            const error = await grokResponse.text();
            console.error('[Oracle] Grok API error:', grokResponse.status, error);
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  error: `Grok API failed with status ${grokResponse.status}`,
                  type: 'error',
                }) + '\n'
              )
            );
            controller.close();
            return;
          }

          const reader = grokResponse.body?.getReader();
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

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
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
