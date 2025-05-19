import { Global, Module } from '@nestjs/common';
import { AuthEventEmitter } from './auth-event.emitter';

@Global()
@Module({
  imports: [],
  providers: [AuthEventEmitter],
  exports: [AuthEventEmitter],
})
export class AuthEventModule {}
