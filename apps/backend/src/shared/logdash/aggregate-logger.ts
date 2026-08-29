import { Logdash } from '@logdash/node';
import { redactSecrets } from './redact-secrets';

export interface LogdashLogger {
  debug(...data: any[]): void;
  info(...data: any[]): void;
  warn(...data: any[]): void;
  error(...data: any[]): void;
  http(...data: any[]): void;
  log(...data: any[]): void;
  silly(...data: any[]): void;
  verbose(...data: any[]): void;
}

type LogdashLevel = 'debug' | 'info' | 'warn' | 'error' | 'http' | 'silly' | 'verbose';

export class AggregateLogger implements LogdashLogger {
  constructor(
    private readonly dto: {
      sensitiveDataLoggers: Logdash[];
      publicDataLoggers: Logdash[];
    },
  ) {}

  private unsensitiveData(...data: any[]): any {
    return data[0];
  }

  /**
   * Credential shaped values are stripped before anything is written, including
   * to the sensitive stream - a session token in a log line stays usable to
   * everyone who can read that stream until it expires.
   */
  private emit(level: LogdashLevel, data: any[]): void {
    const redacted = data.map((entry) => redactSecrets(entry));

    this.dto.sensitiveDataLoggers.forEach((logger) => logger[level](...redacted));

    const unsensitivedData = this.unsensitiveData(...redacted);
    this.dto.publicDataLoggers.forEach((logger) => logger[level](unsensitivedData));
  }

  public debug(...data: any[]): void {
    this.emit('debug', data);
  }

  public info(...data: any[]): void {
    this.emit('info', data);
  }

  public warn(...data: any[]): void {
    this.emit('warn', data);
  }

  public error(...data: any[]): void {
    this.emit('error', data);
  }

  public http(...data: any[]): void {
    this.emit('http', data);
  }

  public log(...data: any[]): void {
    this.emit('debug', data);
  }

  public silly(...data: any[]): void {
    this.emit('silly', data);
  }

  public verbose(...data: any[]): void {
    this.emit('verbose', data);
  }
}
