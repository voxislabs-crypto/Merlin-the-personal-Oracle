'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MBTIDetails } from '@/lib/astrology/mbtiFusion';

export interface MBTIDisplayProps {
  mbti: MBTIDetails;
  className?: string;
}

const MBTI_DESCRIPTIONS: Record<string, { name: string; description: string; coreWiring: string; shadow: string; power: string }> = {
  'INTJ': {
    name: 'The Architect',
    description: 'You perceive the world as a system—one that can always be understood more deeply and redesigned more efficiently. Your inner life is rich with long-horizon plans, abstract models, and strategic forecasts that most people never even consider. Where others see obstacles, you see leverage points. Where others react, you have already planned three moves ahead.',
    coreWiring: 'Introverted Intuition drives you to synthesize patterns across time and information, arriving at conclusions that seem sudden to others but have been quietly building for years. Extroverted Thinking then executes those visions with ruthless precision. You are not cold—you are selective. Your standards are extraordinarily high, and you apply them first to yourself.',
    shadow: 'Your greatest friction comes in human connection. You can appear distant, arrogant, or dismissive without intending to be any of those things—simply because you lead with competence rather than warmth. You can struggle when reality doesn\'t match your mental models, and in those moments, frustration can curdle into rigid inflexibility.',
    power: 'When your vision aligns with your values and you have the autonomy to execute, you are unstoppable. You build for decades, not weeks. Systems you create outlast your involvement in them. That is your legacy—architecture that still stands after you\'ve moved on to the next impossible problem.',
  },
  'INTP': {
    name: 'The Logician',
    description: 'Your mind is a relentless framework-builder. Every idea you encounter is immediately interrogated—is it internally consistent? Does it survive edge cases? Is there a deeper, more elegant explanation? You do not trust received wisdom, and you have no patience for conclusions that skip the work. Truth, as you understand it, is never final—only more refined.',
    coreWiring: 'Introverted Thinking is your dominant engine: a powerful internal logic processor that demands coherence above all else. Extroverted Intuition feeds it an endless supply of connections, analogies, and hypotheticals. Together they produce a mind that can model systems with surgical clarity—and then find their hidden failure points.',
    shadow: 'The same precision that makes you brilliant can make follow-through feel beneath you. Once you\'ve solved something mentally, executing it in the physical world feels like repetitive labor. Social conventions, emotional undercurrents, and unspoken expectations can wash past you unnoticed—leaving others feeling unseen and you confused about why.',
    power: 'When a genuinely hard problem lands in front of you—one that has broken everyone else—you come alive. You are the person who actually reads the specification, finds the contradiction in chapter 3, and builds the fix from first principles. No one is better equipped to see what\'s actually wrong.',
  },
  'ENTJ': {
    name: 'The Commander',
    description: 'You are built for command. Not because you seek power for its own sake, but because you can see what needs to happen, and it genuinely perplexes you when others don\'t move toward it with the same urgency you feel. You think in outcomes, lead in action, and measure success in what gets built. Inefficiency is almost physically uncomfortable for you.',
    coreWiring: 'Extroverted Thinking is your commanding first function: you organize the external world—people, systems, timelines—toward measurable goals. Introverted Intuition gives you the strategic depth to see past immediate problems toward long-term implications. You don\'t just manage; you architect.',
    shadow: 'Your drive can become a bulldozer when you lose patience for the human factors in the room. Vulnerability—yours or others\'—can feel like weakness, and that belief has cost you relationships that needed something softer. The greatest growth edge for an ENTJ is learning that receiving care is not the same as ceding ground.',
    power: 'In a crisis—when decisions need to be made under pressure, when teams are floundering, when the path forward is genuinely unclear—your value becomes undeniable. You can hold the room, absorb the chaos, and deliver a plan that actually works. You were built for the moment everyone else is overwhelmed.',
  },
  'ENTP': {
    name: 'The Debater',
    description: 'You are the person who cannot help but find the other side of every argument—not because you disagree, but because incomplete thinking offends you at a cellular level. You live at the intersection of ideas, and you find the collision of contradictory concepts almost pleasurable. Nothing energizes you more than a conversation that forces genuine intellectual flexibility.',
    coreWiring: 'Extroverted Intuition is your entry point into everything: possibilities, patterns, connections, alternatives. Your brain generates new frameworks faster than most people process existing ones. Introverted Thinking then selects and tests the most interesting ideas—a quality filter that prevents the output from being random.',
    shadow: 'Follow-through is your recurring Achilles heel. You are far more interested in starting than finishing, in challenging than building, in questioning than deciding. Partners, collaborators, and teams can feel abandoned in your wake as you pivot to the next interesting problem. Commitment—to a plan, a relationship, a direction—is where the work actually is for you.',
    power: 'In brainstorming rooms, in negotiations, in moments where conventional thinking has hit a wall—you are exactly who\'s needed. Your ability to inhabit a position you disagree with, stress-test it from the inside, and return with a better synthesis is rare and genuinely valuable. You do not have to win the argument—you have to make the thinking better.',
  },
  'INFJ': {
    name: 'The Advocate',
    description: 'You carry a quiet knowing that operates below language. Before meetings, you sense how they\'ll go. Before relationships deepen, you see where they\'re heading. This isn\'t mysticism—it\'s pattern recognition running at a level that bypasses conscious analysis. You feel the emotional currents in rooms the same way others feel temperature: automatically, immediately, and before they can explain it.',
    coreWiring: 'Introverted Intuition gives you a long view that borders on prophetic—not because you predict the future, but because you can read the present so deeply that its trajectory becomes obvious. Extroverted Feeling allows you to translate that inner knowing into language and action that moves people. You are built to be a bridge between what is and what could be.',
    shadow: 'The same sensitivity that makes you perceptive makes you porous. Other people\'s emotional states can settle into you without permission. You can absorb a room\'s anxiety and mistake it for your own. Enforcing boundaries feels unnatural—almost cruel—even though their absence slowly hollows you out. The self-erasure is usually invisible until the collapse.',
    power: 'You speak into the places that hurt most—with precision and without cruelty. When you offer someone a reflection of what you\'ve seen in them, it lands differently than other people\'s words. It carries weight. That gift—used with intention—can change lives. You are not accidental. You were built for something specific.',
  },
  'INFP': {
    name: 'The Mediator',
    description: 'Your inner world is a cathedral—vast, detailed, made of values and stories and the accumulated weight of everything that has ever moved you. You process the world through meaning. A piece of music, a turn of phrase, an act of unexpected kindness can stop you mid-stride. You are not naive about suffering—you feel it deeply—but you remain stubbornly oriented toward what is possible in human beings.',
    coreWiring: 'Introverted Feeling is your core: a profound internal value system that operates as an almost moral compass, distinguishing authentic from false at great distance. Extroverted Intuition then reaches outward into ideas, narratives, and possibilities—fueling the creativity and idealism that people around you can both love and find frustrating.',
    shadow: 'When the gap between how things are and how they should be becomes too wide, you can retreat entirely. Perfectionist standards—applied both to your own output and to the behavior of people you care about—can lead to paralysis or quiet withdrawal that others experience as abandonment without understanding the cause.',
    power: 'Your most important quality is the one hardest to quantify: you make people feel understood when no one else comes close. You hold space for complexity in human beings without the urge to fix, simplify, or explain it away. In a world of rapid transactions, that kind of deep witnessing is extraordinarily rare.',
  },
  'ENFJ': {
    name: 'The Protagonist',
    description: 'You walk into a room and begin reading it: who needs encouragement, who is in conflict, what unstated need is hanging in the air. You are not doing this deliberately—it is simply how you perceive. People are your primary data stream, and your natural response to that data is movement toward them. You want to help, to lift, to catalyze. Standing on the sidelines when someone needs something feels genuinely wrong to you.',
    coreWiring: 'Extroverted Feeling is dominant: you orient toward others\' emotional realities with extraordinary speed and accuracy. Introverted Intuition runs underneath, giving your people-reading a depth that goes beyond observation into understanding why—the patterns behind the behavior, the wound behind the anger, the fear behind the resistance.',
    shadow: 'You can lose yourself completely in the project of other people. The needs of friends, partners, teams can fill every available space until there is no room left that is just yours. You may not realize how much you have given until something breaks. The performance of strength—"I\'m fine, I\'ve got this"—can prevent you from receiving the care you so readily give.',
    power: 'Your ability to see potential in people before they can see it in themselves—and to speak it into existence with enough conviction that they start to believe it—is a form of leadership that goes beyond management. You don\'t build organizations. You build people, and people build everything else.',
  },
  'ENFP': {
    name: 'The Campaigner',
    description: 'You are wired for possibility. Every person you meet is a world to be explored; every idea is a thread that might lead somewhere extraordinary. You connect dots across disciplines, personalities, and timelines effortlessly—often in the middle of a sentence that started somewhere else entirely. Life is not a series of tasks to be completed but a series of discoveries to be made, and you approach it with an enthusiasm that can be contagious or exhausting depending on who you\'re with.',
    coreWiring: 'Extroverted Intuition drives constant outward exploration: new ideas, new people, new frameworks, new possibilities. Introverted Feeling provides the anchor point—a deep value system that ultimately decides which possibilities are worth pursuing and which would compromise something essential. You experience this as a constant creative tension between freedom and integrity.',
    shadow: 'Beginnings excite you in ways that middles and ends cannot. Once the novel becomes familiar, the pull toward the next new thing can feel irresistible—and the trail of unfinished projects, drifted friendships, and abandoned commitments can accumulate into a self-narrative of incompleteness. The work is in learning to sustain what you start.',
    power: 'In moments of cultural stagnation—when people have stopped imagining alternatives—you are the permission structure that opens the room. Your conviction that something better is possible, delivered with genuine warmth rather than evangelism, moves people. You don\'t just inspire. You create the belief that change is worth attempting.',
  },
  'ISTJ': {
    name: 'The Logistician',
    description: 'You are the person who shows up, does the work, and delivers—every time. Not because of performance, but because reliability is a value you have held as non-negotiable since before you could articulate it. You do not need recognition to keep the standard high. You would keep it high in an empty room. Your word is architecture—when you say you will do something, it is already done in every meaningful sense.',
    coreWiring: 'Introverted Sensing is your dominant function: a vast internal archive of what has worked, what has failed, and what the precedent suggests about the present situation. Extroverted Thinking then translates that knowledge into concrete, efficient action. You are not resistant to change—you are resistant to change without evidence that the new approach is better than what already works.',
    shadow: 'The same loyalty to precedent that makes you dependable can make adaptation feel threatening. When circumstances shift in ways that invalidate the playbook, you may hold the line past the point of utility—not from stubbornness, but from a genuine belief that abandoning what has worked is a form of recklessness. Flexibility, for you, must be earned by evidence.',
    power: 'In a world of unreliable people and incomplete systems, you are the bedrock. Organizations that have you operating quietly in their structure rarely realize how much depends on it until you are gone. What you build lasts. What you commit to survives. That is not a small gift.',
  },
  'ISFJ': {
    name: 'The Defender',
    description: 'You carry people. Not metaphorically—literally, in detail. You remember birthdays, allergies, the name of someone\'s grandmother who passed away three years ago, the thing a colleague mentioned once in passing that clearly hurt them. You store this information not as data but as a form of love. You express care through specificity, through preparation, through showing up with exactly what is needed before it is asked for.',
    coreWiring: 'Introverted Sensing anchors everything in concrete, personal memory—making you extraordinarily attuned to the particulars of individuals and situations. Extroverted Feeling then directs that attunement outward in service to others. You are not abstract in your kindness. It is always specific, always relational, always earned through paying close attention.',
    shadow: 'You can be so adept at anticipating others\' needs that your own remain perpetually deferred. The phrase "I\'m fine" carries enormous weight in your vocabulary—it is both a statement and, sometimes, a protective lie. You may go a long time without realizing how depleted you are, because tending to yourself feels less urgent than tending to everyone else.',
    power: 'In a culture that routinely undervalues steadiness, your presence is quietly extraordinary. The consistency with which you show up—not just in crises but on ordinary Tuesdays, for years—accumulates into a form of loyalty that most people never experience from another human being. You are someone who can be trusted with what matters most.',
  },
  'ESTJ': {
    name: 'The Executive',
    description: 'You believe in doing things right, not just doing things. You have little patience for sloppiness, shortcuts, or vague commitments masquerading as plans. When a task is assigned to you, it comes back complete. When a system is broken, you fix it—methodically, with documentation. You lead from the front, set clear expectations, and hold yourself to the same standard you hold everyone else. The world would function significantly better if more people operated the way you do.',
    coreWiring: 'Extroverted Thinking leads: you organize people, resources, and timelines around achieving measurable outcomes with maximum efficiency. Introverted Sensing provides the library of precedent—what has worked, what hasn\'t, and what the rule book says. Together, these make you an extraordinary manager of complex, high-stakes operations.',
    shadow: 'Your conviction about the right way to do things can tip into inflexibility. People who operate differently—more intuitively, more emotionally, more messily—can feel dismissed before they have had a chance to prove their value. And in moments of personal difficulty, the armour of competence can prevent anyone from offering the support that is actually needed.',
    power: 'In chaos, you provide clarity. In organizations without standards, you set them. When commitment wavers, yours does not. The people around you may not always say so, but the reliability of your word—and the quality of what you deliver—is the invisible load-bearing wall that holds a great deal up.',
  },
  'ESFJ': {
    name: 'The Consul',
    description: 'Your natural habitat is the gathering—the dinner table, the team meeting, the group chat—where people come together and something larger than each individual person happens. You are the one who makes the gathering happen, who remembers who has dietary restrictions, who checks in on the person who has been quiet all night. Social cohesion is not a skill for you. It is a calling. The wellbeing of your people is something you take genuinely, personally, and sometimes exhaustingly seriously.',
    coreWiring: 'Extroverted Feeling is dominant: you process experiences through their relational impact, read emotional atmospheres with extraordinary sensitivity, and navigate social dynamics with an instinctive fluency that others can spend a lifetime trying to learn. Introverted Sensing grounds that attunement in a rich memory of personal and shared history.',
    shadow: 'The desire to maintain harmony can lead you to smooth over things that actually need to be confronted. You are capable of telling people what they want to hear rather than what they need to hear—not from dishonesty, but from a genuine belief that maintaining the relationship is more important than any single truth. Over time, that accommodation can feel like abandonment to the self.',
    power: 'In times of collective stress, you are the one who holds the group together—not through authority, but through care so consistent and precise that people feel safe without quite understanding why. Belonging is not automatic for most people. You make it happen, and that matters more than it is ever measured.',
  },
  'ISTP': {
    name: 'The Virtuoso',
    description: 'You learn by doing. Not because you lack theory—you are often deeply knowledgeable—but because for you, understanding and hands-on interaction are the same thing. You want to take it apart, see how it works, put it back together better. This applies to engines, software, instruments, physical systems, and people. You are economical in all things: motion, words, commitment. What you do say and do carries weight precisely because you don\'t waste either.',
    coreWiring: 'Introverted Thinking is your engine: precise, independent, and relentlessly focused on how things work. Extroverted Sensing grounds that thinking in the immediate physical world—you are exceptionally present, calm under pressure, and responsive rather than reactive. You process the external environment with rare clarity.',
    shadow: 'Emotional access can be genuinely difficult. You may feel things deeply but have no reliable vocabulary or process for those feelings—so they get filed, deferred, or ignored until they arrive as a crash or a withdrawal that surprises even you. The people who need more warmth, more words, more reassurance can feel perpetually shut out.',
    power: 'In real-time crises—mechanical, physical, technical, or interpersonal—your calm and competence under pressure are extraordinary. While others escalate, you narrow your focus. While others talk about what might be done, you do it. Your problem-solving in the moment is not a skill—it is reflexive. You were built for exactly this.',
  },
  'ISFP': {
    name: 'The Adventurer',
    description: 'You experience the world through texture, beauty, and sensation before you interpret it intellectually. A song, a colour, a quality of light, a particular silence between two people—you register these at a depth that most people have already moved past. You do not announce your values. You live them. Your authenticity is not a position you take—it\'s the only way you know how to be, and the inauthenticity of others registers in you like a false note.',
    coreWiring: 'Introverted Feeling gives you an extraordinarily refined value system that operates beneath the surface—quiet, absolute, and deeply personal. Extroverted Sensing keeps you fully present in the physical world, responsive to immediate experience rather than abstractions about what things mean. You trust the body and the senses as primary sources of truth.',
    shadow: 'Conflict feels like violence. You would rather disappear than escalate, and that choice can leave things unresolved—sometimes permanently. When deeply hurt, you may withdraw so completely that the other person has no map to find their way back to you. The gentle exterior can conceal a wound that has been quietly accumulating for a long time.',
    power: 'Your presence in someone\'s life is a particular kind of gift: an encounter with someone who is entirely, consistently, exactly who they are. There is no performance in you. That truth draws people—not always consciously, but reliably. And your sensitivity to beauty, when channeled into creative work, produces things that shift something in the people who experience them.',
  },
  'ESTP': {
    name: 'The Entrepreneur',
    description: 'You are maximally alive in the present tense. The immediate situation—its dynamics, its assets, its possibilities—is where you live. You process faster in real time than almost anyone: reading people, sensing momentum, calculating risk and opportunity with an almost physical intuition. You are the one charging when others are still debating. In fast-moving, high-stakes environments, that quality isn\'t just useful—it\'s decisive.',
    coreWiring: 'Extroverted Sensing is dominant: you take in enormous amounts of environmental and interpersonal data and respond quickly with a confidence that can look reckless but is usually more calibrated than it appears. Introverted Thinking provides the quick-fire logic beneath: you are not just acting—you are solving, rapidly, with excellent short-term models.',
    shadow: 'The long game can elude you. Decisions that feel correct in the moment can accumulate into patterns with consequences that weren\'t anticipated or considered. Boredom is your kryptonite—it leads to impulse decisions, avoidable risks, or the departure from something that needed a few more weeks of uncomfortable commitment.',
    power: 'In negotiations, in emergencies, in moments when the energy in a room has collapsed and someone needs to spark it back to life—you are irreplaceable. Your confidence, your energy, your capacity to act without needing certainty first makes things happen that would otherwise never happen. The world needs people who move.',
  },
  'ESFP': {
    name: 'The Entertainer',
    description: 'You bring something into a room that cannot be manufactured: genuine, infectious pleasure in being alive. You do not perform enthusiasm—you are enthusiastic. You do not work at connection—it happens because you are actually interested in whoever is in front of you, right now, in this moment. Your presence is a gift that most people feel immediately, even if they can\'t articulate why. People feel seen by you—because they are.',
    coreWiring: 'Extroverted Sensing makes you fully present, highly responsive to beauty and experience, and broadly generous with your energy and attention. Introverted Feeling provides the deeper current: a set of values that quietly governs which experiences and relationships are truly worth your investment, distinct from those that merely entertain.',
    shadow: 'The insistence on lightness can be a way of avoiding depth. Conversations that turn heavy, relationships that need difficult honesty, situations that require sitting in discomfort—these can trigger a pivot to something more enjoyable before the resolution has actually arrived. Over time, the undressed wounds accumulate.',
    power: 'In a culture of self-consciousness and performance, the simple gift of genuine presence—of making someone feel that right now, with you, is exactly where you want to be—is astonishing. You remind people that being alive is worth something, that joy is not a reward for finishing your obligations. That is a kind of healing.',
  },
};

export function MBTIDisplay({ mbti, className = '' }: MBTIDisplayProps) {
  const typeInfo = MBTI_DESCRIPTIONS[mbti.type] || {
    name: 'Unknown Type',
    description: 'Personality type information not available',
    coreWiring: '',
    shadow: '',
    power: '',
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-600 dark:text-green-400';
    if (confidence >= 70) return 'text-blue-600 dark:text-blue-400';
    if (confidence >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getLetterDescription = (letter: string) => {
    const descriptions: Record<string, { full: string; trait: string }> = {
      'E': { full: 'Extraversion', trait: 'Energized by external world' },
      'I': { full: 'Introversion', trait: 'Energized by inner world' },
      'S': { full: 'Sensing', trait: 'Focus on facts and details' },
      'N': { full: 'Intuition', trait: 'Focus on patterns and possibilities' },
      'T': { full: 'Thinking', trait: 'Make decisions with logic' },
      'F': { full: 'Feeling', trait: 'Make decisions with values' },
      'J': { full: 'Judging', trait: 'Prefer structure and plans' },
      'P': { full: 'Perceiving', trait: 'Prefer flexibility and spontaneity' },
    };
    return descriptions[letter] || { full: '', trait: '' };
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">
              {mbti.type}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {typeInfo.name}
              </span>
            </CardTitle>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${getConfidenceColor(mbti.confidence)}`}>
              {mbti.confidence}%
            </div>
            <div className="text-xs text-muted-foreground">Confidence</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Core Description */}
        <div className="rounded-lg bg-slate-900/60 border border-slate-700/50 p-4">
          <p className="text-sm text-slate-200 leading-relaxed">{typeInfo.description}</p>
        </div>

        {/* Three deep-dive sections */}
        {typeInfo.coreWiring && (
          <div className="space-y-3">
            <div className="rounded-lg bg-indigo-950/30 border border-indigo-500/25 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2">Core Wiring</p>
              <p className="text-sm text-slate-300 leading-relaxed">{typeInfo.coreWiring}</p>
            </div>
            <div className="rounded-lg bg-red-950/20 border border-red-500/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-2">The Shadow</p>
              <p className="text-sm text-slate-300 leading-relaxed">{typeInfo.shadow}</p>
            </div>
            <div className="rounded-lg bg-amber-950/20 border border-amber-500/25 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2">Your Power</p>
              <p className="text-sm text-slate-300 leading-relaxed">{typeInfo.power}</p>
            </div>
          </div>
        )}

        {/* Type Breakdown */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase">
            Type Breakdown
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(mbti.breakdown).map(([key, value]) => {
              const desc = getLetterDescription(value);
              return (
                <div
                  key={key}
                  className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="text-2xl font-bold text-primary mb-1">
                    {value}
                  </div>
                  <div className="text-xs font-semibold">{desc.full}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {desc.trait}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Firmware/Overlay */}
        {mbti.firmware && (
          <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-1 rounded border border-yellow-300 dark:border-yellow-700 bg-yellow-100 dark:bg-yellow-900/30">
                Firmware Overlay
              </span>
              <span className="text-sm font-semibold">
                {typeof mbti.firmware === 'string' ? mbti.firmware : mbti.firmware.type}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Secondary personality pattern detected in chart
            </p>
          </div>
        )}

        {/* Astrological Reasoning */}
        {mbti.reasoning && (
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase">
              Astrological Indicators
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mbti.reasoning.extraversion.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-primary">
                    {mbti.breakdown.e_i === 'E' ? 'Extraversion' : 'Introversion'}
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {mbti.reasoning.extraversion.slice(0, 3).map((reason, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {mbti.reasoning.intuition.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-primary">
                    {mbti.breakdown.s_n === 'N' ? 'Intuition' : 'Sensing'}
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {mbti.reasoning.intuition.slice(0, 3).map((reason, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {mbti.reasoning.thinking.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-primary">
                    {mbti.breakdown.t_f === 'T' ? 'Thinking' : 'Feeling'}
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {mbti.reasoning.thinking.slice(0, 3).map((reason, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {mbti.reasoning.judging.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-primary">
                    {mbti.breakdown.j_p === 'J' ? 'Judging' : 'Perceiving'}
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {mbti.reasoning.judging.slice(0, 3).map((reason, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
