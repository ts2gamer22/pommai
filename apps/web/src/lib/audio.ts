/**
 * Audio utility functions for browser audio handling
 * Provides base64 conversion, audio playback, and caching functionality
 */

/**
 * Audio cache to store preloaded audio URLs
 * @type {Map<string, string>}
 */
const audioCache = new Map<string, string>();

/**
 * Active audio elements for cleanup
 * @type {Map<string, HTMLAudioElement>}
 */
const activeAudioElements = new Map<string, HTMLAudioElement>();

/**
 * Convert base64 encoded audio data to Blob
 * @param {string} base64Data - Base64 encoded audio data
 * @param {string} mimeType - MIME type of the audio (default: audio/mp3)
 * @returns {Blob} Audio blob
 */
export function base64ToBlob(base64Data: string, mimeType: string = 'audio/mp3'): Blob {
  try {
    // Remove data URL prefix if present
    const base64 = base64Data.replace(/^data:audio\/[a-z]+;base64,/, '');
    
    // Decode base64 string
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  } catch (error) {
    console.error('Error converting base64 to blob:', error);
    throw new Error('Failed to convert audio data');
  }
}

/**
 * Create a URL from audio blob for playback
 * @param {Blob} blob - Audio blob
 * @returns {string} Object URL for audio playback
 */
export function createAudioURL(blob: Blob): string {
  try {
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error creating audio URL:', error);
    throw new Error('Failed to create audio URL');
  }
}

/**
 * Play audio from base64 data
 * @param {string} base64Data - Base64 encoded audio data
 * @param {object} options - Playback options
 * @param {string} options.id - Unique identifier for the audio
 * @param {number} options.volume - Volume level (0-1)
 * @param {boolean} options.cache - Whether to cache the audio
 * @param {function} options.onEnded - Callback when audio ends
 * @param {function} options.onError - Error callback
 * @returns {Promise<HTMLAudioElement>} Audio element
 */
export async function playAudio(
  base64Data: string,
  options: {
    id?: string;
    volume?: number;
    cache?: boolean;
    onEnded?: () => void;
    onError?: (error: Error) => void;
  } = {}
): Promise<HTMLAudioElement> {
  const {
    id = Date.now().toString(),
    volume = 1.0,
    cache = true,
    onEnded,
    onError,
  } = options;

  try {
    // Check cache first
    let audioUrl = cache ? audioCache.get(id) : null;
    
    if (!audioUrl) {
      // Convert base64 to blob and create URL
      const blob = base64ToBlob(base64Data);
      audioUrl = createAudioURL(blob);
      
      // Cache the URL if requested
      if (cache) {
        audioCache.set(id, audioUrl);
      }
    }
    
    // Stop any existing audio with the same ID
    stopAudio(id);
    
    // Create and configure audio element
    const audio = new Audio(audioUrl);
    audio.volume = volume;
    
    // Store reference for cleanup
    activeAudioElements.set(id, audio);
    
    // Set up event handlers
    audio.addEventListener('ended', () => {
      activeAudioElements.delete(id);
      onEnded?.();
    });
    
    audio.addEventListener('error', (e) => {
      activeAudioElements.delete(id);
      const error = new Error(`Audio playback failed: ${e.message || 'Unknown error'}`);
      console.error('Audio playback error:', error);
      onError?.(error);
    });
    
    // Play the audio
    await audio.play();
    
    return audio;
  } catch (error) {
    console.error('Error playing audio:', error);
    onError?.(error as Error);
    throw error;
  }
}

/**
 * Preload audio data for faster playback
 * @param {string} base64Data - Base64 encoded audio data
 * @param {string} id - Unique identifier for caching
 * @returns {Promise<void>}
 */
export async function preloadAudio(base64Data: string, id: string): Promise<void> {
  try {
    if (audioCache.has(id)) {
      return; // Already cached
    }
    
    const blob = base64ToBlob(base64Data);
    const url = createAudioURL(blob);
    audioCache.set(id, url);
    
    // Preload the audio
    const audio = new Audio(url);
    audio.preload = 'auto';
    
    // Wait for the audio to be loaded
    await new Promise((resolve, reject) => {
      audio.addEventListener('canplaythrough', resolve, { once: true });
      audio.addEventListener('error', reject, { once: true });
    });
  } catch (error) {
    console.error('Error preloading audio:', error);
    throw new Error('Failed to preload audio');
  }
}

/**
 * Stop playing audio by ID
 * @param {string} id - Audio identifier
 */
export function stopAudio(id: string): void {
  const audio = activeAudioElements.get(id);
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
    activeAudioElements.delete(id);
  }
}

/**
 * Stop all playing audio
 */
export function stopAllAudio(): void {
  activeAudioElements.forEach((audio, id) => {
    audio.pause();
    audio.currentTime = 0;
  });
  activeAudioElements.clear();
}

/**
 * Clear audio cache
 * @param {string} id - Optional specific ID to clear, otherwise clears all
 */
export function clearAudioCache(id?: string): void {
  if (id) {
    const url = audioCache.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      audioCache.delete(id);
    }
  } else {
    // Clear all cached URLs
    audioCache.forEach((url) => {
      URL.revokeObjectURL(url);
    });
    audioCache.clear();
  }
}

/**
 * Get audio format from output format string
 * @param {string} outputFormat - ElevenLabs output format
 * @returns {string} MIME type
 */
export function getAudioMimeType(outputFormat: string): string {
  // Parse ElevenLabs output format strings
  if (outputFormat.startsWith('mp3')) {
    return 'audio/mp3';
  } else if (outputFormat.startsWith('pcm')) {
    return 'audio/wav';
  } else if (outputFormat === 'ulaw') {
    return 'audio/basic';
  } else if (outputFormat === 'opus') {
    return 'audio/opus';
  }
  return 'audio/mp3'; // Default
}

/**
 * Format audio duration for display
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration (e.g., "1:23")
 */
export function formatAudioDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Audio player component utilities
 */
export interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
}

/**
 * Create an audio player controller
 * @param {string} audioUrl - URL or base64 data
 * @returns {object} Player controller
 */
export function createAudioPlayer(audioUrl: string) {
  let audio: HTMLAudioElement | null = null;
  const state: AudioPlayerState = {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1.0,
    isMuted: false,
  };

  return {
    play: async () => {
      if (!audio) {
        audio = new Audio(audioUrl);
        audio.volume = state.volume;
        audio.muted = state.isMuted;
      }
      await audio.play();
      state.isPlaying = true;
    },
    
    pause: () => {
      audio?.pause();
      state.isPlaying = false;
    },
    
    stop: () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        state.isPlaying = false;
        state.currentTime = 0;
      }
    },
    
    seek: (time: number) => {
      if (audio) {
        audio.currentTime = time;
        state.currentTime = time;
      }
    },
    
    setVolume: (volume: number) => {
      state.volume = Math.max(0, Math.min(1, volume));
      if (audio) {
        audio.volume = state.volume;
      }
    },
    
    toggleMute: () => {
      state.isMuted = !state.isMuted;
      if (audio) {
        audio.muted = state.isMuted;
      }
    },
    
    getState: () => state,
    
    destroy: () => {
      if (audio) {
        audio.pause();
        audio.src = '';
        audio = null;
      }
    },
  };
}

/**
 * Clean up all audio resources (call on component unmount)
 */
export function cleanupAudioResources(): void {
  stopAllAudio();
  clearAudioCache();
}
