"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MessageCircle, X } from "lucide-react"
import { FeedbackCollector } from "./FeedbackCollector"

interface FeedbackPromptProps {
  aspectId: string
  theme: string
  userId: string
  transitDescription: string
  onDismiss?: () => void
}

export function FeedbackPrompt({ aspectId, theme, userId, transitDescription, onDismiss }: FeedbackPromptProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
  }

  const handleFeedbackSubmitted = () => {
    setIsExpanded(false)
    setTimeout(() => setIsDismissed(true), 2000) // Auto-dismiss after success
  }

  if (isDismissed) return null

  if (!isExpanded) {
    return (
      <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageCircle className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">How did this forecast feel?</p>
                <p className="text-xs text-muted-foreground">Help Merlin learn your cosmic patterns</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button size="sm" onClick={() => setIsExpanded(true)} className="bg-primary hover:bg-primary/90">
                Give Feedback
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <FeedbackCollector
      aspectId={aspectId}
      theme={theme}
      userId={userId}
      transitDescription={transitDescription}
      onFeedbackSubmitted={handleFeedbackSubmitted}
    />
  )
}
