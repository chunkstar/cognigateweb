/**
 * Voice Mode - Coming in Sprint 4!
 *
 * This is a placeholder file to prevent build errors.
 * Implementation will be added in Phase 4 (v1.3 "Voice Revolution")
 */

import type { Gateway } from '../core/gateway.js';
import { VoiceModeError } from '../utils/errors.js';

export interface VoiceOptions {
  lang?: string;
  autoSpeak?: boolean;
  continuous?: boolean;
  voiceId?: string;
}

export class VoiceMode {
  constructor(_gateway: Gateway, _options?: VoiceOptions) {
    throw new VoiceModeError(
      'Voice mode is not yet implemented. Coming in Phase 4 (v1.3)!'
    );
  }

  startListening(): void {
    throw new VoiceModeError('Not implemented');
  }

  stopListening(): void {
    throw new VoiceModeError('Not implemented');
  }

  toggle(): void {
    throw new VoiceModeError('Not implemented');
  }

  async speak(_text: string): Promise<void> {
    throw new VoiceModeError('Not implemented');
  }
}
