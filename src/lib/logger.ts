// Simple logging utility
// In production, you would use a more robust logging solution

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private context: string;
  
  constructor(context: string) {
    this.context = context;
  }
  
  private log(level: LogLevel, message: string, meta?: unknown): void {
    const timestamp = new Date().toISOString();

    // In development, log to console
    if (process.env.NODE_ENV !== 'production') {
      const consoleMethod = level === 'error' ? 'error' : 
                           level === 'warn' ? 'warn' : 
                           level === 'info' ? 'info' : 'debug';
      
      console[consoleMethod](`[${timestamp}] [${level.toUpperCase()}] [${this.context}] ${message}`, meta || '');
    } else {
      // In production, you would send logs to a service
      // Example: sendToLoggingService(logEntry);
      
      // Still log errors to console in production
      if (level === 'error') {
        console.error(`[${timestamp}] [${level.toUpperCase()}] [${this.context}] ${message}`, meta || '');
      }
    }
  }
  
  debug(message: string, meta?: unknown): void {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: unknown): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: unknown): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: unknown): void {
    this.log('error', message, meta);
  }
}

export function createLogger(context: string): Logger {
  return new Logger(context);
}