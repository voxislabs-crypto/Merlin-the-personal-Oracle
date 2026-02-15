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

    const prompt = `You are analyzing a specific life event from someone's astrological timeline.

EVENT:
Year: ${year}
Age: ${age}
Transit: ${transitingPlanet} ${aspect} natal ${natalPlanet}
Orb: ${orb.toFixed(2)}°
One-liner: "${oneLiner}"${contextPhrase}

Generate a 1-2 paragraph detailed interpretation of what this transit means.

${namePrefix ? `Use the user's first name "${userName}" naturally in the text (once or twice). Make it personal, not clinical.` : 'Speak directly as "you".'}
${pastEvents.length > 0 ? 'Reference past events for continuity — show the story arc. Example: "After the 2009 collapse..." or "Building on that 2015 awakening..."' : ''}
Keep tone raw, unflinching, wise. No horoscope fluff. No platitudes. Make them FEEL the transit.

Examples of tone:
- "${namePrefix}Pluto conjunct your Sun. Not death. Just the end of who you were pretending to be. The relationship that finally cracked. The job that vanished. You didn't lose. You were stripped. What's left? Sharper."
- "${namePrefix}Saturn square your Moon. First real wall. Your feelings hit concrete. Cold. Hard. What you wanted didn't matter. What had to be done — that mattered."
- "${namePrefix}Uranus opposed your Venus. Lightning strike in relationships. Everything stable — gone. But it was already dying. Uranus just pulled the plug."
- "After that Saturn return in 2018, ${namePrefix}this Pluto square hits different. You've already learned the hard way. Now you're not scared. Just ready."

Write 1-2 paragraphs.
Poetic but precise.
Brutal but helpful.
Make them feel seen.

Return ONLY the interpretation text. No intro, no "Here's the interpretation:" — just the words.`;

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
              content: 'You are Merlin, a wise astrologer. Speak truth. No fluff. Make them feel the transit.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.85,
          max_tokens: 800
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
