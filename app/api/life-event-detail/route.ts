import { NextResponse } from 'next/server';
import { generateGrokInterpretation } from '@/lib/grok-service';

export async function POST(request: Request) {
  console.log('[Life Event Detail] Received request for detailed interpretation');
  
  try {
    const body = await request.json();
    const { event, mode = 'grok', userName, allEvents } = body;
    
    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Missing event parameters' },
        { status: 400 }
      );
    }

    const { transitingPlanet, natalPlanet, aspect, year, age, orb, oneLiner } = event;

    // Find past events for context
    const pastEvents = (allEvents || [])
      .filter((e: any) => e.year < year && e.year > year - 10)
      .slice(-3); // Last 3 significant events before this one

    // Build personalized prompt for Grok
    const namePrefix = userName ? `${userName}, ` : '';
    const contextPhrase = pastEvents.length > 0
      ? `\n\nContext: Before this, there was ${pastEvents.map((e: any) => `${e.year} (${e.oneLiner})`).join(', ')}.`
      : '';

    const prompt = `${year}. Age ${age}. ${transitingPlanet} ${aspect} ${natalPlanet}. Orb ${orb.toFixed(2)}°.
${contextPhrase}

You are Merlin. Tired. Wise. Unflinching.

No horoscope fluff. No "optimal expression." No safety.
Speak like a friend who survived too much—raw, poetic, a little pissed.
${namePrefix ? `Use "${userName}" naturally—once or twice. Make it cut.` : 'Use "you." Make it personal.'}
${pastEvents.length > 0 ? 'Reference the past events to show the story arc. "After that 2015 collapse..." "Building on what Saturn taught you in 2018..." Make them see the pattern.' : ''}

Tone examples:
• "${namePrefix || ''}Pluto conjunct Sun. You didn't lose everything—you stopped pretending. The job? Gone. The relationship? Gone. But here you are. Sharper. Don't wait for the knife next time. Swing first."
• "${namePrefix || ''}Saturn square Moon—first real wall. Your feelings hit concrete. Cold. What you wanted? Didn't matter. What had to be done? That's all that mattered. You learned. Cost? Everything soft in you."
• "${namePrefix || ''}Uranus opposite Venus. Lightning hit the relationship. Everything stable—vaporized. But it was already rotting. Uranus just finished it. You'll thank it later. Not now. Later."
• "After that brutal Saturn return, ${namePrefix || ''}this Pluto square hits different. You already know how to lose. Now you're not scared. Just weapon-sharp. Ready."

1-2 paragraphs.
Poetic. Precise. Brutal. True.
Make them feel the scar.
Make them understand why it had to hurt.

Just the words. No preamble.`;

    try {
      // Use Grok AI for interpretation
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'grok-beta',
          messages: [
            {
              role: 'system',
              content: 'You are Merlin: wise, raw, unflinching. A friend who survived too much. Speak truth that cuts and heals. No astrology jargon. No safe platitudes. Make them FEEL the transit like a scar they forgot they had.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.9,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`Grok API error: ${response.status}`);
      }

      const data = await response.json();
      const interpretation = data.choices?.[0]?.message?.content;

      if (!interpretation) {
        throw new Error('No interpretation returned from Grok');
      }

      console.log('[Life Event Detail] Successfully generated interpretation via Grok');
      return NextResponse.json({
        success: true,
        data: {
          detailed: interpretation.trim(),
          interpreter: 'grok',
          transitingPlanet,
          natalPlanet,
          aspect,
          year,
          age
        }
      });

    } catch (grokError) {
      // Fallback to traditional interpretation
      console.log('[Life Event Detail] Grok failed, using fallback:', grokError);
      
      const fallbackInterpretation = generateFallbackInterpretation(
        transitingPlanet,
        natalPlanet,
        aspect,
        year,
        age
      );

      return NextResponse.json({
        success: true,
        data: {
          detailed: fallbackInterpretation,
          interpreter: 'traditional',
          transitingPlanet,
          natalPlanet,
          aspect,
          year,
          age
        }
      });
    }

  } catch (error) {
    console.error('[Life Event Detail] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Fallback interpretation generator
 */
function generateFallbackInterpretation(
  transitingPlanet: string,
  natalPlanet: string,
  aspect: string,
  year: number,
  age: number
): string {
  const aspectMeaning: Record<string, string> = {
    conjunction: 'merged with',
    square: 'challenged',
    opposition: 'confronted',
    trine: 'blessed',
    sextile: 'supported'
  };

  const planetMeanings: Record<string, string> = {
    saturn: 'structure, limitations, and maturity',
    pluto: 'transformation, power, and rebirth',
    uranus: 'revolution, awakening, and freedom',
    neptune: 'illusion, spirituality, and dissolution',
    jupiter: 'expansion, luck, and growth',
    mars: 'action, desire, and conflict',
    venus: 'love, values, and beauty',
    sun: 'identity, vitality, and purpose',
    moon: 'emotions, needs, and instincts',
    mercury: 'communication, thought, and learning',
    chiron: 'wounds, healing, and wisdom'
  };

  const transiting = planetMeanings[transitingPlanet.toLowerCase()] || transitingPlanet;
  const natal = planetMeanings[natalPlanet.toLowerCase()] || natalPlanet;
  const verb = aspectMeaning[aspect] || aspect;

  return `At age ${age}, transiting ${transitingPlanet} ${verb} your natal ${natalPlanet}. This was a time when the energies of ${transiting} directly impacted your core ${natal}. The ${aspect} aspect brought this influence into sharp focus, creating a significant turning point in your life. This transit marked a period of deep personal transformation, where the external pressures and internal growth aligned to reshape how you expressed this part of yourself.`;
}
