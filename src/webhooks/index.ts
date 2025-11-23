/**
 * Webhooks module for alerts and notifications
 *
 * Provides integration with Slack, Discord, and custom webhooks
 * for budget alerts and monitoring.
 */

export { WebhookManager } from './webhook-manager.js';
export { sendSlackWebhook } from './slack.js';
export { sendDiscordWebhook } from './discord.js';
export type {
  AlertType,
  AlertSeverity,
  BudgetAlertData,
  ProviderFailedData,
  DailySummaryData,
  AlertPayload,
  WebhookResult,
} from './types.js';
