import { Logdash } from '@logdash/node';

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

  public debug(...data: any[]): void {
    this.dto.sensitiveDataLoggers.forEach((logger) => logger.debug(...data));

    const unsensitivedData = this.unsensitiveData(...data);
    this.dto.publicDataLoggers.forEach((logger) => logger.debug(unsensitivedData));
  }

  public info(...data: any[]): void {
    this.dto.sensitiveDataLoggers.forEach((logger) => logger.info(...data));

    const unsensitivedData = this.unsensitiveData(...data);
    this.dto.publicDataLoggers.forEach((logger) => logger.info(unsensitivedData));
  }

  public warn(...data: any[]): void {
    this.dto.sensitiveDataLoggers.forEach((logger) => logger.warn(...data));

    const unsensitivedData = this.unsensitiveData(...data);
    this.dto.publicDataLoggers.forEach((logger) => logger.warn(unsensitivedData));
  }

  public error(...data: any[]): void {
    this.dto.sensitiveDataLoggers.forEach((logger) => logger.error(...data));

    const unsensitivedData = this.unsensitiveData(...data);
    this.dto.publicDataLoggers.forEach((logger) => logger.error(unsensitivedData));
  }

  public http(...data: any[]): void {
    this.dto.sensitiveDataLoggers.forEach((logger) => logger.http(...data));

    const unsensitivedData = this.unsensitiveData(...data);
    this.dto.publicDataLoggers.forEach((logger) => logger.http(unsensitivedData));
  }

  public log(...data: any[]): void {
    this.dto.sensitiveDataLoggers.forEach((logger) => logger.debug(...data));

    const unsensitivedData = this.unsensitiveData(...data);
    this.dto.publicDataLoggers.forEach((logger) => logger.debug(unsensitivedData));
  }

  public silly(...data: any[]): void {
    this.dto.sensitiveDataLoggers.forEach((logger) => logger.silly(...data));

    const unsensitivedData = this.unsensitiveData(...data);
    this.dto.publicDataLoggers.forEach((logger) => logger.silly(unsensitivedData));
  }

  public verbose(...data: any[]): void {
    this.dto.sensitiveDataLoggers.forEach((logger) => logger.verbose(...data));

    const unsensitivedData = this.unsensitiveData(...data);
    this.dto.publicDataLoggers.forEach((logger) => logger.verbose(unsensitivedData));
  }
}
