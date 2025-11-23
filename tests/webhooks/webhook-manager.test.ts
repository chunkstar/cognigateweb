import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebhookManager } from '../../src/webhooks/webhook-manager.js';
import type { AlertPayload } from '../../src/webhooks/types.js';

describe('WebhookManager', () => {
  let webhookManager: WebhookManager;
  let mockFetch: any;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  const createBudgetPayload = (): AlertPayload => ({
    event: 'budget_warning',
    timestamp: new Date().toISOString(),
    severity: 'warning',
    data: {
      dailyLimit: 100,
      used: 50,
      remaining: 50,
      percentage: 50,
      resetAt: new Date().toISOString(),
    },
  });

  describe('Slack Webhook', () => {
    beforeEach(() => {
      webhookManager = new WebhookManager({
        slack: 'https://hooks.slack.com/test',
      });
    });

    it('should send alert to Slack', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      const payload = createBudgetPayload();
      const results = await webhookManager.sendAlert(payload);

      expect(results).toEqual([
        { success: true, webhook: 'slack' },
      ]);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://hooks.slack.com/test',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should handle Slack webhook failure gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Invalid webhook',
      });

      const payload = createBudgetPayload();
      const results = await webhookManager.sendAlert(payload);

      expect(results).toEqual([
        { success: false, webhook: 'slack', error: expect.stringContaining('400') },
      ]);
    });
  });

  describe('Discord Webhook', () => {
    beforeEach(() => {
      webhookManager = new WebhookManager({
        discord: 'https://discord.com/api/webhooks/test',
      });
    });

    it('should send alert to Discord', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      const payload = createBudgetPayload();
      const results = await webhookManager.sendAlert(payload);

      expect(results).toEqual([
        { success: true, webhook: 'discord' },
      ]);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://discord.com/api/webhooks/test',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should handle Discord webhook failure gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Webhook not found',
      });

      const payload = createBudgetPayload();
      const results = await webhookManager.sendAlert(payload);

      expect(results).toEqual([
        { success: false, webhook: 'discord', error: expect.stringContaining('404') },
      ]);
    });
  });

  describe('Custom Webhook', () => {
    beforeEach(() => {
      webhookManager = new WebhookManager({
        custom: 'https://example.com/webhook',
      });
    });

    it('should send alert to custom webhook', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      const payload = createBudgetPayload();
      const results = await webhookManager.sendAlert(payload);

      expect(results).toEqual([
        { success: true, webhook: 'custom' },
      ]);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/webhook',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      );
    });

    it('should handle custom webhook failure gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const payload = createBudgetPayload();
      const results = await webhookManager.sendAlert(payload);

      expect(results).toEqual([
        { success: false, webhook: 'custom', error: expect.stringContaining('500') },
      ]);
    });
  });

  describe('Multiple Webhooks', () => {
    beforeEach(() => {
      webhookManager = new WebhookManager({
        slack: 'https://hooks.slack.com/test',
        discord: 'https://discord.com/api/webhooks/test',
        custom: 'https://example.com/webhook',
      });
    });

    it('should send to all configured webhooks', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      const payload = createBudgetPayload();
      const results = await webhookManager.sendAlert(payload);

      expect(results).toEqual([
        { success: true, webhook: 'slack' },
        { success: true, webhook: 'discord' },
        { success: true, webhook: 'custom' },
      ]);

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should continue sending even if one fails', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true }) // Slack succeeds
        .mockResolvedValueOnce({ ok: false, status: 400, text: async () => 'Error' }) // Discord fails
        .mockResolvedValueOnce({ ok: true }); // Custom succeeds

      const payload = createBudgetPayload();
      const results = await webhookManager.sendAlert(payload);

      expect(results).toEqual([
        { success: true, webhook: 'slack' },
        { success: false, webhook: 'discord', error: expect.stringContaining('400') },
        { success: true, webhook: 'custom' },
      ]);
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      webhookManager = new WebhookManager({
        slack: 'https://hooks.slack.com/old',
      });

      webhookManager.updateConfig({
        slack: 'https://hooks.slack.com/new',
      });

      const config = webhookManager.getConfig();
      expect(config.slack).toBe('https://hooks.slack.com/new');
    });

    it('should get current configuration', () => {
      const initialConfig = {
        slack: 'https://hooks.slack.com/test',
        discord: 'https://discord.com/api/webhooks/test',
      };

      webhookManager = new WebhookManager(initialConfig);

      const config = webhookManager.getConfig();
      expect(config).toEqual(initialConfig);
    });

    it('should not send to webhooks after config update removes them', async () => {
      webhookManager = new WebhookManager({
        slack: 'https://hooks.slack.com/test',
      });

      webhookManager.updateConfig({});

      const payload = createBudgetPayload();
      const results = await webhookManager.sendAlert(payload);

      expect(results).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Empty Configuration', () => {
    it('should handle no webhooks configured', async () => {
      webhookManager = new WebhookManager({});

      const payload = createBudgetPayload();
      const results = await webhookManager.sendAlert(payload);

      expect(results).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Different Alert Types', () => {
    beforeEach(() => {
      webhookManager = new WebhookManager({
        custom: 'https://example.com/webhook',
      });
      mockFetch.mockResolvedValue({ ok: true });
    });

    it('should send budget_warning alert', async () => {
      const payload: AlertPayload = {
        event: 'budget_warning',
        timestamp: new Date().toISOString(),
        severity: 'warning',
        data: {
          dailyLimit: 100,
          used: 50,
          remaining: 50,
          percentage: 50,
          resetAt: new Date().toISOString(),
        },
      };

      await webhookManager.sendAlert(payload);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/webhook',
        expect.objectContaining({
          body: JSON.stringify(payload),
        })
      );
    });

    it('should send budget_urgent alert', async () => {
      const payload: AlertPayload = {
        event: 'budget_urgent',
        timestamp: new Date().toISOString(),
        severity: 'urgent',
        data: {
          dailyLimit: 100,
          used: 80,
          remaining: 20,
          percentage: 80,
          resetAt: new Date().toISOString(),
        },
      };

      await webhookManager.sendAlert(payload);

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should send budget_exceeded alert', async () => {
      const payload: AlertPayload = {
        event: 'budget_exceeded',
        timestamp: new Date().toISOString(),
        severity: 'critical',
        data: {
          dailyLimit: 100,
          used: 105,
          remaining: -5,
          percentage: 105,
          resetAt: new Date().toISOString(),
        },
      };

      await webhookManager.sendAlert(payload);

      expect(mockFetch).toHaveBeenCalled();
    });
  });
});
