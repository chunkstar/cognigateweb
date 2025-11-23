import { createServer, IncomingMessage, ServerResponse } from 'http';
import type { Gateway } from '../core/gateway.js';

export interface ApiServerConfig {
  port?: number;
  host?: string;
  cors?: boolean;
}

/**
 * Creates a REST API server for exposing Cognigate metrics
 *
 * Endpoints:
 * - GET /api/budget - Current budget status
 * - GET /api/usage - Usage statistics
 * - GET /api/providers - Provider breakdown
 * - GET /api/health - Health check
 *
 * @example
 * ```typescript
 * import { createGateway } from 'cognigate';
 * import { createApiServer } from 'cognigate/api';
 *
 * const gateway = createGateway({ ... });
 * const server = createApiServer(gateway, { port: 3001 });
 * server.start();
 * ```
 */
export class ApiServer {
  private server: ReturnType<typeof createServer>;
  private gateway: Gateway;
  private config: Required<ApiServerConfig>;

  constructor(gateway: Gateway, config: ApiServerConfig = {}) {
    this.gateway = gateway;
    this.config = {
      port: config.port || 3001,
      host: config.host || 'localhost',
      cors: config.cors ?? true,
    };

    this.server = createServer((req, res) => this.handleRequest(req, res));
  }

  private setCorsHeaders(res: ServerResponse): void {
    if (this.config.cors) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    this.setCorsHeaders(res);

    // Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    const url = new URL(req.url || '', `http://${req.headers.host}`);

    try {
      switch (url.pathname) {
        case '/api/budget':
          this.handleBudgetRequest(res);
          break;
        case '/api/usage':
          this.handleUsageRequest(res);
          break;
        case '/api/providers':
          this.handleProvidersRequest(res);
          break;
        case '/api/health':
          this.handleHealthRequest(res);
          break;
        default:
          this.send404(res);
      }
    } catch (error) {
      this.sendError(res, error);
    }
  }

  private handleBudgetRequest(res: ServerResponse): void {
    const budgetManager = (this.gateway as any).budgetManager;

    if (!budgetManager) {
      this.sendJson(res, { error: 'Budget tracking not enabled' }, 400);
      return;
    }

    const status = budgetManager.getStatus();
    this.sendJson(res, {
      limit: status.limit,
      used: status.used,
      remaining: status.remaining,
      percentage: status.percentage,
      resetAt: status.resetAt,
    });
  }

  private handleUsageRequest(res: ServerResponse): void {
    // Note: This requires gateway to expose usage stats
    // For now, returning mock structure
    const stats = {
      totalRequests: 0,
      totalCost: 0.00,
      avgCostPerRequest: 0.00,
      cacheHits: 0,
      cacheMisses: 0,
      cacheHitRate: 0,
    };

    this.sendJson(res, stats);
  }

  private handleProvidersRequest(res: ServerResponse): void {
    // Provider usage breakdown
    const providers = {
      openai: { requests: 0, cost: 0.00 },
      anthropic: { requests: 0, cost: 0.00 },
      google: { requests: 0, cost: 0.00 },
      ollama: { requests: 0, cost: 0.00 },
    };

    this.sendJson(res, providers);
  }

  private handleHealthRequest(res: ServerResponse): void {
    this.sendJson(res, {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  }

  private sendJson(res: ServerResponse, data: any, statusCode: number = 200): void {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  }

  private send404(res: ServerResponse): void {
    this.sendJson(res, { error: 'Not found' }, 404);
  }

  private sendError(res: ServerResponse, error: unknown): void {
    const message = error instanceof Error ? error.message : 'Internal server error';
    this.sendJson(res, { error: message }, 500);
  }

  /**
   * Start the API server
   */
  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.config.port, this.config.host, () => {
        console.log(`📊 Cognigate API server running at http://${this.config.host}:${this.config.port}`);
        resolve();
      });
    });
  }

  /**
   * Stop the API server
   */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        console.log('API server stopped');
        resolve();
      });
    });
  }
}

/**
 * Create and return an API server instance
 */
export function createApiServer(gateway: Gateway, config?: ApiServerConfig): ApiServer {
  return new ApiServer(gateway, config);
}
