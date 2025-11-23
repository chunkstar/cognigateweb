import type { BudgetAlertData, AlertPayload } from '../webhooks/types.js';

/**
 * Budget threshold configuration
 */
export interface AlertThresholds {
  warning: number;   // 50% default
  urgent: number;    // 80% default
  critical: number;  // 100% (exceeded)
}

/**
 * Alert manager for budget monitoring
 *
 * Tracks budget usage and triggers alerts when thresholds are crossed.
 * Ensures alerts are only sent once per threshold per day.
 */
export class AlertManager {
  private thresholds: AlertThresholds;
  private firedAlerts: Set<string> = new Set();
  private listeners: Map<string, Set<Function>> = new Map();

  constructor(thresholds?: Partial<AlertThresholds>) {
    this.thresholds = {
      warning: thresholds?.warning ?? 50,
      urgent: thresholds?.urgent ?? 80,
      critical: thresholds?.critical ?? 100,
    };
  }

  /**
   * Check budget usage and trigger alerts if thresholds crossed
   *
   * @param dailyLimit - Daily budget limit
   * @param used - Amount used so far
   * @param resetAt - When budget resets
   */
  checkBudget(dailyLimit: number, used: number, resetAt: Date): void {
    // If unlimited budget, no alerts
    if (dailyLimit === 0) {
      return;
    }

    const percentage = (used / dailyLimit) * 100;
    const remaining = dailyLimit - used;

    const data: BudgetAlertData = {
      dailyLimit,
      used,
      remaining,
      percentage,
      resetAt: resetAt.toISOString(),
    };

    // Check critical (100% exceeded)
    if (percentage >= this.thresholds.critical && !this.hasFired('critical')) {
      this.fireAlert('budget_exceeded', 'critical', data);
      this.markFired('critical');
    }
    // Check urgent (80%)
    else if (percentage >= this.thresholds.urgent && !this.hasFired('urgent')) {
      this.fireAlert('budget_urgent', 'urgent', data);
      this.markFired('urgent');
    }
    // Check warning (50%)
    else if (percentage >= this.thresholds.warning && !this.hasFired('warning')) {
      this.fireAlert('budget_warning', 'warning', data);
      this.markFired('warning');
    }
  }

  /**
   * Fire an alert to all listeners
   */
  private fireAlert(
    event: 'budget_warning' | 'budget_urgent' | 'budget_exceeded',
    severity: 'warning' | 'urgent' | 'critical',
    data: BudgetAlertData
  ): void {
    const payload: AlertPayload = {
      event,
      timestamp: new Date().toISOString(),
      severity,
      data,
    };

    this.emit('alert', payload);
  }

  /**
   * Check if alert has already fired
   */
  private hasFired(threshold: string): boolean {
    return this.firedAlerts.has(threshold);
  }

  /**
   * Mark alert as fired
   */
  private markFired(threshold: string): void {
    this.firedAlerts.add(threshold);
  }

  /**
   * Reset fired alerts (called on budget reset)
   */
  reset(): void {
    this.firedAlerts.clear();
  }

  /**
   * Register event listener
   *
   * @param event - Event name ('alert')
   * @param callback - Event callback
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(callback);
  }

  /**
   * Remove event listener
   *
   * @param event - Event name
   * @param callback - Event callback
   */
  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          // Log error but don't throw - webhook failures shouldn't crash app
          console.error(`Alert listener error:`, error);
        }
      });
    }
  }

  /**
   * Get current thresholds
   */
  getThresholds(): Readonly<AlertThresholds> {
    return { ...this.thresholds };
  }
}
