import type { BudgetStatus } from '../utils/types.js';
import { BudgetExceededError } from '../utils/errors.js';
import { AlertManager } from './alert-manager.js';

/**
 * Manages daily budget tracking and enforcement
 */
export class BudgetManager {
  private dailyLimit: number;
  private used: number = 0;
  private resetAt: Date;
  private alertManager: AlertManager;

  constructor(dailyLimit: number, alertManager?: AlertManager) {
    this.dailyLimit = dailyLimit;
    this.resetAt = this.calculateNextReset();
    this.alertManager = alertManager || new AlertManager();
  }

  /**
   * Calculate the next midnight UTC reset time
   */
  private calculateNextReset(): Date {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCHours(24, 0, 0, 0);
    return tomorrow;
  }

  /**
   * Check if budget needs to be reset (past midnight UTC)
   */
  private checkAndReset(): void {
    const now = new Date();
    if (now >= this.resetAt) {
      this.used = 0;
      this.resetAt = this.calculateNextReset();
      this.alertManager.reset();
    }
  }

  /**
   * Check if a given cost would exceed the budget
   * Throws BudgetExceededError if it would exceed
   *
   * @param cost - The cost to check
   * @throws {BudgetExceededError} If adding this cost would exceed the daily limit
   */
  checkBudget(cost: number): void {
    this.checkAndReset();

    // If daily limit is 0, budget is unlimited
    if (this.dailyLimit === 0) {
      return;
    }

    const potentialTotal = this.used + cost;

    if (potentialTotal > this.dailyLimit) {
      // BudgetExceededError expects (used, limit) not (limit, used)
      throw new BudgetExceededError(potentialTotal, this.dailyLimit);
    }
  }

  /**
   * Record spending after a successful completion
   *
   * @param cost - The cost to add to the daily total
   */
  recordSpending(cost: number): void {
    this.checkAndReset();
    this.used += cost;

    // Check budget thresholds and trigger alerts if needed
    this.alertManager.checkBudget(this.dailyLimit, this.used, this.resetAt);
  }

  /**
   * Get current budget status
   */
  getStatus(): BudgetStatus {
    this.checkAndReset();

    return {
      dailyLimit: this.dailyLimit,
      used: this.used,
      remaining: this.dailyLimit === 0 ? 0 : this.dailyLimit - this.used,
      resetAt: this.resetAt,
    };
  }

  /**
   * Get the daily limit
   */
  getDailyLimit(): number {
    return this.dailyLimit;
  }

  /**
   * Get current usage
   */
  getUsed(): number {
    this.checkAndReset();
    return this.used;
  }

  /**
   * Get the alert manager instance
   */
  getAlertManager(): AlertManager {
    return this.alertManager;
  }
}
