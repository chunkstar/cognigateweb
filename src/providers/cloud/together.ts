import { OpenAICompatibleProvider } from './openai-compatible.js';
import type { ProviderConfig } from '../../utils/types.js';

/**
 * Together AI provider implementation
 *
 * Together AI provides access to 200+ open-source models through a single
 * OpenAI-compatible API. Great for experimentation and finding the perfect
 * model for your use case.
 *
 * @see https://docs.together.ai
 * @see https://api.together.ai
 *
 * @example
 * ```typescript
 * const ai = createGateway({
 *   cloudProviders: {
 *     together: {
 *       apiKey: process.env.TOGETHER_API_KEY,
 *       models: ['meta-llama/Llama-3.3-70B-Instruct-Turbo']
 *     }
 *   }
 * });
 * ```
 */
export class TogetherProvider extends OpenAICompatibleProvider {
  name = 'together';

  constructor(config: ProviderConfig) {
    super(config, {
      name: 'together',
      defaultBaseUrl: 'https://api.together.xyz/v1',
      defaultModels: [
        'meta-llama/Llama-3.3-70B-Instruct-Turbo',
        'meta-llama/Llama-3.1-8B-Instruct-Turbo',
        'mistralai/Mixtral-8x7B-Instruct-v0.1',
      ],
      // Together AI pricing as of 2025 (per 1M tokens)
      // Prices vary significantly by model - these are popular choices
      pricing: {
        // Llama 3.3 models
        'meta-llama/Llama-3.3-70B-Instruct-Turbo': { input: 0.88, output: 0.88 },
        // Llama 3.1 models
        'meta-llama/Llama-3.1-8B-Instruct-Turbo': { input: 0.18, output: 0.18 },
        'meta-llama/Llama-3.1-70B-Instruct-Turbo': { input: 0.88, output: 0.88 },
        'meta-llama/Llama-3.1-405B-Instruct-Turbo': { input: 3.50, output: 3.50 },
        // Mixtral models
        'mistralai/Mixtral-8x7B-Instruct-v0.1': { input: 0.60, output: 0.60 },
        'mistralai/Mixtral-8x22B-Instruct-v0.1': { input: 1.20, output: 1.20 },
        // Qwen models
        'Qwen/Qwen2.5-72B-Instruct-Turbo': { input: 1.20, output: 1.20 },
        'Qwen/Qwen2.5-7B-Instruct-Turbo': { input: 0.30, output: 0.30 },
        // DeepSeek on Together
        'deepseek-ai/DeepSeek-R1': { input: 3.00, output: 7.00 },
        'deepseek-ai/DeepSeek-V3': { input: 0.90, output: 0.90 },
        // Code models
        'Qwen/Qwen2.5-Coder-32B-Instruct': { input: 0.90, output: 0.90 },
      },
      defaultPricing: { input: 0.60, output: 0.60 },
    });
  }
}
