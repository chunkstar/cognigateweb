import { OpenAICompatibleProvider } from './openai-compatible.js';
import type { ProviderConfig } from '../../utils/types.js';

/**
 * DeepSeek provider implementation
 *
 * DeepSeek offers frontier-quality models at significantly lower prices.
 * Their API is fully OpenAI-compatible.
 *
 * @see https://platform.deepseek.com/docs
 *
 * @example
 * ```typescript
 * const ai = createGateway({
 *   cloudProviders: {
 *     deepseek: {
 *       apiKey: process.env.DEEPSEEK_API_KEY,
 *       models: ['deepseek-chat', 'deepseek-coder']
 *     }
 *   }
 * });
 * ```
 */
export class DeepSeekProvider extends OpenAICompatibleProvider {
  name = 'deepseek';

  constructor(config: ProviderConfig) {
    super(config, {
      name: 'deepseek',
      defaultBaseUrl: 'https://api.deepseek.com/v1',
      defaultModels: ['deepseek-chat', 'deepseek-coder'],
      // DeepSeek pricing as of 2025 (per 1M tokens)
      // One of the most cost-effective frontier models
      pricing: {
        'deepseek-chat': { input: 0.14, output: 0.28 },
        'deepseek-coder': { input: 0.14, output: 0.28 },
        'deepseek-reasoner': { input: 0.55, output: 2.19 },
      },
      defaultPricing: { input: 0.14, output: 0.28 },
    });
  }
}
