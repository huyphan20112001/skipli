export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
  context?: string;
}

export class Logger {
  private logLevel: LogLevel;
  private context?: string;

  constructor(context?: string) {
    this.context = context;
    const envLogLevel = process.env.LOG_LEVEL?.toLowerCase();
    switch (envLogLevel) {
      case "error":
        this.logLevel = LogLevel.ERROR;
        break;
      case "warn":
        this.logLevel = LogLevel.WARN;
        break;
      case "info":
        this.logLevel = LogLevel.INFO;
        break;
      case "debug":
        this.logLevel = LogLevel.DEBUG;
        break;
      default:
        this.logLevel =
          process.env.NODE_ENV === "production"
            ? LogLevel.INFO
            : LogLevel.DEBUG;
    }
  }

  private createLogEntry(level: string, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      context: this.context,
    };
  }

  private formatForConsole(entry: LogEntry): string {
    const contextStr = entry.context ? `[${entry.context}] ` : "";
    const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : "";
    return `${entry.timestamp} ${entry.level.toUpperCase()} ${contextStr}${
      entry.message
    }${dataStr}`;
  }

  private output(entry: LogEntry): void {
    const formatted = this.formatForConsole(entry);

    switch (entry.level) {
      case "error":
        console.error(`\x1b[31m${formatted}\x1b[0m`);
        break;
      case "warn":
        console.warn(`\x1b[33m${formatted}\x1b[0m`);
        break;
      case "info":
        console.info(`\x1b[36m${formatted}\x1b[0m`);
        break;
      case "debug":
        console.log(`\x1b[37m${formatted}\x1b[0m`);
        break;
      default:
        console.log(formatted);
    }
  }

  error(message: string, data?: any): void {
    if (this.logLevel >= LogLevel.ERROR) {
      const entry = this.createLogEntry("error", message, data);
      this.output(entry);
    }
  }

  warn(message: string, data?: any): void {
    if (this.logLevel >= LogLevel.WARN) {
      const entry = this.createLogEntry("warn", message, data);
      this.output(entry);
    }
  }

  info(message: string, data?: any): void {
    if (this.logLevel >= LogLevel.INFO) {
      const entry = this.createLogEntry("info", message, data);
      this.output(entry);
    }
  }

  debug(message: string, data?: any): void {
    if (this.logLevel >= LogLevel.DEBUG) {
      const entry = this.createLogEntry("debug", message, data);
      this.output(entry);
    }
  }

  child(context: string): Logger {
    const childContext = this.context ? `${this.context}:${context}` : context;
    return new Logger(childContext);
  }

  logRequest(
    method: string,
    url: string,
    statusCode?: number,
    duration?: number
  ): void {
    const message = `${method} ${url}`;
    const data: any = {};

    if (statusCode !== undefined) {
      data.statusCode = statusCode;
    }

    if (duration !== undefined) {
      data.duration = `${duration}ms`;
    }

    if (statusCode && statusCode >= 400) {
      this.warn(message, data);
    } else {
      this.info(message, data);
    }
  }

  logAuth(
    event: string,
    identifier: string,
    success: boolean,
    details?: any
  ): void {
    const message = `Auth ${event}: ${identifier}`;
    const data = { success, ...details };

    if (success) {
      this.info(message, data);
    } else {
      this.warn(message, data);
    }
  }

  logDatabase(
    operation: string,
    collection: string,
    success: boolean,
    details?: any
  ): void {
    const message = `DB ${operation} on ${collection}`;
    const data = { success, ...details };

    if (success) {
      this.debug(message, data);
    } else {
      this.error(message, data);
    }
  }

  logExternalService(
    service: string,
    operation: string,
    success: boolean,
    details?: any
  ): void {
    const message = `External ${service} ${operation}`;
    const data = { success, ...details };

    if (success) {
      this.debug(message, data);
    } else {
      this.error(message, data);
    }
  }
}

export const logger = new Logger();

export const authLogger = new Logger("Auth");
export const dbLogger = new Logger("Database");
export const apiLogger = new Logger("API");
export const socketLogger = new Logger("Socket");

/**
 * Express middleware for request logging
 */
export function requestLogger(req: any, res: any, next: any): void {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    apiLogger.logRequest(req.method, req.url, res.statusCode, duration);
  });

  next();
}
