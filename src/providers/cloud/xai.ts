import { OpenAICompatibleProvider } from './openai-compatible.js';
import type { ProviderConfig } from '../../utils/types.js';

/**
 * xAI (Grok) provider implementation
 *
 * xAI offers Grok models with impressive reasoning capabilities and
 * industry-leading 2M token context windows. The API is OpenAI-compatible.
 * New users get $25 free API credits monthly.
 *
 * @see https://x.ai/api
 * @see https://console.x.ai
 *
 * @example
 * ```typescript
 * const ai = createGateway({
 *   cloudProviders: {
 *     xai: {
 *       apiKey: process.env.XAI_API_KEY,
 *       models: ['grok-2', 'grok-2-mini']
 *     }
 *   }
 * });
 * ```
 */
export class XAIProvider extends OpenAICompatibleProvider {
  name = 'xai';

  constructor(config: ProviderConfig) {
    super(config, {
      name: 'xai',
      defaultBaseUrl: 'https://api.x.ai/v1',
      defaultModels: ['grok-2', 'grok-2-mini'],
      // xAI Grok pricing as of 2025 (per 1M tokens)
      // Notable: 2M token context window on Grok models
      pricing: {
        'grok-2': { input: 2.00, output: 10.00 },
        'grok-2-mini': { input: 0.20, output: 1.00 },
        'grok-2-vision': { input: 2.00, output: 10.00 },
        'grok-3': { input: 3.00, output: 15.00 },
        'grok-3-mini': { input: 0.30, output: 1.50 },
      },
      defaultPricing: { input: 2.00, output: 10.00 },
    });
  }
}
