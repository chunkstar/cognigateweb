import { OpenAICompatibleProvider } from './openai-compatible.js';
import type { ProviderConfig } from '../../utils/types.js';

/**
 * Mistral AI provider implementation
 *
 * Mistral offers high-quality European AI models with excellent
 * multilingual support and specialized models like Mathstral for
 * mathematical reasoning. The API is OpenAI-compatible.
 *
 * @see https://docs.mistral.ai
 * @see https://console.mistral.ai
 *
 * @example
 * ```typescript
 * const ai = createGateway({
 *   cloudProviders: {
 *     mistral: {
 *       apiKey: process.env.MISTRAL_API_KEY,
 *       models: ['mistral-small', 'mistral-large']
 *     }
 *   }
 * });
 * ```
 */
export class MistralProvider extends OpenAICompatibleProvider {
  name = 'mistral';

  constructor(config: ProviderConfig) {
    super(config, {
      name: 'mistral',
      defaultBaseUrl: 'https://api.mistral.ai/v1',
      defaultModels: ['mistral-small-latest', 'mistral-large-latest'],
      // Mistral pricing as of 2025 (per 1M tokens)
      pricing: {
        'mistral-small-latest': { input: 0.20, output: 0.60 },
        'mistral-medium-latest': { input: 2.70, output: 8.10 },
        'mistral-large-latest': { input: 2.00, output: 6.00 },
        'codestral-latest': { input: 0.20, output: 0.60 },
        'mathstral-latest': { input: 0.20, output: 0.60 },
        'pixtral-large-latest': { input: 2.00, output: 6.00 },
        'ministral-3b-latest': { input: 0.04, output: 0.04 },
        'ministral-8b-latest': { input: 0.10, output: 0.10 },
        // Aliases
        'mistral-small': { input: 0.20, output: 0.60 },
        'mistral-large': { input: 2.00, output: 6.00 },
        'codestral': { input: 0.20, output: 0.60 },
      },
      defaultPricing: { input: 0.20, output: 0.60 },
    });
  }
}
