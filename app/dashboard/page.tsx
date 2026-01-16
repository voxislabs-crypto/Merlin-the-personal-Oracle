'use client';

import { WheelVisualization } from '@/components/astrology/WheelVisualization';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getMBTI, PERSONALITY_LINES } from '@/lib/personality/fusion';
import { adaptMessage } from '@/lib/personality/adapter';
import { type MBTIType } from '@/shared/schema';
import { motion } from 'framer-motion';
import { calculateBirthChart } from '@/lib/engine-fallback';
import { getTodaysForecast } from '@/lib/astrology/ephemeris';

function getPlanetGlyph(name: string): string {
  const glyphs: { [key: string]: string } = {
    Sun: '☉',
    Moon: '☽',
    Mercury: '☿',
    Venus: '♀',
    Mars: '♂',
    Jupiter: '♃',
    Saturn: '♄',
    Uranus: '⛢',
    Neptune: '♆',
    Pluto: '♇'
  };
  return glyphs[name] || name;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const birthDate = searchParams.get('date');
  const birthTime = searchParams.get('time');
  const birthCity = searchParams.get('city');

  const [chart, setChart] = useState<any>(null);
  const [whisper, setWhisper] = useState('Loading...');
  const [type, setType] = useState('Loading...');
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!birthDate || !birthTime) {
      setError('Missing birth date or time in URL');
      return;
    }

    try {
      console.log('Calculating chart for:', { birthDate, birthTime, birthCity });
      
      // Calculate real birth chart
      const birthChart = calculateBirthChart(birthDate, birthTime, 0, 0); // TODO: Add geocoding for lat/lon

      console.log('Chart calculated successfully:', birthChart);

      // Generate today's forecast
      const forecast = getTodaysForecast(birthChart);

      // Transform birth chart data for wheel visualization
      const wheelData = {
        planets: birthChart.positions.map(p => ({
          name: p.name,
          angle: p.longitude,
          sign: p.sign,
          glyph: getPlanetGlyph(p.name)
        })),
        houses: birthChart.houses.map(h => h.longitude || 0),
        aspects: birthChart.aspects.slice(0, 10).map(a => ({ // Limit aspects for performance
          from: a.planet1.name,
          to: a.planet2.name,
          type: a.type,
          angle: Math.abs(a.planet1.longitude - a.planet2.longitude)
        })),
        ascendant: { sign: birthChart.ascendant.sign },
        sun: { sign: birthChart.positions.find(p => p.name === 'Sun')?.sign || '' },
        mercury: { aspects: [] },
        moon: { aspects: [] }
      };

      setChart(wheelData);

      // Calculate MBTI and personality lines
      const mbti = getMBTI(wheelData) as MBTIType;
      const lines = PERSONALITY_LINES[mbti] || ["You are the exception."];
      setType(`${mbti} – ${lines[0]}`);

      // Set forecast as whisper with personalization
      const rawWhisper = `${forecast.summary}\n\n${forecast.advice}`;
      const personalizedWhisper = adaptMessage(mbti, rawWhisper);
      setWhisper(personalizedWhisper);
    } catch (error) {
      console.error('Error calculating chart:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to calculate chart: ${errorMessage}`);
      setWhisper('The stars are veiled today. Try again later.');
      setType('Unknown – The mystery endures.');
    }
  }, [birthDate, birthTime]);

  if (!chart) return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
        <div className="absolute top-20 right-20 w-1 h-1 bg-amber-300 rounded-full animate-ping"></div>
        <div className="absolute bottom-20 left-20 w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-2 h-2 bg-amber-200 rounded-full animate-ping"></div>
      </div>
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        className="text-center relative z-10"
      >
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-400 mx-auto mb-4"></div>
        <p className="text-xl text-amber-400">Loading your fate...</p>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4 md:p-8 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
        <div className="absolute top-20 right-20 w-1 h-1 bg-amber-300 rounded-full animate-ping"></div>
        <div className="absolute bottom-20 left-20 w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-2 h-2 bg-amber-200 rounded-full animate-ping"></div>
        <div className="absolute top-1/2 left-1/4 w-1 h-1 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-amber-400 rounded-full animate-ping"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-amber-400 mb-4">Your Eternal Chart</h1>
          <p className="text-gray-300">Born {birthDate} at {birthTime} in {birthCity}</p>
          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 mt-4 text-sm bg-red-900/20 border border-red-500 rounded px-4 py-2 inline-block"
            >
              {error}
            </motion.p>
          )}
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Whisper */}
          <motion.section 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-black/50 rounded-lg p-8 border border-amber-800 backdrop-blur-sm"
          >
            <h2 className="text-2xl font-bold text-amber-400 mb-4">Today's Oracle</h2>
            <div className="text-gray-300 italic whitespace-pre-line">{whisper}</div>
          </motion.section>

          {/* Wheel */}
          <motion.section 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-black/50 rounded-lg p-8 border border-amber-800 flex justify-center backdrop-blur-sm"
          >
            <WheelVisualization 
              chartData={chart} 
              hoveredPlanet={hoveredPlanet}
              setHoveredPlanet={setHoveredPlanet}
            />
          </motion.section>

          {/* Type */}
          <motion.section 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="bg-black/50 rounded-lg p-8 border border-amber-800 backdrop-blur-sm"
          >
            <h2 className="text-2xl font-bold text-amber-400 mb-4">Your Type</h2>
            <p className="text-gray-300">{type}</p>
          </motion.section>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-400 mx-auto mb-4"></div>
        <p className="text-xl text-amber-400">Loading...</p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}