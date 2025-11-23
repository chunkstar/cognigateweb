import type { AlertPayload, BudgetAlertData } from './types.js';

/**
 * Slack message attachment
 */
interface SlackAttachment {
  color: string;
  title: string;
  text?: string;
  fields?: Array<{
    title: string;
    value: string;
    short: boolean;
  }>;
  footer?: string;
  ts?: number;
}

/**
 * Slack webhook payload
 */
interface SlackPayload {
  text: string;
  attachments?: SlackAttachment[];
}

/**
 * Send alert to Slack webhook
 *
 * @param webhookUrl - Slack webhook URL
 * @param payload - Alert payload
 */
export async function sendSlackWebhook(webhookUrl: string, payload: AlertPayload): Promise<void> {
  const slackPayload = formatSlackMessage(payload);

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(slackPayload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Slack webhook failed: ${response.status} ${text}`);
  }
}

/**
 * Format alert as Slack message
 *
 * @param payload - Alert payload
 * @returns Slack-formatted message
 */
function formatSlackMessage(payload: AlertPayload): SlackPayload {
  const { event, severity, data } = payload;

  // Determine color based on severity
  const colors: Record<string, string> = {
    info: '#36a64f',      // Green
    warning: '#ffcc00',   // Yellow
    urgent: '#ff9900',    // Orange
    critical: '#ff0000',  // Red
  };

  const color: string = colors[severity] ?? '#36a64f';

  // Format based on event type
  if (event === 'budget_warning' || event === 'budget_urgent' || event === 'budget_exceeded') {
    const budgetData = data as BudgetAlertData;
    return formatBudgetAlert(event, color, budgetData);
  }

  // Default generic alert
  return {
    text: `Cognigate Alert: ${event}`,
    attachments: [{
      color,
      title: `Alert: ${event}`,
      text: JSON.stringify(data, null, 2),
      footer: 'Cognigate',
      ts: Math.floor(Date.now() / 1000),
    }],
  };
}

/**
 * Format budget alert for Slack
 */
function formatBudgetAlert(
  event: string,
  color: string,
  data: BudgetAlertData
): SlackPayload {
  const titles: Record<string, string> = {
    budget_warning: '⚠️ Budget Warning: 50% Used',
    budget_urgent: '🚨 Budget Alert: 80% Used',
    budget_exceeded: '🛑 Budget Exceeded!',
  };

  const title = titles[event] || 'Budget Alert';

  return {
    text: title,
    attachments: [{
      color,
      title,
      fields: [
        {
          title: 'Daily Limit',
          value: `$${data.dailyLimit.toFixed(2)}`,
          short: true,
        },
        {
          title: 'Used',
          value: `$${data.used.toFixed(2)} (${data.percentage.toFixed(1)}%)`,
          short: true,
        },
        {
          title: 'Remaining',
          value: `$${data.remaining.toFixed(2)}`,
          short: true,
        },
        {
          title: 'Resets At',
          value: new Date(data.resetAt).toLocaleString(),
          short: true,
        },
      ],
      footer: 'Cognigate Budget Monitor',
      ts: Math.floor(Date.now() / 1000),
    }],
  };
}
