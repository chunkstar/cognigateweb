import type { RecognizerConfig, RecognitionResult } from './types.js';
import { VoiceNotSupportedError, VoicePermissionError } from './types.js';

/**
 * Speech recognition wrapper using Web Speech API
 *
 * Provides a clean interface for browser-based speech recognition
 * with cross-browser support and error handling.
 *
 * @example
 * ```typescript
 * const recognizer = new SpeechRecognizer({
 *   language: 'en-US',
 *   continuous: false
 * });
 *
 * recognizer.on('result', (result) => {
 *   console.log('You said:', result.transcript);
 * });
 *
 * await recognizer.startListening();
 * ```
 */
export class SpeechRecognizer {
  private recognition: any; // SpeechRecognition type not available in Node
  private config: Required<RecognizerConfig>;
  private listeners: Map<string, Set<Function>> = new Map();
  private isListening = false;

  constructor(config: RecognizerConfig = {}) {
    this.config = {
      language: config.language || '',
      continuous: config.continuous ?? false,
      interimResults: config.interimResults ?? false,
      maxAlternatives: config.maxAlternatives ?? 1,
    };

    // Check browser support
    if (!this.isSupported()) {
      throw new VoiceNotSupportedError('Speech Recognition');
    }

    this.initializeRecognition();
  }

  /**
   * Check if speech recognition is supported
   */
  static isSupported(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  /**
   * Check if speech recognition is supported (instance method)
   */
  private isSupported(): boolean {
    return SpeechRecognizer.isSupported();
  }

  /**
   * Initialize speech recognition
   */
  private initializeRecognition(): void {
    // @ts-ignore - SpeechRecognition types not available
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    // Configure recognition
    if (this.config.language) {
      this.recognition.lang = this.config.language;
    }
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.maxAlternatives = this.config.maxAlternatives;

    // Set up event handlers
    this.recognition.onresult = (event: any) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      const alternative = lastResult[0];

      const result: RecognitionResult = {
        transcript: alternative.transcript,
        confidence: alternative.confidence,
        isFinal: lastResult.isFinal,
      };

      this.emit('result', result);
    };

    this.recognition.onerror = (event: any) => {
      const error = event.error;

      if (error === 'not-allowed' || error === 'permission-denied') {
        this.emit('error', new VoicePermissionError());
      } else {
        this.emit('error', new Error(`Speech recognition error: ${error}`));
      }

      this.isListening = false;
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.emit('end');
    };

    this.recognition.onstart = () => {
      this.isListening = true;
      this.emit('start');
    };
  }

  /**
   * Start listening for speech
   *
   * @throws {VoicePermissionError} If microphone permission is denied
   */
  async startListening(): Promise<void> {
    if (this.isListening) {
      return;
    }

    try {
      this.recognition.start();
    } catch (error) {
      if (error instanceof Error && error.message.includes('already started')) {
        // Already listening, ignore
        return;
      }
      throw error;
    }
  }

  /**
   * Stop listening for speech
   */
  stopListening(): void {
    if (!this.isListening) {
      return;
    }

    this.recognition.stop();
  }

  /**
   * Abort listening immediately
   */
  abort(): void {
    this.recognition.abort();
    this.isListening = false;
  }

  /**
   * Check if currently listening
   */
  isActive(): boolean {
    return this.isListening;
  }

  /**
   * Register event listener
   *
   * Events:
   * - 'result': Fired when speech is recognized
   * - 'error': Fired when an error occurs
   * - 'start': Fired when recognition starts
   * - 'end': Fired when recognition ends
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
  getConfig(): Readonly<Required<RecognizerConfig>> {
    return { ...this.config };
  }
}
