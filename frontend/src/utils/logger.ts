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
  private isProduction = process.env.NODE_ENV === 'production';

  private formatMessage(level: LogLevel, message: string, context?: Record<string, any>): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: this.sanitizeContext(context)
    };
  }

  private sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
    if (!context) return undefined;
    
    const sanitized = { ...context };
    // Remove sensitive data from logs
    delete sanitized.privateKey;
    delete sanitized.mnemonic;
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.nonce;
    delete sanitized.signature;
    
    return sanitized;
  }

  debug(message: string, context?: Record<string, any>) {
    if (this.isDevelopment) {
      const entry = this.formatMessage('debug', message, context);
      console.debug(`🔍 ${entry.timestamp} [DEBUG] ${message}`, context || '');
    }
  }

  info(message: string, context?: Record<string, any>) {
    // Block info logs in production to prevent access logging
    if (this.isProduction) return;
    
    const entry = this.formatMessage('info', message, context);
    console.info(`ℹ️ ${entry.timestamp} [INFO] ${message}`, entry.context || '');
  }

  warn(message: string, context?: Record<string, any>) {
    const entry = this.formatMessage('warn', message, context);
    console.warn(`⚠️ ${entry.timestamp} [WARN] ${message}`, context || '');
  }

  error(message: string, error?: Error | any, context?: Record<string, any>) {
    const entry = this.formatMessage('error', message, { ...context, error: error?.message });
    console.error(`❌ ${entry.timestamp} [ERROR] ${message}`, error, context || '');
  }

  // Web3 specific logging (development only)
  web3(action: string, data?: Record<string, any>) {
    if (this.isProduction) return;
    this.info(`Web3: ${action}`, data);
  }

  // Transaction logging (development only)
  transaction(hash: string, status: 'pending' | 'success' | 'failed', data?: Record<string, any>) {
    if (this.isProduction) return;
    const emoji = status === 'success' ? '✅' : status === 'failed' ? '❌' : '⏳';
    this.info(`${emoji} Transaction ${status}: ${hash}`, data);
  }
}

export const logger = new Logger();