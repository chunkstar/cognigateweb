import type { AlertPayload, BudgetAlertData } from './types.js';

/**
 * Discord embed field
 */
interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

/**
 * Discord embed
 */
interface DiscordEmbed {
  title: string;
  description?: string;
  color: number;
  fields?: DiscordEmbedField[];
  footer?: {
    text: string;
  };
  timestamp?: string;
}

/**
 * Discord webhook payload
 */
interface DiscordPayload {
  content?: string;
  embeds: DiscordEmbed[];
}

/**
 * Send alert to Discord webhook
 *
 * @param webhookUrl - Discord webhook URL
 * @param payload - Alert payload
 */
export async function sendDiscordWebhook(webhookUrl: string, payload: AlertPayload): Promise<void> {
  const discordPayload = formatDiscordMessage(payload);

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(discordPayload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Discord webhook failed: ${response.status} ${text}`);
  }
}

/**
 * Format alert as Discord message
 *
 * @param payload - Alert payload
 * @returns Discord-formatted message
 */
function formatDiscordMessage(payload: AlertPayload): DiscordPayload {
  const { event, severity, data } = payload;

  // Determine color based on severity
  const colors: Record<string, number> = {
    info: 0x36a64f,      // Green
    warning: 0xffcc00,   // Yellow
    urgent: 0xff9900,    // Orange
    critical: 0xff0000,  // Red
  };

  const color: number = colors[severity] ?? 0x36a64f;

  // Format based on event type
  if (event === 'budget_warning' || event === 'budget_urgent' || event === 'budget_exceeded') {
    const budgetData = data as BudgetAlertData;
    return formatBudgetAlert(event, color, budgetData);
  }

  // Default generic alert
  return {
    embeds: [{
      title: `Cognigate Alert: ${event}`,
      description: JSON.stringify(data, null, 2),
      color,
      footer: {
        text: 'Cognigate',
      },
      timestamp: new Date().toISOString(),
    }],
  };
}

/**
 * Format budget alert for Discord
 */
function formatBudgetAlert(
  event: string,
  color: number,
  data: BudgetAlertData
): DiscordPayload {
  const titles: Record<string, string> = {
    budget_warning: '⚠️ Budget Warning: 50% Used',
    budget_urgent: '🚨 Budget Alert: 80% Used',
    budget_exceeded: '🛑 Budget Exceeded!',
  };

  const title = titles[event] || 'Budget Alert';

  return {
    content: title,
    embeds: [{
      title,
      color,
      fields: [
        {
          name: 'Daily Limit',
          value: `$${data.dailyLimit.toFixed(2)}`,
          inline: true,
        },
        {
          name: 'Used',
          value: `$${data.used.toFixed(2)} (${data.percentage.toFixed(1)}%)`,
          inline: true,
        },
        {
          name: 'Remaining',
          value: `$${data.remaining.toFixed(2)}`,
          inline: true,
        },
        {
          name: 'Resets At',
          value: new Date(data.resetAt).toLocaleString(),
          inline: false,
        },
      ],
      footer: {
        text: 'Cognigate Budget Monitor',
      },
      timestamp: new Date().toISOString(),
    }],
  };
}
