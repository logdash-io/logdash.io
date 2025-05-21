import { Global, Module } from '@nestjs/common';
import { HttpPingEventEmitter } from './http-ping-event.emitter';

@Global()
@Module({
  providers: [HttpPingEventEmitter],
  exports: [HttpPingEventEmitter],
})
export class HttpPingEventModule {}
