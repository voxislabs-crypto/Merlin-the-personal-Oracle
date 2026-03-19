"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThumbsUp, ThumbsDown, MessageSquare, TrendingUp, CheckCircle } from "lucide-react"
import type { FeedbackData } from "@/lib/resonance-types"

interface FeedbackCollectorProps {
  aspectId: string
  theme: string
  userId: string
  transitDescription: string
  mbtiType?: string
  onFeedbackSubmitted?: () => void
  compact?: boolean
  promptText?: string
}

export function FeedbackCollector({
  aspectId,
  theme,
  userId,
  transitDescription,
  mbtiType,
  onFeedbackSubmitted,
  compact = false,
  promptText = "Did this forecast resonate with your experience?",
}: FeedbackCollectorProps) {
  const [feedbackMode, setFeedbackMode] = useState<"simple" | "detailed" | "submitted">("simple")
  const [resonated, setResonated] = useState<boolean | null>(null)
  const [accuracyScore, setAccuracyScore] = useState([75])
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleQuickFeedback = async (didResonate: boolean) => {
    setResonated(didResonate)

    if (compact) {
      // For compact mode, submit immediately with default accuracy
      await submitFeedback({
        resonated: didResonate,
        accuracyScore: didResonate ? 0.8 : 0.3,
        notes: "",
      })
    } else {
      setFeedbackMode("detailed")
    }
  }

  const submitFeedback = async (feedback: FeedbackData) => {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/resonance-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          aspectId,
          theme,
          mbtiType,
          feedback,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit feedback')
      }

      setFeedbackMode("submitted")
      onFeedbackSubmitted?.()
    } catch (error) {
      console.error("Failed to submit feedback:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDetailedSubmit = async () => {
    if (resonated === null) return

    await submitFeedback({
      resonated,
      accuracyScore: accuracyScore[0] / 100,
      notes: notes.trim() || undefined,
    })
  }

  if (feedbackMode === "submitted") {
    return (
      <div className="flex items-center justify-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
        <span className="text-sm font-medium text-green-700 dark:text-green-300">
          Thank you! Merlin is learning from your feedback.
        </span>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border/50">
        <span className="text-sm text-muted-foreground">{promptText}</span>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleQuickFeedback(true)}
            disabled={isSubmitting}
            className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20"
          >
            <ThumbsUp className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleQuickFeedback(false)}
            disabled={isSubmitting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            <ThumbsDown className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center">
          <TrendingUp className="w-4 h-4 mr-2 text-primary" />
          Help Merlin Learn
        </CardTitle>
        <p className="text-sm text-muted-foreground">{transitDescription}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {feedbackMode === "simple" && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm font-medium text-foreground mb-3">
                {promptText}
              </p>
              <div className="flex items-center justify-center space-x-4">
                <Button
                  variant={resonated === true ? "default" : "outline"}
                  onClick={() => handleQuickFeedback(true)}
                  disabled={isSubmitting}
                  className="flex items-center space-x-2"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>Yes, it resonated</span>
                </Button>
                <Button
                  variant={resonated === false ? "default" : "outline"}
                  onClick={() => handleQuickFeedback(false)}
                  disabled={isSubmitting}
                  className="flex items-center space-x-2"
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span>No, it didn't</span>
                </Button>
              </div>
            </div>
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFeedbackMode("detailed")}
                className="text-primary hover:text-primary/80"
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                Provide detailed feedback
              </Button>
            </div>
          </div>
        )}

        {feedbackMode === "detailed" && (
          <div className="space-y-4">
            {/* Resonance Selection */}
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Did this forecast resonate?</p>
              <div className="flex items-center space-x-2">
                <Button
                  variant={resonated === true ? "default" : "outline"}
                  size="sm"
                  onClick={() => setResonated(true)}
                >
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  Yes
                </Button>
                <Button
                  variant={resonated === false ? "default" : "outline"}
                  size="sm"
                  onClick={() => setResonated(false)}
                >
                  <ThumbsDown className="w-4 h-4 mr-1" />
                  No
                </Button>
              </div>
            </div>

            {/* Accuracy Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-foreground">How accurate was this forecast?</p>
                <Badge variant="secondary">{accuracyScore[0]}%</Badge>
              </div>
              <Slider
                value={accuracyScore}
                onValueChange={setAccuracyScore}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Not at all</span>
                <span>Perfectly accurate</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Additional notes (optional)</p>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Share more details about your experience..."
                className="min-h-[80px]"
              />
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setFeedbackMode("simple")} disabled={isSubmitting}>
                Back
              </Button>
              <Button
                onClick={handleDetailedSubmit}
                disabled={resonated === null || isSubmitting}
                className="bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
