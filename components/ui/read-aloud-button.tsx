'use client';

import { useState } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { VoiceArchetype } from '@/lib/soul/tts';
import { readJsonResponse, resolveApiUrl } from '@/lib/api-client';

interface ReadAloudButtonProps {
  text: string;
  voice?: VoiceArchetype;
  className?: string;
}

export function ReadAloudButton({ 
  text, 
  voice = 'sage',
  className = '' 
}: ReadAloudButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const handleReadAloud = async () => {
    // If already playing, stop
    if (isPlaying && audio) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(resolveApiUrl('/api/tts'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice }),
      });

      const result = await readJsonResponse<{
        success: boolean;
        error?: string;
        data?: { audio?: string };
      }>(response, 'tts');

      if (result.success && result.data.audio) {
        const audioElement = new Audio(result.data.audio);
        
        audioElement.onended = () => {
          setIsPlaying(false);
        };

        audioElement.onerror = () => {
          console.error('Audio playback error');
          setIsPlaying(false);
          setIsLoading(false);
        };

        setAudio(audioElement);
        await audioElement.play();
        setIsPlaying(true);
      } else {
        console.error('TTS failed:', result.error);
      }
    } catch (error) {
      console.error('Failed to generate audio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleReadAloud}
      variant="outline"
      size="sm"
      className={`gap-2 ${className}`}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : isPlaying ? (
        <>
          <VolumeX className="h-4 w-4" />
          Stop
        </>
      ) : (
        <>
          <Volume2 className="h-4 w-4" />
          Read Aloud
        </>
      )}
    </Button>
  );
}
