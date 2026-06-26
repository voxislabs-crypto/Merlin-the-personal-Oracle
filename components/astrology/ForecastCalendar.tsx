"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from "lucide-react"
import { generateDailyForecast, type DailyForecast } from "@/lib/transit-calculator"
import { TransitDisplay } from "@/components/astrology/TransitDisplay"

interface ForecastCalendarProps {
  mbtiType?: string
}

export function ForecastCalendar({ mbtiType }: ForecastCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedForecast, setSelectedForecast] = useState<DailyForecast | null>(null)

  const today = new Date()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDayOfWeek = firstDayOfMonth.getDay()

  // Generate calendar days
  const calendarDays = []

  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day))
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
    setSelectedDate(null)
    setSelectedForecast(null)
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    const forecast = generateDailyForecast(date, undefined, mbtiType as any)
    setSelectedForecast(forecast as any)
  }

  const getDayRatingColor = (date: Date) => {
    // Simple deterministic color for initial display
    // In production, implement forecast caching to avoid performance issues
    const day = date.getDate()
    if (day % 3 === 0) {
      return "bg-green-100 hover:bg-green-200 border-green-300 text-green-800"
    } else if (day % 3 === 1) {
      return "bg-yellow-100 hover:bg-yellow-200 border-yellow-300 text-yellow-800"
    } else {
      return "bg-red-100 hover:bg-red-200 border-red-300 text-red-800"
    }
  }

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString()
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-6 h-6 text-primary" />
              <CardTitle className="text-2xl font-semibold">
                Cosmic Calendar
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                <ChevronLeftIcon className="w-4 h-4" />
              </Button>
              <div className="text-lg font-semibold min-w-[140px] text-center">
                {monthNames[month]} {year}
              </div>
              <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {dayNames.map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((date, index) => (
                  <div key={index} className="aspect-square">
                    {date ? (
                      <button
                        onClick={() => handleDateClick(date)}
                        className={`
                          w-full h-full rounded-lg border-2 transition-all duration-200 
                          flex flex-col items-center justify-center text-sm font-medium
                          ${getDayRatingColor(date)}
                          ${isSelected(date) ? "ring-2 ring-primary ring-offset-2" : ""}
                          ${isToday(date) ? "ring-1 ring-primary" : ""}
                        `}
                      >
                        <span className="text-base">{date.getDate()}</span>
                        {isToday(date) && <div className="w-1 h-1 bg-primary rounded-full mt-1" />}
                      </button>
                    ) : (
                      <div className="w-full h-full" />
                    )}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-300 rounded" />
                  <span className="text-sm text-muted-foreground">Favorable</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded" />
                  <span className="text-sm text-muted-foreground">Mixed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border border-red-300 rounded" />
                  <span className="text-sm text-muted-foreground">Challenging</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Day Details */}
        <div className="lg:col-span-1">
          {selectedForecast ? (
            <div className="space-y-4">
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">
                    {selectedDate?.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Badge
                      className={`${
                        selectedForecast.day_rating === "green"
                          ? "bg-green-100 text-green-800 border-green-200"
                          : selectedForecast.day_rating === "yellow"
                            ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                            : "bg-red-100 text-red-800 border-red-200"
                      } border`}
                    >
                      {selectedForecast.day_rating === "green" && "Favorable Day"}
                      {selectedForecast.day_rating === "yellow" && "Mixed Energies"}
                      {selectedForecast.day_rating === "red" && "Challenging Day"}
                    </Badge>
                    <p className="text-sm text-muted-foreground text-pretty">{selectedForecast.summary}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Transit Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Active Transits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedForecast.transits.slice(0, 3).map((transit, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground truncate">{transit.transit_aspect}</span>
                        <Badge variant="outline" className="text-xs">
                          {transit.effect}
                        </Badge>
                      </div>
                    ))}
                    {selectedForecast.transits.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        +{selectedForecast.transits.length - 3} more transits
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={() => {
                  /* Navigate to detailed view */
                }}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                View Full Details
              </Button>
            </div>
          ) : (
            <Card className="border-2 border-dashed border-muted-foreground/25">
              <CardContent className="p-8 text-center">
                <CalendarIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">Click on any day to see your cosmic forecast</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Detailed View Modal/Section */}
      {selectedForecast && selectedDate && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Detailed Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TransitDisplay forecast={selectedForecast} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
