/**
 * Development-only tracing for server-side GraphQL calls.
 *
 * Every method returns immediately outside development, so the logger costs
 * nothing in production and no customer data reaches the logs there.
 */

interface RequestLog {
  requestId: string;
  operation: string;
  variables?: unknown;
  timestamp: number;
  duration?: number;
  status: "pending" | "success" | "error";
  error?: string;
}

class ServerRequestLogger {
  private logs: Map<string, RequestLog> = new Map();

  startRequest(requestId: string, operation: string, variables?: unknown): void {
    if (process.env.NODE_ENV !== "development") return;

    this.logs.set(requestId, {
      requestId,
      operation,
      variables,
      timestamp: Date.now(),
      status: "pending",
    });

    console.log(`[ServerRequest] Started: ${operation}`, { requestId });
  }

  endRequest(requestId: string, data?: unknown): void {
    if (process.env.NODE_ENV !== "development") return;

    const log = this.logs.get(requestId);
    if (!log) return;

    log.duration = Date.now() - log.timestamp;
    log.status = "success";

    console.log(`[ServerRequest] Completed: ${log.operation}`, {
      requestId,
      duration: `${log.duration}ms`,
      dataKeys: data && typeof data === "object" ? Object.keys(data) : [],
    });

    setTimeout(() => this.logs.delete(requestId), 60000);
  }

  errorRequest(requestId: string, error: Error): void {
    if (process.env.NODE_ENV !== "development") return;

    const log = this.logs.get(requestId);
    if (!log) return;

    log.duration = Date.now() - log.timestamp;
    log.status = "error";
    log.error = error.message;

    console.error(`[ServerRequest] Failed: ${log.operation}`, {
      requestId,
      duration: `${log.duration}ms`,
      error: error.message,
    });

    setTimeout(() => this.logs.delete(requestId), 60000);
  }

  getActiveRequests(): RequestLog[] {
    return Array.from(this.logs.values()).filter((log) => log.status === "pending");
  }

  clearLogs(): void {
    this.logs.clear();
  }
}

export const serverRequestLogger = new ServerRequestLogger();
