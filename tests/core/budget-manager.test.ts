import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { BudgetManager } from '../../src/core/budget-manager.js';
import { BudgetExceededError } from '../../src/utils/errors.js';

describe('BudgetManager', () => {
  describe('constructor', () => {
    it('should initialize with a daily limit', () => {
      const manager = new BudgetManager(10);
      const status = manager.getStatus();

      expect(status.dailyLimit).toBe(10);
      expect(status.used).toBe(0);
      expect(status.remaining).toBe(10);
    });

    it('should initialize with unlimited budget (0)', () => {
      const manager = new BudgetManager(0);
      const status = manager.getStatus();

      expect(status.dailyLimit).toBe(0);
      expect(status.used).toBe(0);
      expect(status.remaining).toBe(0);
    });
  });

  describe('checkBudget', () => {
    it('should allow request within budget', () => {
      const manager = new BudgetManager(10);

      expect(() => manager.checkBudget(5)).not.toThrow();
    });

    it('should throw error when request would exceed budget', () => {
      const manager = new BudgetManager(10);

      expect(() => manager.checkBudget(15)).toThrow(BudgetExceededError);
      expect(() => manager.checkBudget(15)).toThrow('Daily budget exceeded');
    });

    it('should allow unlimited spending when dailyLimit is 0', () => {
      const manager = new BudgetManager(0);

      expect(() => manager.checkBudget(1000)).not.toThrow();
      expect(() => manager.checkBudget(999999)).not.toThrow();
    });

    it('should throw error when accumulated spending would exceed budget', () => {
      const manager = new BudgetManager(10);

      manager.recordSpending(6);
      expect(() => manager.checkBudget(5)).toThrow(BudgetExceededError);
    });

    it('should allow request that exactly meets budget', () => {
      const manager = new BudgetManager(10);

      expect(() => manager.checkBudget(10)).not.toThrow();
    });

    it('should throw error with detailed budget information', () => {
      const manager = new BudgetManager(10);
      manager.recordSpending(7);

      try {
        manager.checkBudget(5);
        expect.fail('Should have thrown BudgetExceededError');
      } catch (error) {
        expect(error).toBeInstanceOf(BudgetExceededError);
        const budgetError = error as BudgetExceededError;
        expect(budgetError.limit).toBe(10);
        expect(budgetError.used).toBe(12); // 7 (current) + 5 (attempted) = 12
        expect(budgetError.message).toContain('Daily budget exceeded');
        expect(budgetError.message).toContain('$12.00'); // Attempted total
        expect(budgetError.message).toContain('$10.00'); // Limit
      }
    });
  });

  describe('recordSpending', () => {
    it('should record spending correctly', () => {
      const manager = new BudgetManager(10);

      manager.recordSpending(3);
      expect(manager.getUsed()).toBe(3);

      manager.recordSpending(2);
      expect(manager.getUsed()).toBe(5);
    });

    it('should accumulate multiple spending records', () => {
      const manager = new BudgetManager(100);

      manager.recordSpending(10.5);
      manager.recordSpending(20.25);
      manager.recordSpending(5.10);

      expect(manager.getUsed()).toBeCloseTo(35.85, 2);
    });
  });

  describe('getStatus', () => {
    it('should return correct status with no spending', () => {
      const manager = new BudgetManager(10);
      const status = manager.getStatus();

      expect(status.dailyLimit).toBe(10);
      expect(status.used).toBe(0);
      expect(status.remaining).toBe(10);
      expect(status.resetAt).toBeInstanceOf(Date);
    });

    it('should return correct status after spending', () => {
      const manager = new BudgetManager(10);
      manager.recordSpending(3);

      const status = manager.getStatus();

      expect(status.dailyLimit).toBe(10);
      expect(status.used).toBe(3);
      expect(status.remaining).toBe(7);
    });

    it('should show resetAt is tomorrow midnight UTC', () => {
      const manager = new BudgetManager(10);
      const status = manager.getStatus();

      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setUTCHours(24, 0, 0, 0);

      // Reset time should be tomorrow midnight UTC
      expect(status.resetAt.getTime()).toBeGreaterThan(now.getTime());
      expect(status.resetAt.getUTCHours()).toBe(0);
      expect(status.resetAt.getUTCMinutes()).toBe(0);
      expect(status.resetAt.getUTCSeconds()).toBe(0);
    });

    it('should return 0 remaining for unlimited budget', () => {
      const manager = new BudgetManager(0);
      manager.recordSpending(1000);

      const status = manager.getStatus();

      expect(status.dailyLimit).toBe(0);
      expect(status.remaining).toBe(0);
    });
  });

  describe('budget reset', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should reset budget at midnight UTC', () => {
      const now = new Date('2025-01-15T20:00:00Z');
      vi.setSystemTime(now);

      const manager = new BudgetManager(10);
      manager.recordSpending(7);

      expect(manager.getUsed()).toBe(7);

      // Advance to next day midnight UTC
      const tomorrow = new Date('2025-01-16T00:00:00Z');
      vi.setSystemTime(tomorrow);

      // Check status should trigger reset
      const status = manager.getStatus();

      expect(status.used).toBe(0);
      expect(status.remaining).toBe(10);
    });

    it('should update resetAt after reset', () => {
      const now = new Date('2025-01-15T20:00:00Z');
      vi.setSystemTime(now);

      const manager = new BudgetManager(10);
      const status1 = manager.getStatus();

      // Advance to next day
      const tomorrow = new Date('2025-01-16T00:00:00Z');
      vi.setSystemTime(tomorrow);

      const status2 = manager.getStatus();

      // resetAt should be updated to the next midnight
      expect(status2.resetAt.getTime()).toBeGreaterThan(status1.resetAt.getTime());
    });

    it('should allow spending after reset', () => {
      const now = new Date('2025-01-15T20:00:00Z');
      vi.setSystemTime(now);

      const manager = new BudgetManager(10);
      manager.recordSpending(9);

      // This would normally fail
      expect(() => manager.checkBudget(5)).toThrow(BudgetExceededError);

      // Advance to next day
      const tomorrow = new Date('2025-01-16T00:00:00Z');
      vi.setSystemTime(tomorrow);

      // Should now work after reset
      expect(() => manager.checkBudget(5)).not.toThrow();
    });
  });

  describe('getDailyLimit', () => {
    it('should return the daily limit', () => {
      const manager = new BudgetManager(25.50);

      expect(manager.getDailyLimit()).toBe(25.50);
    });
  });

  describe('getUsed', () => {
    it('should return current usage', () => {
      const manager = new BudgetManager(100);
      manager.recordSpending(15.75);

      expect(manager.getUsed()).toBe(15.75);
    });
  });
});
