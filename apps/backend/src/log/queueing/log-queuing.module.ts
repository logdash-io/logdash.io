import { Module } from '@nestjs/common';
import { LogQueueingService } from './log-queueing.service';
import { LogIngestionModule } from '../ingestion/log-creation.module';

@Module({
  imports: [LogIngestionModule],
  providers: [LogQueueingService],
  exports: [LogQueueingService],
})
export class LogQueueingModule {}
