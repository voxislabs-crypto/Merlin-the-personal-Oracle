import type { ResonanceStats } from "@/lib/resonance-types"

interface ResonanceForecastCardProps {
  theme: string
  intensity: "high" | "medium" | "low"
  transit: string
  description: string
  personalityOverlay: string
  doList: string[]
  dontList: string[]
  resonanceStats: ResonanceStats
}

export function ResonanceForecastCard({
  theme,
  intensity,
  transit,
  description,
  personalityOverlay,
  doList,
  dontList,
  resonanceStats,
}: ResonanceForecastCardProps) {
  const intensityColors = {
    high: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20",
    medium: "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20",
    low: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20",
  }

  const intensityIcons = {
    high: "🔴",
    medium: "🟡",
    low: "🟢",
  }

  return (
    <div className={`p-6 rounded-lg border ${intensityColors[intensity]}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          {intensityIcons[intensity]} {theme} ({intensity.charAt(0).toUpperCase() + intensity.slice(1)} Intensity)
        </h3>
      </div>

      {/* Transit Description */}
      <div className="mb-4">
        <p className="font-medium text-foreground mb-1">{transit}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {/* Personality Overlay */}
      <div className="mb-4 p-3 bg-white/50 dark:bg-black/20 rounded border border-border/50">
        <p className="text-sm font-medium text-primary mb-1">INFJ Overlay:</p>
        <p className="text-sm text-muted-foreground italic">"{personalityOverlay}"</p>
      </div>

      {/* Do/Don't Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">Do ✅:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            {doList.map((item, index) => (
              <li key={index}>• {item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">Don't ❌:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            {dontList.map((item, index) => (
              <li key={index}>• {item}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Resonance Stats */}
      <div className="border-t border-border/50 pt-4">
        <p className="text-sm font-medium text-muted-foreground mb-3">Resonance Stats</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div>
            <div className="text-sm font-bold text-primary">{Math.round(resonanceStats.global.confidence * 100)}%</div>
            <div className="text-xs text-muted-foreground">Engine Confidence</div>
          </div>
          <div>
            <div className="text-sm font-bold text-violet-600">
              {Math.round(resonanceStats.global.confidence * 100)}%
            </div>
            <div className="text-xs text-muted-foreground">Global Resonance</div>
          </div>
          {resonanceStats.cluster && (
            <div>
              <div className="text-sm font-bold text-purple-600">
                {Math.round(resonanceStats.cluster.confidence * 100)}%
              </div>
              <div className="text-xs text-muted-foreground">INFJ Resonance</div>
            </div>
          )}
          {resonanceStats.personal && (
            <div>
              <div className="text-sm font-bold text-indigo-600">
                {Math.round(resonanceStats.personal.confidence * 100)}%
              </div>
              <div className="text-xs text-muted-foreground">Personal Accuracy</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
