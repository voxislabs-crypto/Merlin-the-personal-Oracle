"use client"

import { useState, useEffect } from "react"
import { resonanceDB, initializeMockData } from "@/lib/resonance-database"
import type { ResonanceStats } from "@/lib/resonance-types"

export function AdvancedForecastDisplay({
  date,
  birthData,
  personality,
}: {
  date: Date
  birthData: any
  personality: string
}) {
  const [forecast, setForecast] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [resonanceStats, setResonanceStats] = useState<ResonanceStats | null>(null)

  useEffect(() => {
    generateAdvancedForecast()
  }, [date, birthData, personality])

  const generateAdvancedForecast = async () => {
    setLoading(true)

    await initializeMockData()

    // Mock transit context (would be real data in production)
    const transitContext = {
      planet1: "Moon",
      planet2: "Saturn",
      aspect: "opposition",
      orb: 0.5,
      house: 7,
      natalChart: birthData,
      personality,
      currentCycles: ["saturn_return"],
    }

    // Mock interpretation layers
    const interpretation = {
      layers: [
        {
          layer: "Psychological",
          result: {
            intensity: 0.85,
            theme: "Emotional Boundaries",
            guidance: "Your emotional needs are in tension with external responsibilities",
          },
        },
        {
          layer: "Spiritual",
          result: {
            intensity: 0.72,
            theme: "Karmic Lessons",
            guidance: "This is a time for learning self-worth through relationship challenges",
          },
        },
        {
          layer: "Practical",
          result: {
            intensity: 0.68,
            theme: "Daily Structure",
            guidance: "Focus on creating sustainable routines that honor your emotional needs",
          },
        },
      ],
      synthesis: {
        confidence: 0.82,
      },
    }

    const crossValidation = {
      interpretations: [
        { system: "Vedic", guidance: "Moon-Saturn dasha indicates karmic clearing in relationships" },
        { system: "Hellenistic", guidance: "Saturn as sect malefic emphasizes the tension" },
        { system: "Evolutionary", guidance: "Soul is learning boundaries through relationship pressure" },
      ],
      synthesis: "All systems agree this is a significant learning period focused on emotional maturity",
      recommendation: "Honor both your need for structure and your emotional sensitivity",
    }

    const narrative =
      "Today brings a powerful learning opportunity as your emotional world meets Saturn's steady hand. You may feel pulled between what you need emotionally and what others expect of you. This is not a punishment but an invitation to develop stronger boundaries while maintaining compassion. Trust that this tension is building your inner strength."

    const stats = await resonanceDB.getResonanceStats("user_1", "moon_opposition_saturn", "Relationships")
    setResonanceStats(stats)

    setForecast({
      interpretation,
      crossValidation,
      narrative,
      confidence: interpretation.synthesis.confidence,
    })

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">Calculating cosmic influences...</span>
      </div>
    )
  }

  if (!forecast) return null

  return (
    <div className="space-y-6">
      {/* Confidence Score */}
      <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-4 rounded-lg border border-primary/20">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-primary">Forecast Confidence</h3>
          <div className="flex items-center space-x-2">
            <div className="w-24 bg-muted rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-500"
                style={{ width: `${forecast.confidence * 100}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-primary">{Math.round(forecast.confidence * 100)}%</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{forecast.crossValidation.recommendation}</p>
      </div>

      {resonanceStats && (
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 p-4 rounded-lg border border-violet-200 dark:border-violet-800">
          <h3 className="font-semibold text-violet-900 dark:text-violet-100 mb-3">Resonance Intelligence</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Global Resonance */}
            <div className="text-center">
              <div className="text-2xl font-bold text-violet-700 dark:text-violet-300">
                {Math.round(resonanceStats.global.confidence * 100)}%
              </div>
              <div className="text-sm text-violet-600 dark:text-violet-400">Global Resonance</div>
              <div className="text-xs text-muted-foreground">{resonanceStats.global.feedbackCount} users</div>
            </div>

            {/* Cluster Resonance */}
            {resonanceStats.cluster && (
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {Math.round(resonanceStats.cluster.confidence * 100)}%
                </div>
                <div className="text-sm text-purple-600 dark:text-purple-400">INFJ Resonance</div>
                <div className="text-xs text-muted-foreground">
                  {resonanceStats.cluster.feedbackCount} similar users
                </div>
              </div>
            )}

            {/* Personal Accuracy */}
            {resonanceStats.personal && (
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                  {Math.round(resonanceStats.personal.confidence * 100)}%
                </div>
                <div className="text-sm text-indigo-600 dark:text-indigo-400">Personal Accuracy</div>
                <div className="text-xs text-muted-foreground">
                  {resonanceStats.personal.feedbackCount} past experiences
                </div>
              </div>
            )}
          </div>

          {/* Resonance Explanation */}
          <div className="mt-4 p-3 bg-white/50 dark:bg-black/20 rounded border border-violet-200/50 dark:border-violet-800/50">
            <p className="text-sm text-violet-800 dark:text-violet-200">
              <span className="font-medium">High resonance detected:</span> This transit pattern typically resonates
              strongly with your personality type and has shown{" "}
              {resonanceStats.global.confidence > 0.7 ? "high" : "moderate"} accuracy globally.
            </p>
          </div>
        </div>
      )}

      {/* AI Narrative */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h3 className="font-semibold text-lg mb-3 text-foreground">Today's Cosmic Story</h3>
        <p className="text-muted-foreground leading-relaxed">{forecast.narrative}</p>
      </div>

      {/* Multi-Layer Analysis */}
      <div className="grid gap-4">
        <h3 className="font-semibold text-lg text-foreground">Interpretive Layers</h3>
        {forecast.interpretation.layers.map((layer: any, index: number) => (
          <div key={index} className="bg-card p-4 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-foreground">{layer.layer}</h4>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-muted rounded-full h-1.5">
                  <div
                    className="bg-primary h-1.5 rounded-full"
                    style={{ width: `${layer.result.intensity * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs text-muted-foreground">{Math.round(layer.result.intensity * 100)}%</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">{layer.result.theme}</p>
            <p className="text-sm text-foreground">{layer.result.guidance}</p>
          </div>
        ))}
      </div>

      {/* Cross-System Validation */}
      <div className="bg-gradient-to-r from-secondary/5 to-primary/5 p-4 rounded-lg border border-secondary/20">
        <h3 className="font-semibold text-lg mb-3 text-secondary">Cross-System Analysis</h3>
        <div className="space-y-3">
          {forecast.crossValidation.interpretations.map((interp: any, index: number) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="font-medium text-sm text-secondary">{interp.system}</p>
                <p className="text-sm text-muted-foreground">{interp.guidance}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-card/50 rounded border border-border/50">
          <p className="text-sm text-secondary font-medium">Synthesis:</p>
          <p className="text-sm text-muted-foreground">{forecast.crossValidation.synthesis}</p>
        </div>
      </div>
    </div>
  )
}
