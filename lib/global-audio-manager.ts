/**
 * Global Audio Manager - Lives outside React lifecycle
 * Prevents audio cutoff from component re-renders and garbage collection
 */

class GlobalAudioManager {
  private audio: HTMLAudioElement | null = null;
  private currentMessageId: string | null = null;
  private hasEnded: boolean = false;
  private onPlayCallback: (() => void) | null = null;
  private onPauseCallback: (() => void) | null = null;
  private onEndCallback: (() => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeAudio();
    }
  }

  private initializeAudio() {
    this.audio = new Audio();
    this.audio.preload = 'auto';

    this.audio.onplay = () => {
      console.log('[GlobalAudio] Playback started');
      this.hasEnded = false;
      this.onPlayCallback?.();
    };

    this.audio.onpause = () => {
      if (!this.hasEnded) {
        console.log('[GlobalAudio] Paused (not ended)');
        this.onPauseCallback?.();
      }
    };

    this.audio.onended = () => {
      console.log('[GlobalAudio] Playback completed');
      this.hasEnded = true;
      this.onEndCallback?.();
      this.currentMessageId = null;
    };

    this.audio.onerror = (e) => {
      console.error('[GlobalAudio] Error:', e, this.audio?.error);
      this.onErrorCallback?.('Audio playback failed');
      this.currentMessageId = null;
    };

    this.audio.onstalled = () => {
      console.warn('[GlobalAudio] Stalled, attempting resume...');
      if (!this.hasEnded && this.audio?.paused) {
        this.audio.play().catch(e => console.error('[GlobalAudio] Resume failed:', e));
      }
    };

    this.audio.onwaiting = () => {
      console.log('[GlobalAudio] Buffering...');
    };

    this.audio.oncanplaythrough = () => {
      console.log('[GlobalAudio] Can play through');
    };
  }

  async play(audioUrl: string, messageId: string): Promise<void> {
    if (!this.audio) {
      throw new Error('Audio not initialized');
    }

    // Stop current playback if any
    if (this.currentMessageId) {
      this.stop();
    }

    this.currentMessageId = messageId;
    this.hasEnded = false;
    this.audio.src = audioUrl;
    this.audio.load();

    // Wait for buffer
    await new Promise(resolve => setTimeout(resolve, 150));

    try {
      await this.audio.play();
      console.log('[GlobalAudio] Play promise resolved');
    } catch (error) {
      console.error('[GlobalAudio] Play failed:', error);
      this.currentMessageId = null;
      throw error;
    }
  }

  pause(): void {
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
    }
  }

  resume(): void {
    if (this.audio && this.audio.paused && !this.hasEnded) {
      this.audio.play().catch(e => console.error('[GlobalAudio] Resume error:', e));
    }
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.currentMessageId = null;
    this.hasEnded = true;
  }

  isPlaying(): boolean {
    return this.audio ? !this.audio.paused && !this.hasEnded : false;
  }

  isPaused(): boolean {
    return this.audio ? this.audio.paused && !this.hasEnded : false;
  }

  getCurrentMessageId(): string | null {
    return this.currentMessageId;
  }

  getAudioElement(): HTMLAudioElement | null {
    return this.audio;
  }

  setCallbacks(callbacks: {
    onPlay?: () => void;
    onPause?: () => void;
    onEnd?: () => void;
    onError?: (error: string) => void;
  }): void {
    this.onPlayCallback = callbacks.onPlay || null;
    this.onPauseCallback = callbacks.onPause || null;
    this.onEndCallback = callbacks.onEnd || null;
    this.onErrorCallback = callbacks.onError || null;
  }

  clearCallbacks(): void {
    this.onPlayCallback = null;
    this.onPauseCallback = null;
    this.onEndCallback = null;
    this.onErrorCallback = null;
  }
}

// Global singleton instance
export const globalAudioManager = typeof window !== 'undefined' ? new GlobalAudioManager() : null;
