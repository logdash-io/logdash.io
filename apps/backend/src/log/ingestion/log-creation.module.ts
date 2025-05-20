import { Module } from '@nestjs/common';
import { LogIngestionService } from './log-creation.service';
import { LogWriteModule } from '../write/log-write.module';
import { LogMetricIngestionModule } from '../../log-metric/ingestion/log-metric-ingestion.module';
import { LogIndexingModule } from '../indexing/log-indexing.module';

@Module({
  imports: [LogWriteModule, LogMetricIngestionModule, LogIndexingModule],
  providers: [LogIngestionService],
  exports: [LogIngestionService],
})
export class LogIngestionModule {}
