import type { WebhooksConfig } from '../utils/types.js';
import type { AlertPayload, WebhookResult } from './types.js';
import { sendSlackWebhook } from './slack.js';
import { sendDiscordWebhook } from './discord.js';

/**
 * Webhook manager for sending alerts to multiple platforms
 *
 * Orchestrates webhook delivery to Slack, Discord, and custom webhooks.
 * Handles failures gracefully without crashing the application.
 */
export class WebhookManager {
  private config: WebhooksConfig;

  constructor(config: WebhooksConfig = {}) {
    this.config = config;
  }

  /**
   * Send alert to all configured webhooks
   *
   * @param payload - Alert payload
   * @returns Array of webhook results
   */
  async sendAlert(payload: AlertPayload): Promise<WebhookResult[]> {
    const results: WebhookResult[] = [];

    // Send to Slack if configured
    if (this.config.slack) {
      try {
        await sendSlackWebhook(this.config.slack, payload);
        results.push({
          success: true,
          webhook: 'slack',
        });
      } catch (error) {
        results.push({
          success: false,
          webhook: 'slack',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Send to Discord if configured
    if (this.config.discord) {
      try {
        await sendDiscordWebhook(this.config.discord, payload);
        results.push({
          success: true,
          webhook: 'discord',
        });
      } catch (error) {
        results.push({
          success: false,
          webhook: 'discord',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Send to custom webhook if configured
    if (this.config.custom) {
      try {
        await this.sendCustomWebhook(this.config.custom, payload);
        results.push({
          success: true,
          webhook: 'custom',
        });
      } catch (error) {
        results.push({
          success: false,
          webhook: 'custom',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Send alert to custom webhook URL
   *
   * @param url - Webhook URL
   * @param payload - Alert payload
   */
  private async sendCustomWebhook(url: string, payload: AlertPayload): Promise<void> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Update webhook configuration
   *
   * @param config - New webhook configuration
   */
  updateConfig(config: WebhooksConfig): void {
    this.config = config;
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<WebhooksConfig> {
    return { ...this.config };
  }
}
