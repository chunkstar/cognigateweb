import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AlertManager } from '../../src/core/alert-manager.js';
import type { AlertPayload } from '../../src/webhooks/types.js';

describe('AlertManager', () => {
  let alertManager: AlertManager;
  let mockCallback: any;

  beforeEach(() => {
    alertManager = new AlertManager();
    mockCallback = vi.fn();
  });

  describe('Budget Alerts', () => {
    it('should trigger warning alert at 50% usage', () => {
      alertManager.on('alert', mockCallback);

      const resetAt = new Date(Date.now() + 86400000); // Tomorrow
      alertManager.checkBudget(100, 50, resetAt);

      expect(mockCallback).toHaveBeenCalledTimes(1);
      const payload: AlertPayload = mockCallback.mock.calls[0][0];

      expect(payload.event).toBe('budget_warning');
      expect(payload.severity).toBe('warning');
      expect(payload.data).toMatchObject({
        dailyLimit: 100,
        used: 50,
        remaining: 50,
        percentage: 50,
      });
    });

    it('should trigger urgent alert at 80% usage', () => {
      alertManager.on('alert', mockCallback);

      const resetAt = new Date(Date.now() + 86400000);
      alertManager.checkBudget(100, 80, resetAt);

      expect(mockCallback).toHaveBeenCalledTimes(1);
      const payload: AlertPayload = mockCallback.mock.calls[0][0];

      expect(payload.event).toBe('budget_urgent');
      expect(payload.severity).toBe('urgent');
      expect(payload.data).toMatchObject({
        dailyLimit: 100,
        used: 80,
        remaining: 20,
        percentage: 80,
      });
    });

    it('should trigger critical alert at 100% usage', () => {
      alertManager.on('alert', mockCallback);

      const resetAt = new Date(Date.now() + 86400000);
      alertManager.checkBudget(100, 100, resetAt);

      expect(mockCallback).toHaveBeenCalledTimes(1);
      const payload: AlertPayload = mockCallback.mock.calls[0][0];

      expect(payload.event).toBe('budget_exceeded');
      expect(payload.severity).toBe('critical');
      expect(payload.data).toMatchObject({
        dailyLimit: 100,
        used: 100,
        remaining: 0,
        percentage: 100,
      });
    });

    it('should trigger critical alert when exceeding 100%', () => {
      alertManager.on('alert', mockCallback);

      const resetAt = new Date(Date.now() + 86400000);
      alertManager.checkBudget(100, 120, resetAt);

      expect(mockCallback).toHaveBeenCalledTimes(1);
      const payload: AlertPayload = mockCallback.mock.calls[0][0];

      expect(payload.event).toBe('budget_exceeded');
      expect(payload.severity).toBe('critical');
      expect(payload.data).toMatchObject({
        percentage: 120,
      });
    });

    it('should not trigger alerts below 50%', () => {
      alertManager.on('alert', mockCallback);

      const resetAt = new Date(Date.now() + 86400000);
      alertManager.checkBudget(100, 49, resetAt);

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should not trigger alerts for unlimited budget', () => {
      alertManager.on('alert', mockCallback);

      const resetAt = new Date(Date.now() + 86400000);
      alertManager.checkBudget(0, 1000, resetAt);

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should only fire each threshold once', () => {
      alertManager.on('alert', mockCallback);

      const resetAt = new Date(Date.now() + 86400000);

      // First check at 50% - should fire
      alertManager.checkBudget(100, 50, resetAt);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Second check at 50% - should not fire again
      alertManager.checkBudget(100, 55, resetAt);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Third check at 80% - should fire (different threshold)
      alertManager.checkBudget(100, 80, resetAt);
      expect(mockCallback).toHaveBeenCalledTimes(2);

      // Fourth check at 85% - should not fire
      alertManager.checkBudget(100, 85, resetAt);
      expect(mockCallback).toHaveBeenCalledTimes(2);
    });

    it('should trigger highest threshold when jumping levels', () => {
      alertManager.on('alert', mockCallback);

      const resetAt = new Date(Date.now() + 86400000);

      // Jump straight to 100% - should only fire critical, not warning or urgent
      alertManager.checkBudget(100, 100, resetAt);

      expect(mockCallback).toHaveBeenCalledTimes(1);
      const payload: AlertPayload = mockCallback.mock.calls[0][0];
      expect(payload.event).toBe('budget_exceeded');
    });
  });

  describe('Alert Reset', () => {
    it('should reset fired alerts', () => {
      alertManager.on('alert', mockCallback);

      const resetAt = new Date(Date.now() + 86400000);

      // Fire warning alert
      alertManager.checkBudget(100, 50, resetAt);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Reset
      alertManager.reset();

      // Should fire again after reset
      alertManager.checkBudget(100, 50, resetAt);
      expect(mockCallback).toHaveBeenCalledTimes(2);
    });
  });

  describe('Event Listeners', () => {
    it('should support multiple listeners', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      alertManager.on('alert', callback1);
      alertManager.on('alert', callback2);

      const resetAt = new Date(Date.now() + 86400000);
      alertManager.checkBudget(100, 50, resetAt);

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should support removing listeners', () => {
      const callback = vi.fn();

      alertManager.on('alert', callback);
      alertManager.off('alert', callback);

      const resetAt = new Date(Date.now() + 86400000);
      alertManager.checkBudget(100, 50, resetAt);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle listener errors gracefully', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorCallback = vi.fn(() => {
        throw new Error('Listener error');
      });
      const normalCallback = vi.fn();

      alertManager.on('alert', errorCallback);
      alertManager.on('alert', normalCallback);

      const resetAt = new Date(Date.now() + 86400000);
      alertManager.checkBudget(100, 50, resetAt);

      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalledWith(
        'Alert listener error:',
        expect.any(Error)
      );

      consoleError.mockRestore();
    });
  });

  describe('Custom Thresholds', () => {
    it('should support custom warning threshold', () => {
      alertManager = new AlertManager({ warning: 60 });
      alertManager.on('alert', mockCallback);

      const resetAt = new Date(Date.now() + 86400000);

      alertManager.checkBudget(100, 59, resetAt);
      expect(mockCallback).not.toHaveBeenCalled();

      alertManager.checkBudget(100, 60, resetAt);
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should support custom urgent threshold', () => {
      // Test that urgent threshold works at custom value
      alertManager = new AlertManager({ warning: 60, urgent: 90 });
      alertManager.on('alert', mockCallback);

      const resetAt = new Date(Date.now() + 86400000);

      // First trigger warning at 60%
      alertManager.checkBudget(100, 60, resetAt);
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback.mock.calls[0][0].event).toBe('budget_warning');

      // Then trigger urgent at 90%
      alertManager.checkBudget(100, 90, resetAt);
      expect(mockCallback).toHaveBeenCalledTimes(2);

      const payload: AlertPayload = mockCallback.mock.calls[1][0];
      expect(payload.event).toBe('budget_urgent');
    });

    it('should get current thresholds', () => {
      const thresholds = alertManager.getThresholds();

      expect(thresholds).toEqual({
        warning: 50,
        urgent: 80,
        critical: 100,
      });
    });
  });
});
