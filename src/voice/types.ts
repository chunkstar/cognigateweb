/**
 * Voice recognition configuration
 */
export interface RecognizerConfig {
  /**
   * Language code for speech recognition
   * @default browser default
   * @example 'en-US', 'es-ES', 'fr-FR'
   */
  language?: string;

  /**
   * Continuous recognition mode
   * When true, keeps listening until explicitly stopped
   * @default false
   */
  continuous?: boolean;

  /**
   * Return interim results while still speaking
   * @default false
   */
  interimResults?: boolean;

  /**
   * Maximum number of alternative transcriptions
   * @default 1
   */
  maxAlternatives?: number;
}

/**
 * Speech recognition result
 */
export interface RecognitionResult {
  /**
   * Transcribed text
   */
  transcript: string;

  /**
   * Confidence score (0-1)
   */
  confidence: number;

  /**
   * Whether this is a final result or interim
   */
  isFinal: boolean;
}

/**
 * Text-to-speech configuration
 */
export interface SpeakerConfig {
  /**
   * Voice name to use for TTS
   * @default browser default voice
   */
  voiceName?: string;

  /**
   * Language code for TTS
   * @default 'en-US'
   */
  language?: string;

  /**
   * Speech rate (0.1 to 10)
   * @default 1
   */
  rate?: number;

  /**
   * Speech pitch (0 to 2)
   * @default 1
   */
  pitch?: number;

  /**
   * Speech volume (0 to 1)
   * @default 1
   */
  volume?: number;
}

/**
 * Conversation configuration
 */
export interface ConversationConfig {
  /**
   * Enable continuous conversation loop
   * When true, automatically resumes listening after AI responds
   * @default false
   */
  continuous?: boolean;

  /**
   * Automatically speak AI responses
   * @default true
   */
  autoSpeak?: boolean;

  /**
   * Speech recognition configuration
   */
  recognizer?: RecognizerConfig;

  /**
   * Text-to-speech configuration
   */
  speaker?: SpeakerConfig;
}

/**
 * Voice errors
 */
export class VoiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VoiceError';
  }
}

export class VoiceNotSupportedError extends VoiceError {
  constructor(feature: string) {
    super(`${feature} is not supported in this browser`);
    this.name = 'VoiceNotSupportedError';
  }
}

export class VoicePermissionError extends VoiceError {
  constructor() {
    super('Microphone permission denied');
    this.name = 'VoicePermissionError';
  }
}
