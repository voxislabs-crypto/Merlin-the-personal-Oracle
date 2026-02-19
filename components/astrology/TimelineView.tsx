"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ClockIcon,
  TrendingUpIcon,
  ZapIcon,
  HeartIcon,
  BrainIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { generateTimeline, getTimelineAdvice, type YearlyTheme, type TimelineEvent } from "@/lib/timeline-calculator"
import type { MBTIType } from "@/lib/mbti-system"

interface TimelineViewProps {
  birthYear: number
  mbtiType?: MBTIType
}

export function TimelineView({ birthYear, mbtiType }: TimelineViewProps) {
  const timeline = generateTimeline(birthYear)
  const [selectedYear, setSelectedYear] = useState<YearlyTheme | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const getEventIcon = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "saturn":
        return <BrainIcon className="w-5 h-5" />
      case "jupiter":
        return <TrendingUpIcon className="w-5 h-5" />
      case "uranus":
        return <ZapIcon className="w-5 h-5" />
      case "neptune":
      case "chiron":
        return <HeartIcon className="w-5 h-5" />
      default:
        return <ClockIcon className="w-5 h-5" />
    }
  }

  const getEventColor = (type: TimelineEvent["type"], intensity: TimelineEvent["intensity"]) => {
    const baseColors = {
      saturn: "border-red-300 bg-red-50 text-red-700",
      jupiter: "border-green-300 bg-green-50 text-green-700",
      uranus: "border-purple-300 bg-purple-50 text-purple-700",
      neptune: "border-blue-300 bg-blue-50 text-blue-700",
      pluto: "border-indigo-300 bg-indigo-50 text-indigo-700",
      chiron: "border-orange-300 bg-orange-50 text-orange-700",
      major: "border-gray-300 bg-gray-50 text-gray-700",
    }

    return baseColors[type] || baseColors.major
  }

  const getToneColor = (tone: YearlyTheme["overallTone"]) => {
    switch (tone) {
      case "challenging":
        return "bg-red-100 text-red-800 border-red-200"
      case "transformation":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "growth":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "expansion":
        return "bg-green-100 text-green-800 border-green-200"
      case "stability":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const navigateTimeline = (direction: "prev" | "next") => {
    if (direction === "prev" && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    } else if (direction === "next" && currentIndex < timeline.length - 2) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const visibleYears = timeline.slice(currentIndex, currentIndex + 2)

  return (
    <div className="space-y-6">
      {/* Timeline Header */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ClockIcon className="w-6 h-6 text-primary" />
              <CardTitle className="text-2xl font-semibold">
                Your Cosmic Timeline
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateTimeline("prev")}
                disabled={currentIndex === 0}
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-[100px] text-center">
                {visibleYears[0]?.year} - {visibleYears[visibleYears.length - 1]?.year}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateTimeline("next")}
                disabled={currentIndex >= timeline.length - 2}
              >
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Timeline Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {visibleYears.map((yearData) => (
          <Card
            key={yearData.year}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedYear?.year === yearData.year ? "ring-2 ring-primary ring-offset-2" : ""
            }`}
            onClick={() => setSelectedYear(yearData)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold">{yearData.year}</CardTitle>
                <Badge className={`${getToneColor(yearData.overallTone)} border`}>{yearData.overallTone}</Badge>
              </div>
              <p className="text-sm text-muted-foreground text-pretty">{yearData.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Key Events */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Key Cosmic Events</h4>
                {yearData.keyEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${getEventColor(event.type, event.intensity)}`}
                  >
                    {getEventIcon(event.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      <p className="text-xs opacity-75">{event.theme}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {event.intensity}
                    </Badge>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full bg-transparent"
                onClick={() => setSelectedYear(yearData)}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed View */}
      {selectedYear && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">
                {selectedYear.year} - Detailed Guidance
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedYear(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedYear.keyEvents.map((event) => (
              <Card key={event.id} className="bg-muted/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${getEventColor(event.type, event.intensity)}`}>
                      {getEventIcon(event.type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{event.theme}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground text-pretty">{event.description}</p>

                  <div className="bg-background/50 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-foreground mb-2">Guidance</h5>
                    <p className="text-sm text-muted-foreground text-pretty">{getTimelineAdvice(event, mbtiType)}</p>
                  </div>

                  {mbtiType && event.mbtiAdvice?.[mbtiType] && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-primary mb-2">Personalized for {mbtiType}</h5>
                      <p className="text-sm text-muted-foreground text-pretty">{event.mbtiAdvice[mbtiType]}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Timeline Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transit Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded border-red-300 bg-red-50">
                <BrainIcon className="w-4 h-4 text-red-700" />
              </div>
              <span>Saturn - Structure & Discipline</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1 rounded border-green-300 bg-green-50">
                <TrendingUpIcon className="w-4 h-4 text-green-700" />
              </div>
              <span>Jupiter - Growth & Expansion</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1 rounded border-purple-300 bg-purple-50">
                <ZapIcon className="w-4 h-4 text-purple-700" />
              </div>
              <span>Uranus - Change & Innovation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1 rounded border-blue-300 bg-blue-50">
                <HeartIcon className="w-4 h-4 text-blue-700" />
              </div>
              <span>Neptune - Spirituality & Dreams</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1 rounded border-orange-300 bg-orange-50">
                <HeartIcon className="w-4 h-4 text-orange-700" />
              </div>
              <span>Chiron - Healing & Wisdom</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1 rounded border-gray-300 bg-gray-50">
                <ClockIcon className="w-4 h-4 text-gray-700" />
              </div>
              <span>General - Life Themes</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
