import { Injectable } from '@nestjs/common';
import { LogdashLogger } from '../../src/shared/logdash/aggregate-logger';

@Injectable()
export class LoggerMock implements LogdashLogger {
  error(): void {}
  warn(): void {}
  info(): void {}
  log(): void {}
  http(): void {}
  verbose(): void {}
  debug(): void {}
  silly(): void {}
}
