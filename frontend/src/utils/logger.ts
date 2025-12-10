/**
 * Structured Logger
 * Phase D: Replace console.log with proper logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, context?: Record<string, any>): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context
    };
  }

  debug(message: string, context?: Record<string, any>) {
    if (this.isDevelopment) {
      const entry = this.formatMessage('debug', message, context);
      console.debug(`🔍 ${entry.timestamp} [DEBUG] ${message}`, context || '');
    }
  }

  info(message: string, context?: Record<string, any>) {
    const entry = this.formatMessage('info', message, context);
    console.info(`ℹ️ ${entry.timestamp} [INFO] ${message}`, context || '');
  }

  warn(message: string, context?: Record<string, any>) {
    const entry = this.formatMessage('warn', message, context);
    console.warn(`⚠️ ${entry.timestamp} [WARN] ${message}`, context || '');
  }

  error(message: string, error?: Error | any, context?: Record<string, any>) {
    const entry = this.formatMessage('error', message, { ...context, error: error?.message });
    console.error(`❌ ${entry.timestamp} [ERROR] ${message}`, error, context || '');
  }

  // Web3 specific logging
  web3(action: string, data?: Record<string, any>) {
    this.info(`Web3: ${action}`, data);
  }

  // Transaction logging
  transaction(hash: string, status: 'pending' | 'success' | 'failed', data?: Record<string, any>) {
    const emoji = status === 'success' ? '✅' : status === 'failed' ? '❌' : '⏳';
    this.info(`${emoji} Transaction ${status}: ${hash}`, data);
  }
}

export const logger = new Logger();