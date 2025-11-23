/**
 * Webhook alert types
 */
export type AlertType =
  | 'budget_warning'    // 50% threshold reached
  | 'budget_urgent'     // 80% threshold reached
  | 'budget_exceeded'   // 100% exceeded
  | 'provider_failed'   // Provider unavailable
  | 'daily_summary';    // End of day summary

/**
 * Alert severity levels
 */
export type AlertSeverity = 'info' | 'warning' | 'urgent' | 'critical';

/**
 * Budget alert data
 */
export interface BudgetAlertData {
  dailyLimit: number;
  used: number;
  remaining: number;
  percentage: number;
  resetAt: string;
}

/**
 * Provider failure alert data
 */
export interface ProviderFailedData {
  provider: string;
  error: string;
  timestamp: string;
}

/**
 * Daily summary alert data
 */
export interface DailySummaryData {
  totalRequests: number;
  totalCost: number;
  cacheHits: number;
  cacheMisses: number;
  providers: Record<string, number>; // provider -> request count
}

/**
 * Generic alert payload
 */
export interface AlertPayload {
  event: AlertType;
  timestamp: string;
  severity: AlertSeverity;
  data: BudgetAlertData | ProviderFailedData | DailySummaryData | Record<string, any>;
}

/**
 * Webhook delivery result
 */
export interface WebhookResult {
  success: boolean;
  webhook: string;
  error?: string;
}
