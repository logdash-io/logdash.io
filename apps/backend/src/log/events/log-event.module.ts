import { Global, Module } from '@nestjs/common';
import { LogEventEmitter } from './log-event.emitter';

@Global()
@Module({
  providers: [LogEventEmitter],
  exports: [LogEventEmitter],
})
export class LogEventModule {}
