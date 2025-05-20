import { Global, Module } from '@nestjs/common';
import { MetricEventEmitter } from './metric-event.emitter';

@Global()
@Module({
  providers: [MetricEventEmitter],
  exports: [MetricEventEmitter],
})
export class MetricEventModule {}
