import { Global, Module } from '@nestjs/common';
import { LogMetricEventEmitter } from './log-metric-event.emitter';

@Global()
@Module({
  providers: [LogMetricEventEmitter],
  exports: [LogMetricEventEmitter],
})
export class LogMetricEventModule {}
