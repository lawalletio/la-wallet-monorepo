type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface LoggerOptions {
  enabledLevels?: LogLevel[];
  showTimestamp?: boolean;
  environment?: string;
}

const defaultOptions: LoggerOptions = {
  enabledLevels: ['log', 'info', 'warn', 'error', 'debug'],
  showTimestamp: true,
  environment: process.env.NODE_ENV || 'development',
};

class Logger {
  private options: LoggerOptions;

  constructor(options?: LoggerOptions) {
    this.options = { ...defaultOptions, ...options };
  }

  private format(level: LogLevel, message: string, extra?: any) {
    const timestamp = this.options.showTimestamp ? `[${new Date().toISOString()}]` : '';
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${extra ? JSON.stringify(extra) : ''}`;
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.options.environment === 'production' && (level === 'debug' || level === 'log')) {
      return false;
    }
    return this.options.enabledLevels?.includes(level) ?? true;
  }

  log(message: string, extra?: any) {
    if (!this.shouldLog('log')) return;
    console.log(this.format('log', message, extra));
  }

  info(message: string, extra?: any) {
    if (!this.shouldLog('info')) return;
    console.info(this.format('info', message, extra));
  }

  warn(message: string, extra?: any) {
    if (!this.shouldLog('warn')) return;
    console.warn(this.format('warn', message, extra));
  }

  error(message: string, extra?: any) {
    if (!this.shouldLog('error')) return;
    console.error(this.format('error', message, extra));
  }

  debug(message: string, extra?: any) {
    if (!this.shouldLog('debug')) return;
    console.debug(this.format('debug', message, extra));
  }
}

export const logger = new Logger();