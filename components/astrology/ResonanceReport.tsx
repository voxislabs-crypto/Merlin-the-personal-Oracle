"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, TrendingUp, Flame, Users, Calendar } from "lucide-react"

interface ResonanceReportProps {
  onBack: () => void
}

export default function ResonanceReport({ onBack }: ResonanceReportProps) {
  const [selectedWeek] = useState("Aug 26 – Sept 1, 2025")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-purple-300 hover:text-white hover:bg-purple-900/50"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="text-center flex-1">
          <h1 className="text-2xl font-serif text-purple-200 mb-1">✨ Your Week in Resonance ✨</h1>
          <p className="text-purple-400">{selectedWeek}</p>
          <p className="text-sm text-purple-500 italic mt-1">Merlin attuned with your cosmic rhythm this week</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Accuracy Summary */}
        <Card className="bg-slate-900/50 border-purple-800/50 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <div className="text-6xl font-bold text-yellow-400 mb-2">87%</div>
            <div className="text-lg text-purple-200 mb-4">Accurate</div>
            <div className="flex items-center justify-center gap-6 mb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" />
                <span className="text-orange-300">7 days logged</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-green-300">+5% from last week</span>
              </div>
            </div>
            <Progress value={87} className="w-full h-3 bg-slate-800" />
          </CardContent>
        </Card>

        {/* Top Influences */}
        <Card className="bg-slate-900/50 border-purple-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-purple-200 font-serif">Top Influences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg border border-purple-700/30">
              <div className="text-2xl">☽ □ ♄</div>
              <div className="flex-1">
                <div className="font-medium text-purple-200">Moon Square Saturn</div>
                <div className="text-sm text-purple-400 italic">91% resonance — emotional heaviness noted</div>
              </div>
              <div className="text-yellow-400 font-bold">91%</div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg border border-purple-700/30">
              <div className="text-2xl">☉ △ ♃</div>
              <div className="flex-1">
                <div className="font-medium text-purple-200">Sun Trine Jupiter</div>
                <div className="text-sm text-purple-400 italic">88% resonance — career optimism</div>
              </div>
              <div className="text-yellow-400 font-bold">88%</div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg border border-purple-700/30">
              <div className="text-2xl">♀ ☍ ♇</div>
              <div className="flex-1">
                <div className="font-medium text-purple-200">Venus Opposite Pluto</div>
                <div className="text-sm text-purple-400 italic">76% resonance — intensity in relationships</div>
              </div>
              <div className="text-yellow-400 font-bold">76%</div>
            </div>
          </CardContent>
        </Card>

        {/* Cluster Insight */}
        <Card className="bg-slate-900/50 border-purple-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-purple-200 font-serif flex items-center gap-2">
              <Users className="w-5 h-5" />
              Cluster Insight
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <p className="text-purple-300">
                INFJs resonated <span className="text-yellow-400 font-bold">12% stronger</span> with Saturn than the
                average user this week
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-purple-400">Your Group (INFJs)</span>
                <span className="text-yellow-400">87%</span>
              </div>
              <Progress value={87} className="h-2 bg-slate-800" />
              <div className="flex justify-between text-sm">
                <span className="text-purple-400">All Users</span>
                <span className="text-purple-300">75%</span>
              </div>
              <Progress value={75} className="h-2 bg-slate-800" />
            </div>
          </CardContent>
        </Card>

        {/* Theme Recap */}
        <Card className="bg-slate-900/50 border-purple-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-purple-200 font-serif">Theme Recap</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <span className="text-purple-300">
                <strong>Career</strong> → You adapted under Saturn pressure
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <span className="text-purple-300">
                <strong>Relationships</strong> → Tension, but clarity came through
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-purple-300">
                <strong>Inner Work</strong> → Chiron brought healing opportunities
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Looking Ahead */}
        <Card className="bg-slate-900/50 border-purple-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-purple-200 font-serif flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Looking Ahead
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-purple-300 mb-3">Next week's strongest influence:</p>
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="text-3xl">☉ △ ♃</div>
                <div>
                  <div className="font-medium text-purple-200">Sun Trine Jupiter</div>
                  <div className="text-sm text-purple-400 italic">Expansion and optimism in career</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer CTA */}
        <div className="text-center space-y-4 py-6">
          <p className="text-purple-400">🔮 Keep logging resonance to sharpen Merlin</p>
          <Button onClick={onBack} className="bg-purple-700 hover:bg-purple-600 text-white px-8">
            View Next Week's Forecast →
          </Button>
        </div>
      </div>
    </div>
  )
}
