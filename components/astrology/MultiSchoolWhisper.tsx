// Multi-School Whisper Component - Display consensus across three astrology systems
"use client";

import React, { useState, useEffect } from "react";
import { BirthChartData } from "@/types/astrology";
import { MultiSchoolWhisper } from "@/lib/schools/multi-whisper";

interface MultiSchoolWhisperDisplayProps {
  chartData: BirthChartData;
  date?: Date;
}

export function MultiSchoolWhisperDisplay({
  chartData,
  date = new Date(),
}: MultiSchoolWhisperDisplayProps) {
  const [whisper, setWhisper] = useState<MultiSchoolWhisper | null>(null);
  const [detailedReading, setDetailedReading] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWhisper();
  }, [chartData, date]);

  const loadWhisper = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/multi-school-whisper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chartData,
          date: date.toISOString(),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setWhisper(data.data);
        setDetailedReading(data.data.detailedReading);
      }
    } catch (error) {
      console.error("Failed to load multi-school whisper:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-slate-400">Consulting three schools...</div>
      </div>
    );
  }

  if (!whisper) {
    return (
      <div className="text-center text-slate-400 p-8">
        No reading available
      </div>
    );
  }

  const agreementColor =
    whisper.agreement === "full"
      ? "text-green-400"
      : whisper.agreement === "partial"
      ? "text-yellow-400"
      : "text-slate-400";

  return (
    <div className="space-y-6">
      {/* Main Whisper */}
      <div className="bg-gradient-to-br from-indigo-900 to-purple-900 p-8 rounded-lg border border-yellow-300">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">✨</span>
          <h2 className="text-2xl font-bold text-yellow-300">
            The Schools Speak
          </h2>
        </div>
        <p className="text-xl text-slate-100 leading-relaxed mb-4">
          {whisper.whisper}
        </p>
        <div className="text-sm">
          <span className="text-slate-400">Agreement: </span>
          <span className={`font-semibold ${agreementColor}`}>
            {whisper.agreement}
          </span>
        </div>
      </div>

      {/* Individual Schools */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Western */}
        <div className="bg-slate-800 p-6 rounded-lg border border-blue-500">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🌍</span>
            <h3 className="text-lg font-bold text-blue-300">Western</h3>
          </div>
          <p className="text-slate-200 text-sm leading-relaxed">
            {whisper.western.insight}
          </p>
          <div className="mt-3 flex flex-wrap gap-1">
            {whisper.western.themes.map((theme) => (
              <span
                key={theme}
                className="text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>

        {/* Vedic */}
        <div className="bg-slate-800 p-6 rounded-lg border border-orange-500">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🔯</span>
            <h3 className="text-lg font-bold text-orange-300">Vedic</h3>
          </div>
          <p className="text-slate-200 text-sm leading-relaxed">
            {whisper.vedic.insight}
          </p>
          <div className="mt-3 flex flex-wrap gap-1">
            {whisper.vedic.themes.map((theme) => (
              <span
                key={theme}
                className="text-xs bg-orange-900 text-orange-200 px-2 py-1 rounded"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>

        {/* Chinese */}
        <div className="bg-slate-800 p-6 rounded-lg border border-red-500">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🐉</span>
            <h3 className="text-lg font-bold text-red-300">Chinese</h3>
          </div>
          <p className="text-slate-200 text-sm leading-relaxed">
            {whisper.chinese.insight}
          </p>
          <div className="mt-3 flex flex-wrap gap-1">
            {whisper.chinese.themes.map((theme) => (
              <span
                key={theme}
                className="text-xs bg-red-900 text-red-200 px-2 py-1 rounded"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Consensus Themes */}
      {whisper.consensus.length > 0 && (
        <div className="bg-slate-800 p-6 rounded-lg">
          <h3 className="text-lg font-bold text-yellow-300 mb-3">
            Consensus Themes
          </h3>
          <div className="flex flex-wrap gap-2">
            {whisper.consensus.map((theme) => (
              <span
                key={theme}
                className="bg-yellow-900 text-yellow-200 px-3 py-2 rounded-lg font-semibold"
              >
                {theme}
              </span>
            ))}
          </div>
          <p className="text-slate-400 text-sm mt-3">
            These themes appear in at least two schools — they're your north
            stars for {date.toLocaleDateString()}.
          </p>
        </div>
      )}

      {/* Detailed Reading */}
      <div className="bg-slate-800 p-6 rounded-lg">
        <h3 className="text-lg font-bold text-yellow-300 mb-3">
          Full Reading
        </h3>
        <pre className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-mono">
          {detailedReading}
        </pre>
      </div>
    </div>
  );
}
