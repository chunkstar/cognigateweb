'use strict';

// src/utils/errors.ts
var CognigateError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "CognigateError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
};
var VoiceModeError = class extends CognigateError {
  constructor(message) {
    super(`Voice mode error: ${message}`);
    this.name = "VoiceModeError";
  }
};

// src/voice/voice-chat.ts
var VoiceMode = class {
  constructor(_gateway, _options) {
    throw new VoiceModeError(
      "Voice mode is not yet implemented. Coming in Phase 4 (v1.3)!"
    );
  }
  startListening() {
    throw new VoiceModeError("Not implemented");
  }
  stopListening() {
    throw new VoiceModeError("Not implemented");
  }
  toggle() {
    throw new VoiceModeError("Not implemented");
  }
  async speak(_text) {
    throw new VoiceModeError("Not implemented");
  }
};

exports.VoiceMode = VoiceMode;
//# sourceMappingURL=voice-chat.cjs.map
//# sourceMappingURL=voice-chat.cjs.map