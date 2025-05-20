import { Logger } from '@logdash/js-sdk';
import { PublicMethods } from '../types/public-methods';

export class AggregateLogger implements PublicMethods<Logger> {
  constructor(
    private readonly dto: {
      sensitiveDataLoggers: Logger[];
      publicDataLoggers: Logger[];
    },
  ) {}

  unsensitiveData(...data: any[]): any {
    return data[0];
  }

  debug(...data: any[]): void {
    this.dto.sensitiveDataLoggers.forEach((logger) => logger.debug(...data));

    const unsensitivedData = this.unsensitiveData(...data);
    this.dto.publicDataLoggers.forEach((logger) =>
      logger.debug(unsensitivedData),
    );
  }

  info(...data: any[]): void {
    this.dto.sensitiveDataLoggers.forEach((logger) => logger.info(...data));

    const unsensitivedData = this.unsensitiveData(...data);
    this.dto.publicDataLoggers.forEach((logger) =>
      logger.info(unsensitivedData),
    );
  }

  warn(...data: any[]): void {
    this.dto.sensitiveDataLoggers.forEach((logger) => logger.warn(...data));

    const unsensitivedData = this.unsensitiveData(...data);
    this.dto.publicDataLoggers.forEach((logger) =>
      logger.warn(unsensitivedData),
    );
  }

  error(...data: any[]): void {
    this.dto.sensitiveDataLoggers.forEach((logger) => logger.error(...data));

    const unsensitivedData = this.unsensitiveData(...data);
    this.dto.publicDataLoggers.forEach((logger) =>
      logger.error(unsensitivedData),
    );
  }

  http(...data: any[]): void {
    this.dto.sensitiveDataLoggers.forEach((logger) => logger.http(...data));

    const unsensitivedData = this.unsensitiveData(...data);
    this.dto.publicDataLoggers.forEach((logger) =>
      logger.http(unsensitivedData),
    );
  }

  log(...data: any[]): void {
    this.dto.sensitiveDataLoggers.forEach((logger) => logger.log(...data));

    const unsensitivedData = this.unsensitiveData(...data);
    this.dto.publicDataLoggers.forEach((logger) =>
      logger.log(unsensitivedData),
    );
  }

  silly(...data: any[]): void {
    this.dto.sensitiveDataLoggers.forEach((logger) => logger.silly(...data));

    const unsensitivedData = this.unsensitiveData(...data);
    this.dto.publicDataLoggers.forEach((logger) =>
      logger.silly(unsensitivedData),
    );
  }

  verbose(...data: any[]): void {
    this.dto.sensitiveDataLoggers.forEach((logger) => logger.verbose(...data));

    const unsensitivedData = this.unsensitiveData(...data);
    this.dto.publicDataLoggers.forEach((logger) =>
      logger.verbose(unsensitivedData),
    );
  }
}
