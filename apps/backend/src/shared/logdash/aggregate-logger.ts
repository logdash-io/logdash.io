import { Logdash } from '@logdash/node';
import { redactSecrets } from './redact-secrets';

export interface LogdashLogger {
  debug(...data: unknown[]): void;
  info(...data: unknown[]): void;
  warn(...data: unknown[]): void;
  error(...data: unknown[]): void;
  http(...data: unknown[]): void;
  log(...data: unknown[]): void;
  silly(...data: unknown[]): void;
  verbose(...data: unknown[]): void;
}

type LogdashLevel = 'debug' | 'info' | 'warn' | 'error' | 'http' | 'silly' | 'verbose';

export class AggregateLogger implements LogdashLogger {
  constructor(
    private readonly dto: {
      sensitiveDataLoggers: Logdash[];
      publicDataLoggers: Logdash[];
    },
  ) {}

  private unsensitiveData(...data: unknown[]): unknown {
    return data[0];
  }

  /**
   * Credential shaped values are stripped before anything is written, including
   * to the sensitive stream - a session token in a log line stays usable to
   * everyone who can read that stream until it expires.
   */
  private emit(level: LogdashLevel, data: unknown[]): void {
    const redacted = data.map((entry) => redactSecrets(entry));

    this.dto.sensitiveDataLoggers.forEach((logger) => logger[level](...redacted));

    const unsensitivedData = this.unsensitiveData(...redacted);
    this.dto.publicDataLoggers.forEach((logger) => logger[level](unsensitivedData));
  }

  public debug(...data: unknown[]): void {
    this.emit('debug', data);
  }

  public info(...data: unknown[]): void {
    this.emit('info', data);
  }

  public warn(...data: unknown[]): void {
    this.emit('warn', data);
  }

  public error(...data: unknown[]): void {
    this.emit('error', data);
  }

  public http(...data: unknown[]): void {
    this.emit('http', data);
  }

  public log(...data: unknown[]): void {
    this.emit('debug', data);
  }

  public silly(...data: unknown[]): void {
    this.emit('silly', data);
  }

  public verbose(...data: unknown[]): void {
    this.emit('verbose', data);
  }
}
