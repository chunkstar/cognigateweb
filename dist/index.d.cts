import { G as Gateway, W as WebhooksConfig, a as GatewayConfig } from './gateway-B01P0GkC.cjs';
export { B as BudgetStatus, e as CacheEntry, c as CloudProvidersConfig, C as CompletionOptions, b as CompletionResult, L as LocalFallbackConfig, d as Provider, P as ProviderConfig } from './gateway-B01P0GkC.cjs';

/**
 * Base error class for Cognigate
 */
declare class CognigateError extends Error {
    constructor(message: string);
}
/**
 * Error thrown when daily budget is exceeded
 */
declare class BudgetExceededError extends CognigateError {
    readonly used: number;
    readonly limit: number;
    constructor(used: number, limit: number);
}
/**
 * Error thrown when a provider is unavailable
 */
declare class ProviderUnavailableError extends CognigateError {
    readonly provider: string;
    constructor(provider: string, details?: string);
}
/**
 * Error thrown for cache-related issues
 */
declare class CacheError extends CognigateError {
    constructor(message: string);
}
/**
 * Error thrown for voice mode issues
 */
declare class VoiceModeError extends CognigateError {
    constructor(message: string);
}
/**
 * Error thrown for configuration validation failures
 */
declare class ConfigurationError extends CognigateError {
    constructor(message: string);
}

/**
 * Voice recognition configuration
 */
interface RecognizerConfig {
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
interface RecognitionResult {
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
interface SpeakerConfig {
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
interface ConversationConfig {
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
declare class VoiceError extends Error {
    constructor(message: string);
}
declare class VoiceNotSupportedError extends VoiceError {
    constructor(feature: string);
}
declare class VoicePermissionError extends VoiceError {
    constructor();
}

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
declare class SpeechRecognizer {
    private recognition;
    private config;
    private listeners;
    private isListening;
    constructor(config?: RecognizerConfig);
    /**
     * Check if speech recognition is supported
     */
    static isSupported(): boolean;
    /**
     * Check if speech recognition is supported (instance method)
     */
    private isSupported;
    /**
     * Initialize speech recognition
     */
    private initializeRecognition;
    /**
     * Start listening for speech
     *
     * @throws {VoicePermissionError} If microphone permission is denied
     */
    startListening(): Promise<void>;
    /**
     * Stop listening for speech
     */
    stopListening(): void;
    /**
     * Abort listening immediately
     */
    abort(): void;
    /**
     * Check if currently listening
     */
    isActive(): boolean;
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
    on(event: string, callback: Function): void;
    /**
     * Remove event listener
     *
     * @param event - Event name
     * @param callback - Event callback
     */
    off(event: string, callback: Function): void;
    /**
     * Emit event to all listeners
     *
     * @param event - Event name
     * @param data - Event data
     */
    private emit;
    /**
     * Get current configuration
     */
    getConfig(): Readonly<Required<RecognizerConfig>>;
}

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
declare class Speaker {
    private config;
    private synthesis;
    private listeners;
    private queue;
    private isSpeaking;
    constructor(config?: SpeakerConfig);
    /**
     * Check if text-to-speech is supported
     */
    static isSupported(): boolean;
    /**
     * Check if text-to-speech is supported (instance method)
     */
    private isSupported;
    /**
     * Speak text aloud
     *
     * @param text - Text to speak
     * @param options - Optional override config for this utterance
     */
    speak(text: string, options?: Partial<SpeakerConfig>): void;
    /**
     * Stop speaking immediately
     */
    stop(): void;
    /**
     * Pause speaking
     */
    pause(): void;
    /**
     * Resume speaking
     */
    resume(): void;
    /**
     * Check if currently speaking
     */
    isActive(): boolean;
    /**
     * Get available voices
     *
     * @returns List of available speech synthesis voices
     */
    getVoices(): SpeechSynthesisVoice[];
    /**
     * Get voices for a specific language
     *
     * @param language - Language code (e.g., 'en-US')
     * @returns Voices matching the language
     */
    getVoicesForLanguage(language: string): SpeechSynthesisVoice[];
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
    on(event: string, callback: Function): void;
    /**
     * Remove event listener
     *
     * @param event - Event name
     * @param callback - Event callback
     */
    off(event: string, callback: Function): void;
    /**
     * Emit event to all listeners
     *
     * @param event - Event name
     * @param data - Event data
     */
    private emit;
    /**
     * Get current configuration
     */
    getConfig(): Readonly<Required<SpeakerConfig>>;
    /**
     * Get queue length
     */
    getQueueLength(): number;
}

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
declare class Conversation {
    private gateway;
    private recognizer;
    private speaker;
    private config;
    private listeners;
    private isActive;
    private shouldContinue;
    constructor(gateway: Gateway, config?: ConversationConfig);
    /**
     * Set up event handlers for recognizer and speaker
     */
    private setupEventHandlers;
    /**
     * Resume listening after a delay
     */
    private resumeListening;
    /**
     * Start conversation
     */
    start(): Promise<void>;
    /**
     * Stop conversation
     */
    stop(): void;
    /**
     * Toggle conversation on/off
     */
    toggle(): Promise<void>;
    /**
     * Pause conversation (temporary stop)
     */
    pause(): void;
    /**
     * Resume conversation after pause
     */
    resume(): Promise<void>;
    /**
     * Check if conversation is active
     */
    isRunning(): boolean;
    /**
     * Check if recognizer is listening
     */
    isListening(): boolean;
    /**
     * Check if speaker is speaking
     */
    isSpeaking(): boolean;
    /**
     * Get available voices
     */
    getVoices(): SpeechSynthesisVoice[];
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
    on(event: string, callback: Function): void;
    /**
     * Remove event listener
     *
     * @param event - Event name
     * @param callback - Event callback
     */
    off(event: string, callback: Function): void;
    /**
     * Emit event to all listeners
     *
     * @param event - Event name
     * @param data - Event data
     */
    private emit;
    /**
     * Get current configuration
     */
    getConfig(): Readonly<Required<ConversationConfig>>;
}

/**
 * Webhook alert types
 */
type AlertType = 'budget_warning' | 'budget_urgent' | 'budget_exceeded' | 'provider_failed' | 'daily_summary';
/**
 * Alert severity levels
 */
type AlertSeverity = 'info' | 'warning' | 'urgent' | 'critical';
/**
 * Budget alert data
 */
interface BudgetAlertData {
    dailyLimit: number;
    used: number;
    remaining: number;
    percentage: number;
    resetAt: string;
}
/**
 * Provider failure alert data
 */
interface ProviderFailedData {
    provider: string;
    error: string;
    timestamp: string;
}
/**
 * Daily summary alert data
 */
interface DailySummaryData {
    totalRequests: number;
    totalCost: number;
    cacheHits: number;
    cacheMisses: number;
    providers: Record<string, number>;
}
/**
 * Generic alert payload
 */
interface AlertPayload {
    event: AlertType;
    timestamp: string;
    severity: AlertSeverity;
    data: BudgetAlertData | ProviderFailedData | DailySummaryData | Record<string, any>;
}
/**
 * Webhook delivery result
 */
interface WebhookResult {
    success: boolean;
    webhook: string;
    error?: string;
}

/**
 * Webhook manager for sending alerts to multiple platforms
 *
 * Orchestrates webhook delivery to Slack, Discord, and custom webhooks.
 * Handles failures gracefully without crashing the application.
 */
declare class WebhookManager {
    private config;
    constructor(config?: WebhooksConfig);
    /**
     * Send alert to all configured webhooks
     *
     * @param payload - Alert payload
     * @returns Array of webhook results
     */
    sendAlert(payload: AlertPayload): Promise<WebhookResult[]>;
    /**
     * Send alert to custom webhook URL
     *
     * @param url - Webhook URL
     * @param payload - Alert payload
     */
    private sendCustomWebhook;
    /**
     * Update webhook configuration
     *
     * @param config - New webhook configuration
     */
    updateConfig(config: WebhooksConfig): void;
    /**
     * Get current configuration
     */
    getConfig(): Readonly<WebhooksConfig>;
}

/**
 * Send alert to Slack webhook
 *
 * @param webhookUrl - Slack webhook URL
 * @param payload - Alert payload
 */
declare function sendSlackWebhook(webhookUrl: string, payload: AlertPayload): Promise<void>;

/**
 * Send alert to Discord webhook
 *
 * @param webhookUrl - Discord webhook URL
 * @param payload - Alert payload
 */
declare function sendDiscordWebhook(webhookUrl: string, payload: AlertPayload): Promise<void>;

/**
 * Cognigate - AI Gateway with Budget Controls
 *
 * Build AI apps without fear. Never overspend, never go down.
 */

/**
 * Create a new Cognigate gateway instance
 *
 * @param config - Gateway configuration
 * @returns Gateway instance
 *
 * @example
 * ```typescript
 * import { createGateway } from 'cognigate';
 *
 * const ai = createGateway({
 *   dailyBudget: 10,
 *   cloudProviders: {
 *     openai: { apiKey: process.env.OPENAI_API_KEY }
 *   },
 *   localFallback: { enabled: true }
 * });
 *
 * const response = await ai.complete("Hello, world!");
 * console.log(response);
 * ```
 */
declare function createGateway(config?: GatewayConfig): Gateway;

export { type AlertPayload, type AlertSeverity, type AlertType, type BudgetAlertData, BudgetExceededError, CacheError, CognigateError, ConfigurationError, Conversation, type ConversationConfig, type DailySummaryData, Gateway, GatewayConfig, type ProviderFailedData, ProviderUnavailableError, type RecognitionResult, type RecognizerConfig, Speaker, type SpeakerConfig, SpeechRecognizer, VoiceError, VoiceModeError, VoiceNotSupportedError, VoicePermissionError, WebhookManager, type WebhookResult, WebhooksConfig, createGateway, sendDiscordWebhook, sendSlackWebhook };
