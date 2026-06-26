// Soul Dashboard - Comprehensive view of all soul layer features
"use client";

import React, { useState, useEffect } from "react";
import { BirthChartData } from "@/types/astrology";
import { SoulReading } from "@/lib/soul/natal-voice";
import { ChartBadges, getBadgeDisplay } from "@/lib/soul/badges";
import { ProgressedChart } from "@/lib/astrology/progressions";
import { SynastryReport } from "@/lib/astrology/synastry";
import { SoulWhisper } from "@/lib/soul/whisper-library";
import { ReadAloudButton } from "@/components/ui/read-aloud-button";

interface SoulDashboardProps {
  chartData: BirthChartData;
  userAge?: number;
  userGender?: "male" | "female" | "non-binary" | "prefer-not-to-say";
  userMood?: "energized" | "exhausted" | "anxious" | "peaceful" | "restless" | "grieving" | "inspired" | "lost";
  mbtiType?: string;
}

export function SoulDashboard({
  chartData,
  userAge,
  userGender,
  userMood,
  mbtiType,
}: SoulDashboardProps) {
  const [soulReading, setSoulReading] = useState<SoulReading | null>(null);
  const [badges, setBadges] = useState<ChartBadges | null>(null);
  const [progressedChart, setProgressedChart] = useState<ProgressedChart | null>(null);
  const [whisper, setWhisper] = useState<SoulWhisper | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"soul" | "progressed" | "badges" | "whisper">("soul");
  const [yearsAhead, setYearsAhead] = useState(5);
  const [whisperMode, setWhisperMode] = useState<"plain" | "warm" | "bullshit" | "oracle">("warm");
  const [transitFocus, setTransitFocus] = useState("");

  useEffect(() => {
    loadSoulData();
  }, [chartData]);

  const loadSoulData = async () => {
    setLoading(true);
    try {
      // Load soul reading + badges
      const soulResponse = await fetch("/api/soul-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chartData }),
      });
      const soulData = await soulResponse.json();
      if (soulData.success) {
        setSoulReading(soulData.data.soulReading);
        setBadges(soulData.data.badges);
      }

      await loadWhisper();
    } catch (error) {
      console.error("Failed to load soul data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadWhisper = async () => {
    if (!userAge || !userMood) return;

    const whisperResponse = await fetch("/api/soul-whisper", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        age: userAge,
        gender: userGender,
        mood: userMood,
        theme: "Transformation",
        mbti: mbtiType,
        mode: whisperMode,
        currentTransit: transitFocus.trim() || undefined,
      }),
    });

    const whisperData = await whisperResponse.json();
    if (whisperData.success) {
      setWhisper(whisperData.data);
    }
  };

  const loadProgressedChart = async () => {
    try {
      const response = await fetch("/api/progressed-chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chartData, yearsInFuture: yearsAhead }),
      });
      const data = await response.json();
      if (data.success) {
        setProgressedChart(data.data);
      }
    } catch (error) {
      console.error("Failed to load progressed chart:", error);
    }
  };

  useEffect(() => {
    if (activeTab === "progressed" && !progressedChart) {
      loadProgressedChart();
    }
  }, [activeTab]);

  useEffect(() => {
    loadWhisper().catch((e) => console.error("Failed to refresh whisper:", e));
  }, [whisperMode, transitFocus, userAge, userMood, userGender, mbtiType]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading your soul reading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-yellow-300">Soul Reading</h1>
        <p className="text-slate-400">
          Beyond data. Beyond lists. This is your story.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        <button
          onClick={() => setActiveTab("soul")}
          className={`px-4 py-2 ${
            activeTab === "soul"
              ? "border-b-2 border-yellow-300 text-yellow-300"
              : "text-slate-400"
          }`}
        >
          Soul Voice
        </button>
        <button
          onClick={() => setActiveTab("progressed")}
          className={`px-4 py-2 ${
            activeTab === "progressed"
              ? "border-b-2 border-yellow-300 text-yellow-300"
              : "text-slate-400"
          }`}
        >
          Progressed
        </button>
        <button
          onClick={() => setActiveTab("badges")}
          className={`px-4 py-2 ${
            activeTab === "badges"
              ? "border-b-2 border-yellow-300 text-yellow-300"
              : "text-slate-400"
          }`}
        >
          Badges
        </button>
        {whisper && (
          <button
            onClick={() => setActiveTab("whisper")}
            className={`px-4 py-2 ${
              activeTab === "whisper"
                ? "border-b-2 border-yellow-300 text-yellow-300"
                : "text-slate-400"
            }`}
          >
            Today's Whisper
          </button>
        )}
      </div>

      {/* Content */}
      {activeTab === "soul" && soulReading && (
        <div className="space-y-6">
          {/* Core Identity */}
          <section className="bg-slate-800 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-2xl font-bold text-yellow-300">
                Core Identity
              </h2>
              <ReadAloudButton text={soulReading.coreIdentity} voice="sage" />
            </div>
            <p className="text-slate-200 leading-relaxed">
              {soulReading.coreIdentity}
            </p>
          </section>

          {/* Emotional Landscape */}
          <section className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-yellow-300 mb-3">
              Emotional Landscape
            </h2>
            <p className="text-slate-200 leading-relaxed">
              {soulReading.emotionalLandscape}
            </p>
          </section>

          {/* Intellectual Style */}
          <section className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-yellow-300 mb-3">
              Intellectual Style
            </h2>
            <p className="text-slate-200 leading-relaxed">
              {soulReading.intellectualStyle}
            </p>
          </section>

          {/* Love Language */}
          <section className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-yellow-300 mb-3">
              Love Language
            </h2>
            <p className="text-slate-200 leading-relaxed">
              {soulReading.loveLanguage}
            </p>
          </section>

          {/* Will and Action */}
          <section className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-yellow-300 mb-3">
              Will & Action
            </h2>
            <p className="text-slate-200 leading-relaxed">
              {soulReading.willAndAction}
            </p>
          </section>

          {/* Soul Purpose */}
          <section className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-yellow-300 mb-3">
              Soul Purpose
            </h2>
            <p className="text-slate-200 leading-relaxed">
              {soulReading.soulPurpose}
            </p>
          </section>

          {/* Shadow Work */}
          <section className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-yellow-300 mb-3">
              Shadow Work
            </h2>
            <p className="text-slate-200 leading-relaxed">
              {soulReading.shadowWork}
            </p>
          </section>

          {/* Trial by Fire (if present) */}
          {soulReading.trialByFire && (
            <section className="bg-gradient-to-r from-orange-900 to-red-900 p-6 rounded-lg border-2 border-yellow-300">
              <h2 className="text-2xl font-bold text-yellow-300 mb-3 flex items-center gap-2">
                🔥 Trial by Fire
              </h2>
              <p className="text-slate-100 leading-relaxed font-semibold">
                {soulReading.trialByFire}
              </p>
            </section>
          )}
        </div>
      )}

      {activeTab === "progressed" && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="bg-slate-800 p-4 rounded-lg flex items-center gap-4">
            <label className="text-slate-300">Years in future:</label>
            <input
              type="number"
              min="1"
              max="50"
              value={yearsAhead}
              onChange={(e) => setYearsAhead(Number(e.target.value))}
              className="bg-slate-700 text-slate-200 px-3 py-1 rounded"
            />
            <button
              onClick={loadProgressedChart}
              className="bg-yellow-300 text-slate-900 px-4 py-1 rounded font-semibold hover:bg-yellow-400"
            >
              Calculate
            </button>
          </div>

          {progressedChart && (
            <>
              {/* Narrative */}
              <section className="bg-slate-800 p-6 rounded-lg">
                <h2 className="text-2xl font-bold text-yellow-300 mb-3">
                  {progressedChart.yearsProgressed} Years from Now
                </h2>
                <p className="text-slate-200 leading-relaxed">
                  {progressedChart.narrative}
                </p>
              </section>

              {/* Significant Changes */}
              {progressedChart.significantChanges.length > 0 && (
                <section className="bg-slate-800 p-6 rounded-lg">
                  <h3 className="text-xl font-bold text-yellow-300 mb-3">
                    Key Changes
                  </h3>
                  <ul className="space-y-2">
                    {progressedChart.significantChanges.map((change, idx) => (
                      <li key={idx} className="text-slate-200">
                        <strong>{change.planet}:</strong> {change.description}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === "badges" && badges && (
        <div className="space-y-6">
          {badges.totalCount === 0 ? (
            <div className="bg-slate-800 p-6 rounded-lg text-center">
              <p className="text-slate-400">
                No badges yet. Keep exploring your chart.
              </p>
            </div>
          ) : (
            <>
              {/* Legendary Badges */}
              {badges.legendary.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold text-yellow-300 mb-4">
                    Legendary Badges
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {badges.legendary.map((badge) => {
                      const display = getBadgeDisplay(badge);
                      return (
                        <div
                          key={badge.name}
                          className="bg-gradient-to-br from-yellow-900 to-orange-900 p-6 rounded-lg border-2"
                          style={{ borderColor: display.color }}
                        >
                          <div className="text-5xl mb-2">{display.icon}</div>
                          <h3 className="text-xl font-bold text-yellow-300 mb-2">
                            {display.name}
                          </h3>
                          <p className="text-slate-200">{display.description}</p>
                          <p className="text-xs text-slate-400 mt-2">
                            {badge.earnedBy}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* All Badges */}
              <section>
                <h2 className="text-2xl font-bold text-yellow-300 mb-4">
                  All Badges ({badges.totalCount})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {badges.badges.map((badge) => {
                    const display = getBadgeDisplay(badge);
                    return (
                      <div
                        key={badge.name}
                        className="bg-slate-800 p-4 rounded-lg border"
                        style={{ borderColor: display.color }}
                      >
                        <div className="text-3xl mb-1">{display.icon}</div>
                        <h3 className="text-lg font-bold text-slate-200">
                          {display.name}
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">
                          {badge.rarity}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </div>
      )}

      {activeTab === "whisper" && whisper && (
        <div className="space-y-6">
          <div className="flex items-center justify-end">
            <label className="text-sm text-slate-400 mr-2">Whisper Mode</label>
            <select
              value={whisperMode}
              onChange={(e) => setWhisperMode(e.target.value as "plain" | "warm" | "bullshit" | "oracle")}
              className="bg-slate-800 border border-slate-600 text-slate-200 rounded px-3 py-1.5 text-sm"
            >
              <option value="plain">Plain</option>
              <option value="warm">Warm</option>
              <option value="bullshit">Bullshit</option>
              <option value="oracle">Oracle</option>
            </select>
          </div>

          {whisperMode === "oracle" && (
            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
              <label className="block text-sm text-slate-300 mb-2">Transit Focus (optional)</label>
              <input
                type="text"
                value={transitFocus}
                onChange={(e) => setTransitFocus(e.target.value)}
                placeholder="Example: Mars square Moon"
                className="w-full bg-slate-900 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm"
              />
              <p className="text-xs text-slate-400 mt-2">
                Oracle mode will match this transit to a specific template when possible.
              </p>
            </div>
          )}

          <section className="bg-gradient-to-br from-indigo-900 to-purple-900 p-8 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">✨</span>
                <h2 className="text-2xl font-bold text-yellow-300">
                  {whisper.source} Speaks
                </h2>
              </div>
              <ReadAloudButton text={whisper.message} voice="mystic" />
            </div>
            <p className="text-xl text-slate-100 leading-relaxed">
              {whisper.message}
            </p>
            <div className="text-sm text-slate-400 mt-4">
                Mode: {whisper.mode} | Tone: {whisper.tone} | Source: {whisper.source}
                {whisper.currentTransit ? ` | Transit: ${whisper.currentTransit}` : ""}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
