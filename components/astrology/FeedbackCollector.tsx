"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  /** Accuracy never updates resonance weights. Use it only for a concrete "did this happen" check. */
  kind?: "resonance" | "accuracy"
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
  kind = "resonance",
}: FeedbackCollectorProps) {
  const [feedbackMode, setFeedbackMode] = useState<"simple" | "detailed" | "submitted">("simple")
  const [resonated, setResonated] = useState<boolean | null>(null)
  const [helped, setHelped] = useState<boolean | null>(null)
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleQuickFeedback = async (didResonate: boolean) => {
    setResonated(didResonate)

    if (compact) {
      await submitFeedback({
        kind,
        resonated: didResonate,
        accuracyScore: didResonate ? 0.85 : 0.25,
        notes: kind === "accuracy" ? "Accuracy check" : "Resonance check",
      })
    } else {
      setFeedbackMode("detailed")
    }
  }

  const submitFeedback = async (feedback: FeedbackData & { kind?: "resonance" | "usefulness" | "accuracy" }) => {
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
      kind: "resonance",
      resonated,
      accuracyScore: resonated ? 0.85 : 0.25,
      notes: notes.trim() || undefined,
    })
    if (helped !== null) {
      await submitFeedback({
        kind: "usefulness",
        resonated: helped,
        accuracyScore: helped ? 0.65 : 0.4,
        notes: notes.trim() || undefined,
      })
    }
  }

  if (feedbackMode === "submitted") {
    return (
      <div className="flex items-center justify-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
        <span className="text-sm font-medium text-green-700 dark:text-green-300">
          {kind === "accuracy"
            ? "Logged as an accuracy check. It does not change today's scores."
            : "Noted. Relevance and usefulness stay separate."}
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

            <div>
              <p className="text-sm font-medium text-foreground mb-2">Did the suggestion help?</p>
              <div className="flex items-center space-x-2">
                <Button
                  variant={helped === true ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHelped(true)}
                >
                  It helped
                </Button>
                <Button
                  variant={helped === false ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHelped(false)}
                >
                  Not really
                </Button>
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
