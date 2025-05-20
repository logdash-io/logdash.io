import { Injectable } from '@nestjs/common';

@Injectable()
export class LoggerMock {
  error(): void {}
  warn(): void {}
  info(): void {}
  log(): void {}
  http(): void {}
  verbose(): void {}
  debug(): void {}
  silly(): void {}
}
