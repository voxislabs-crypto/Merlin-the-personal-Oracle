"use client"

import { useState, useEffect } from "react"

interface PredictiveEvent {
  eventId: string
  timing: {
    phase: "building" | "peaking" | "releasing"
    peakAt: string
    hoursToPeak?: number
  }
  scores: {
    intensity: number
    confidence: number
    learnedAdjustment: number
  }
  narrative: {
    whisper: string
    vibe: string
    risk: string
    opportunity: string
  }
  mbtiLens: {
    bestMove24h: string
    blindSpot: string
    avoidNow: string
  }
  transit: {
    transitingPlanet: string
    aspect: string
    natalPlanet: string
  }
  explanation: {
    contextSignals: string[]
    contextMultiplier: number
  }
}

interface AdvancedForecastPayload {
  events: PredictiveEvent[]
  generatedAt: string
}

interface NormalizedBirthInput {
  birthDate: string
  birthTime: string
  lat: number
  lon: number
}

function normalizeBirthInput(input: any): NormalizedBirthInput | null {
  if (!input) return null

  const date = input.date || input.birthDate
  const time = input.time || input.birthTime
  const lat = input.latitude ?? input.lat ?? input.location?.latitude
  const lon = input.longitude ?? input.lon ?? input.location?.longitude

  if (typeof date === "string" && typeof time === "string" && Number.isFinite(lat) && Number.isFinite(lon)) {
    return { birthDate: date, birthTime: time, lat: Number(lat), lon: Number(lon) }
  }

  if (input.date instanceof Date && Number.isFinite(lat) && Number.isFinite(lon)) {
    const dateObj: Date = input.date
    const yyyy = dateObj.getUTCFullYear()
    const mm = String(dateObj.getUTCMonth() + 1).padStart(2, "0")
    const dd = String(dateObj.getUTCDate()).padStart(2, "0")
    const hh = String(dateObj.getUTCHours()).padStart(2, "0")
    const min = String(dateObj.getUTCMinutes()).padStart(2, "0")
    return {
      birthDate: `${yyyy}-${mm}-${dd}`,
      birthTime: `${hh}:${min}`,
      lat: Number(lat),
      lon: Number(lon),
    }
  }

  return null
}

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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    generateAdvancedForecast()
  }, [date, birthData, personality])

  const generateAdvancedForecast = async () => {
    setLoading(true)
    setError(null)

    try {
      const normalizedBirth = normalizeBirthInput(birthData)
      if (!normalizedBirth) {
        throw new Error("Birth data is incomplete for advanced forecasting")
      }

      const timezoneOffset = -new Date().getTimezoneOffset() / 60
      const response = await fetch("/api/transits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...normalizedBirth,
          timezoneOffset,
          mbtiType: personality,
        }),
      })

      const result = await response.json()
      if (!response.ok || !result?.success || !result?.data?.predictive) {
        throw new Error(result?.error || "Failed to load advanced forecast")
      }

      const predictive: AdvancedForecastPayload = result.data.predictive
      const topEvents = predictive.events.slice(0, 3)
      const avgConfidence =
        topEvents.length > 0
          ? topEvents.reduce((sum, event) => sum + (event.scores.confidence || 0), 0) / topEvents.length
          : 0.5

      const interpretation = {
        layers: topEvents.map((event) => ({
          layer: `${event.transit.transitingPlanet} ${event.transit.aspect} ${event.transit.natalPlanet}`,
          result: {
            intensity: Math.max(0.01, event.scores.intensity / 100),
            theme: event.narrative.whisper,
            guidance: event.mbtiLens.bestMove24h,
          },
        })),
        synthesis: {
          confidence: Number(avgConfidence.toFixed(2)),
        },
      }

      const contextSignals = Array.from(
        new Set(topEvents.flatMap((event) => event.explanation.contextSignals || []))
      )

      const crossValidation = {
        interpretations: [
          {
            system: "Transit Lens",
            guidance: topEvents[0]?.narrative.vibe || "No dominant transit signal yet",
          },
          {
            system: "Timing Lens",
            guidance: topEvents[0]
              ? `Peak in ${typeof topEvents[0].timing.hoursToPeak === "number" ? `${topEvents[0].timing.hoursToPeak}h` : `${topEvents[0].timing.phase}`}`
              : "Timing data unavailable",
          },
          {
            system: "Context Lens",
            guidance: contextSignals.length > 0 ? `Context signals: ${contextSignals.join(", ")}` : "No user-context signals active",
          },
        ],
        synthesis: topEvents[0]?.narrative.risk || "Forecast confidence builds as more transits cluster.",
        recommendation: topEvents[0]?.mbtiLens.bestMove24h || "Take one practical step and reassess tomorrow.",
      }

      const narrative =
        topEvents[0]
          ? `${topEvents[0].narrative.vibe} ${topEvents[0].narrative.opportunity}`
          : "No strong predictive events in the current window."

      setForecast({
        interpretation,
        crossValidation,
        narrative,
        confidence: interpretation.synthesis.confidence,
        generatedAt: predictive.generatedAt,
        topEvents,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown forecast error"
      setError(message)
      setForecast(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">Calculating cosmic influences...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg border border-red-500/30 bg-red-900/20 text-red-200 text-sm">
        Could not load advanced forecast: {error}
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

      {forecast.topEvents?.length > 0 && (
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 p-4 rounded-lg border border-violet-200 dark:border-violet-800">
          <h3 className="font-semibold text-violet-900 dark:text-violet-100 mb-3">Predictive Intelligence</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-violet-700 dark:text-violet-300">
                {Math.round((forecast.topEvents[0]?.scores.intensity || 0))}
              </div>
              <div className="text-sm text-violet-600 dark:text-violet-400">Top Intensity</div>
              <div className="text-xs text-muted-foreground">out of 100</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {forecast.topEvents[0]?.timing?.hoursToPeak ?? "—"}
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400">Hours to Peak</div>
              <div className="text-xs text-muted-foreground">
                {forecast.topEvents[0] ? `phase: ${forecast.topEvents[0].timing.phase}` : "n/a"}
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                {forecast.topEvents[0]?.scores.learnedAdjustment > 0 ? "+" : ""}
                {forecast.topEvents[0]?.scores.learnedAdjustment?.toFixed(2) ?? "0.00"}
              </div>
              <div className="text-sm text-indigo-600 dark:text-indigo-400">Learned Shift</div>
              <div className="text-xs text-muted-foreground">personalization delta</div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-white/50 dark:bg-black/20 rounded border border-violet-200/50 dark:border-violet-800/50">
            <p className="text-sm text-violet-800 dark:text-violet-200">
              <span className="font-medium">Context-aware forecast:</span>{" "}
              {forecast.topEvents[0]?.explanation?.contextSignals?.length
                ? `Signals active: ${forecast.topEvents[0].explanation.contextSignals.join(", ")}.`
                : "No context signals currently active."}
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
