import type { Gateway } from '../core/gateway.js';
import type { ConversationConfig } from './types.js';
import { SpeechRecognizer } from './recognizer.js';
import { Speaker } from './speaker.js';

/**
 * Conversation orchestrator for continuous voice interaction
 *
 * Manages the loop of:
 * 1. Listen for user speech
 * 2. Send to AI gateway
 * 3. Speak AI response
 * 4. Repeat (if continuous mode enabled)
 *
 * @example
 * ```typescript
 * const conversation = new Conversation(gateway, {
 *   continuous: true,
 *   autoSpeak: true
 * });
 *
 * conversation.on('transcript', (text) => {
 *   console.log('User said:', text);
 * });
 *
 * conversation.on('response', (text) => {
 *   console.log('AI said:', text);
 * });
 *
 * await conversation.start();
 * ```
 */
export class Conversation {
  private gateway: Gateway;
  private recognizer: SpeechRecognizer;
  private speaker: Speaker;
  private config: Required<ConversationConfig>;
  private listeners: Map<string, Set<Function>> = new Map();
  private isActive = false;
  private shouldContinue = false;

  constructor(gateway: Gateway, config: ConversationConfig = {}) {
    this.gateway = gateway;

    this.config = {
      continuous: config.continuous ?? false,
      autoSpeak: config.autoSpeak ?? true,
      recognizer: config.recognizer ?? {},
      speaker: config.speaker ?? {},
    };

    // Initialize recognizer with continuous mode matching conversation mode
    this.recognizer = new SpeechRecognizer({
      ...this.config.recognizer,
      continuous: false, // We handle continuation at conversation level
    });

    this.speaker = new Speaker(this.config.speaker);

    this.setupEventHandlers();
  }

  /**
   * Set up event handlers for recognizer and speaker
   */
  private setupEventHandlers(): void {
    // Handle recognition results
    this.recognizer.on('result', async (result: any) => {
      if (!result.isFinal) {
        // Emit interim results
        this.emit('interim', result.transcript);
        return;
      }

      const transcript = result.transcript;
      this.emit('transcript', transcript);

      try {
        // Send to AI gateway
        const response = await this.gateway.complete(transcript);
        this.emit('response', response);

        // Speak response if autoSpeak is enabled
        if (this.config.autoSpeak) {
          this.speaker.speak(response);
        }
      } catch (error) {
        this.emit('error', error);
      }
    });

    // Handle recognition errors
    this.recognizer.on('error', (error: Error) => {
      this.emit('error', error);
    });

    // Handle recognition end
    this.recognizer.on('end', () => {
      // If continuous mode and not stopped, resume listening after speaker finishes
      if (this.shouldContinue && this.config.autoSpeak) {
        // Wait for speaker to finish before resuming
        if (!this.speaker.isActive()) {
          this.resumeListening();
        }
      }
    });

    // Handle speaker end
    this.speaker.on('end', () => {
      // Resume listening if continuous mode
      if (this.shouldContinue && !this.recognizer.isActive()) {
        this.resumeListening();
      }
    });

    // Handle speaker errors
    this.speaker.on('error', (error: Error) => {
      this.emit('error', error);
    });
  }

  /**
   * Resume listening after a delay
   */
  private resumeListening(): void {
    // Small delay before resuming to avoid picking up the tail of TTS
    setTimeout(() => {
      if (this.shouldContinue) {
        this.recognizer.startListening().catch(error => {
          this.emit('error', error);
        });
      }
    }, 500);
  }

  /**
   * Start conversation
   */
  async start(): Promise<void> {
    this.isActive = true;
    this.shouldContinue = this.config.continuous;

    this.emit('start');
    await this.recognizer.startListening();
  }

  /**
   * Stop conversation
   */
  stop(): void {
    this.isActive = false;
    this.shouldContinue = false;

    this.recognizer.stopListening();
    this.speaker.stop();

    this.emit('stop');
  }

  /**
   * Toggle conversation on/off
   */
  async toggle(): Promise<void> {
    if (this.isActive) {
      this.stop();
    } else {
      await this.start();
    }
  }

  /**
   * Pause conversation (temporary stop)
   */
  pause(): void {
    this.recognizer.stopListening();
    this.speaker.pause();
    this.emit('pause');
  }

  /**
   * Resume conversation after pause
   */
  async resume(): Promise<void> {
    this.speaker.resume();
    await this.recognizer.startListening();
    this.emit('resume');
  }

  /**
   * Check if conversation is active
   */
  isRunning(): boolean {
    return this.isActive;
  }

  /**
   * Check if recognizer is listening
   */
  isListening(): boolean {
    return this.recognizer.isActive();
  }

  /**
   * Check if speaker is speaking
   */
  isSpeaking(): boolean {
    return this.speaker.isActive();
  }

  /**
   * Get available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    return this.speaker.getVoices();
  }

  /**
   * Register event listener
   *
   * Events:
   * - 'start': Conversation started
   * - 'stop': Conversation stopped
   * - 'pause': Conversation paused
   * - 'resume': Conversation resumed
   * - 'interim': Interim transcript (while still speaking)
   * - 'transcript': Final transcript from user
   * - 'response': AI response text
   * - 'error': Error occurred
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
  getConfig(): Readonly<Required<ConversationConfig>> {
    return { ...this.config };
  }
}
