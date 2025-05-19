import { Global, Module } from '@nestjs/common';
import { ProjectEventEmitter } from './project-event.emitter';

@Global()
@Module({
  imports: [],
  providers: [ProjectEventEmitter],
  exports: [ProjectEventEmitter],
})
export class ProjectEventModule {}
