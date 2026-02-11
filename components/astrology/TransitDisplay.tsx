import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircleIcon, XCircleIcon, AlertTriangleIcon } from "lucide-react"
import type { DailyForecast } from "@/lib/transit-calculator"

interface TransitDisplayProps {
  forecast: DailyForecast
}

export function TransitDisplay({ forecast }: TransitDisplayProps) {
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "green":
        return "bg-green-100 text-green-700 border-green-200"
      case "yellow":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "red":
        return "bg-red-100 text-red-700 border-red-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const getEffectColor = (effect: string) => {
    const colors: Record<string, string> = {
      heavy: "bg-red-100 text-red-700",
      intense: "bg-orange-100 text-orange-700",
      tense: "bg-yellow-100 text-yellow-700",
      foggy: "bg-gray-100 text-gray-700",
      positive: "bg-green-100 text-green-700",
      productive: "bg-blue-100 text-blue-700",
      energized: "bg-yellow-100 text-yellow-700",
    }
    return colors[effect] || "bg-gray-100 text-gray-700"
  }

  return (
    <div className="space-y-6">
      {/* Daily Summary */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">
              {new Date(forecast.date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </CardTitle>
            <Badge className={`${getRatingColor(forecast.day_rating)} border`}>
              {forecast.day_rating === "green" && "Favorable"}
              {forecast.day_rating === "yellow" && "Mixed"}
              {forecast.day_rating === "red" && "Challenging"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-balance">{forecast.summary}</p>
        </CardContent>
      </Card>

      {/* Transit Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Active Transits</h3>
        {forecast.transits.map((transit, index) => (
          <Card key={index} className="border border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">{transit.transit_aspect}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getEffectColor(transit.effect)}>
                    {transit.effect}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{transit.orb}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-pretty">{transit.interpretation}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Do</span>
                  </div>
                  <ul className="space-y-1">
                    {transit.do.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground pl-6">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <XCircleIcon className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-700">Don't</span>
                  </div>
                  <ul className="space-y-1">
                    {transit.dont.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground pl-6">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* MBTI Overlay */}
      {forecast.mbti_overlay && (
        <Card className="border border-primary/30 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangleIcon className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">Personality Insight</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {Object.entries(forecast.mbti_overlay).map(([type, data]) => (
              <div key={type}>
                <Badge variant="outline" className="mb-2">
                  {type}
                </Badge>
                <p className="text-sm text-muted-foreground text-pretty">{data.translation}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
