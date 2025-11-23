import type { SpeakerConfig } from './types.js';
import { VoiceNotSupportedError } from './types.js';

/**
 * Text-to-speech wrapper using Web Speech API
 *
 * Provides a clean interface for browser-based text-to-speech
 * with voice selection, queuing, and interruption handling.
 *
 * @example
 * ```typescript
 * const speaker = new Speaker({
 *   language: 'en-US',
 *   rate: 1.0,
 *   pitch: 1.0
 * });
 *
 * speaker.speak('Hello, world!');
 * speaker.on('end', () => console.log('Finished speaking'));
 * ```
 */
export class Speaker {
  private config: Required<SpeakerConfig>;
  private synthesis: SpeechSynthesis;
  private listeners: Map<string, Set<Function>> = new Map();
  private queue: SpeechSynthesisUtterance[] = [];
  private isSpeaking = false;

  constructor(config: SpeakerConfig = {}) {
    this.config = {
      voiceName: config.voiceName || '',
      language: config.language || 'en-US',
      rate: config.rate ?? 1,
      pitch: config.pitch ?? 1,
      volume: config.volume ?? 1,
    };

    // Check browser support
    if (!this.isSupported()) {
      throw new VoiceNotSupportedError('Speech Synthesis');
    }

    this.synthesis = window.speechSynthesis;
  }

  /**
   * Check if text-to-speech is supported
   */
  static isSupported(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    return 'speechSynthesis' in window;
  }

  /**
   * Check if text-to-speech is supported (instance method)
   */
  private isSupported(): boolean {
    return Speaker.isSupported();
  }

  /**
   * Speak text aloud
   *
   * @param text - Text to speak
   * @param options - Optional override config for this utterance
   */
  speak(text: string, options?: Partial<SpeakerConfig>): void {
    const utterance = new SpeechSynthesisUtterance(text);

    // Apply configuration
    const config = { ...this.config, ...options };

    utterance.lang = config.language;
    utterance.rate = config.rate;
    utterance.pitch = config.pitch;
    utterance.volume = config.volume;

    // Set voice if specified
    if (config.voiceName) {
      const voices = this.getVoices();
      const voice = voices.find(v => v.name === config.voiceName);
      if (voice) {
        utterance.voice = voice;
      }
    }

    // Set up event handlers
    utterance.onstart = () => {
      this.isSpeaking = true;
      this.emit('start');
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.emit('end');

      // Process next in queue
      if (this.queue.length > 0) {
        const next = this.queue.shift()!;
        this.synthesis.speak(next);
      }
    };

    utterance.onerror = (event) => {
      this.isSpeaking = false;
      this.emit('error', new Error(`TTS error: ${event.error}`));
    };

    // If currently speaking, queue it
    if (this.isSpeaking) {
      this.queue.push(utterance);
    } else {
      this.synthesis.speak(utterance);
    }
  }

  /**
   * Stop speaking immediately
   */
  stop(): void {
    this.synthesis.cancel();
    this.queue = [];
    this.isSpeaking = false;
  }

  /**
   * Pause speaking
   */
  pause(): void {
    if (this.synthesis.speaking) {
      this.synthesis.pause();
    }
  }

  /**
   * Resume speaking
   */
  resume(): void {
    if (this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  /**
   * Check if currently speaking
   */
  isActive(): boolean {
    return this.isSpeaking || this.synthesis.speaking;
  }

  /**
   * Get available voices
   *
   * @returns List of available speech synthesis voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    return this.synthesis.getVoices();
  }

  /**
   * Get voices for a specific language
   *
   * @param language - Language code (e.g., 'en-US')
   * @returns Voices matching the language
   */
  getVoicesForLanguage(language: string): SpeechSynthesisVoice[] {
    return this.getVoices().filter(voice => voice.lang.startsWith(language));
  }

  /**
   * Register event listener
   *
   * Events:
   * - 'start': Fired when speech starts
   * - 'end': Fired when speech ends
   * - 'error': Fired when an error occurs
   *
   * @param event - Event name
   * @param callback - Event callback
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(callback);
  }

  /**
   * Remove event listener
   *
   * @param event - Event name
   * @param callback - Event callback
   */
  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Emit event to all listeners
   *
   * @param event - Event name
   * @param data - Event data
   */
  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<Required<SpeakerConfig>> {
    return { ...this.config };
  }

  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.queue.length;
  }
}
