import { Global, Module } from '@nestjs/common';
import { UserEventEmitter } from './user-event.emitter';

@Global()
@Module({
  imports: [],
  providers: [UserEventEmitter],
  exports: [UserEventEmitter],
})
export class UserEventModule {}
