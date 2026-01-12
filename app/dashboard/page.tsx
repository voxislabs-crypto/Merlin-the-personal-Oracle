'use client';

import { WheelVisualization } from '@/components/astrology/WheelVisualization';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMBTI, PERSONALITY_LINES } from '@/lib/personality/fusion';

export default function Dashboard() {
  const router = useRouter();
  const [chart, setChart] = useState<any>(null);
  const [whisper, setWhisper] = useState('Loading...');
  const [type, setType] = useState('Loading...');

  useEffect(() => {
    // Check if user has paid
    const hasPaid = localStorage.getItem('merlin_paid') === 'true';
    if (!hasPaid) {
      router.push('/checkout');
      return;
    }

    // Load chart data - for now using sample data
    setTimeout(() => {
      const sampleChart = {
        planets: [
          { name: 'Sun', angle: 45, sign: 'Taurus', glyph: '☉' },
          { name: 'Moon', angle: 120, sign: 'Leo', glyph: '☽' },
          { name: 'Mercury', angle: 30, sign: 'Aries', glyph: '☿' },
          { name: 'Venus', angle: 60, sign: 'Gemini', glyph: '♀' },
          { name: 'Mars', angle: 180, sign: 'Libra', glyph: '♂' },
          { name: 'Jupiter', angle: 240, sign: 'Sagittarius', glyph: '♃' },
          { name: 'Saturn', angle: 300, sign: 'Capricorn', glyph: '♄' }
        ],
        houses: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
        aspects: [
          { from: 'Sun', to: 'Moon', type: 'trine', angle: 120 },
          { from: 'Mercury', to: 'Venus', type: 'conjunction', angle: 0 }
        ],
        ascendant: { sign: 'Leo' },
        sun: { sign: 'Taurus' },
        mercury: { aspects: [{ to: 'Uranus' }] },
        moon: { aspects: [{ to: 'Venus' }] }
      };

      setChart(sampleChart);

      // Calculate MBTI and personality lines
      const mbti = getMBTI(sampleChart);
      const lines = PERSONALITY_LINES[mbti] || ["You are the exception."];

      setWhisper('The past is behind you. The knife was never in your hand.');
      setType(`${mbti} – ${lines[0]}`);
    }, 1000);
  }, [router]);

  if (!chart) return <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">Loading chart...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Whisper */}
        <section className="bg-black/50 rounded-lg p-8 border border-amber-800">
          <h2 className="text-2xl font-bold text-amber-400 mb-4">Today's Whisper</h2>
          <p className="text-gray-300">{whisper}</p>
        </section>

        {/* Wheel */}
        <section className="bg-black/50 rounded-lg p-8 border border-amber-800 flex justify-center">
          <WheelVisualization chartData={chart} />
        </section>

        {/* Type */}
        <section className="bg-black/50 rounded-lg p-8 border border-amber-800">
          <h2 className="text-2xl font-bold text-amber-400 mb-4">Your Type</h2>
          <p className="text-gray-300">{type}</p>
        </section>
      </div>
    </div>
  );
}