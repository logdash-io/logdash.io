import { Module } from '@nestjs/common';
import { WebAnalyticsReadModule } from '../read/web-analytics-read.module';
import { WebAnalyticsWriteModule } from '../write/web-analytics-write.module';
import { ClusterReadModule } from '../../cluster/read/cluster-read.module';
import { WebAnalyticsIngestionService } from './web-analytics-ingestion.service';

@Module({
  imports: [WebAnalyticsReadModule, WebAnalyticsWriteModule, ClusterReadModule],
  providers: [WebAnalyticsIngestionService],
  exports: [WebAnalyticsIngestionService],
})
export class WebAnalyticsIngestionModule {}
