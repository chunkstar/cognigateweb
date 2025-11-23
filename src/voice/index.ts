/**
 * Voice interface module
 *
 * Provides speech recognition, text-to-speech, and continuous conversation
 * capabilities using the Web Speech API.
 */

export { SpeechRecognizer } from './recognizer.js';
export { Speaker } from './speaker.js';
export { Conversation } from './conversation.js';
export type {
  RecognizerConfig,
  RecognitionResult,
  SpeakerConfig,
  ConversationConfig,
} from './types.js';
export {
  VoiceError,
  VoiceNotSupportedError,
  VoicePermissionError,
} from './types.js';
