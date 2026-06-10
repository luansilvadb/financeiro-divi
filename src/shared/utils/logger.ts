type LogLevel = 'info' | 'warn' | 'error'

class Logger {
  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString()
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`
  }

  info(message: string, ...args: any[]): void {
    console.info(this.formatMessage('info', message), ...args)
  }

  warn(message: string, ...args: any[]): void {
    console.warn(this.formatMessage('warn', message), ...args)
  }

  error(message: string, ...args: any[]): void {
    console.error(this.formatMessage('error', message), ...args)
  }
}

export const logger = new Logger()
