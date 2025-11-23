import { G as Gateway } from '../gateway-B01P0GkC.cjs';

/**
 * Voice Mode - Coming in Sprint 4!
 *
 * This is a placeholder file to prevent build errors.
 * Implementation will be added in Phase 4 (v1.3 "Voice Revolution")
 */

interface VoiceOptions {
    lang?: string;
    autoSpeak?: boolean;
    continuous?: boolean;
    voiceId?: string;
}
declare class VoiceMode {
    constructor(_gateway: Gateway, _options?: VoiceOptions);
    startListening(): void;
    stopListening(): void;
    toggle(): void;
    speak(_text: string): Promise<void>;
}

export { VoiceMode, type VoiceOptions };
