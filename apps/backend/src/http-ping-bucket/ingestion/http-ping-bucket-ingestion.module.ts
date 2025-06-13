import { Module } from '@nestjs/common';
import { HttpPingAggregationModule } from 'src/http-ping/aggregation/http-ping-aggregation.module';
import { HttpPingBucketWriteModule } from '../write/http-ping-bucket-write.module';
import { HttpPingBucketIngestionService } from './http-ping-bucket-ingestion.service';

@Module({
  imports: [HttpPingBucketWriteModule, HttpPingAggregationModule],
  providers: [HttpPingBucketIngestionService],
})
export class HttpPingBucketIngestionModule {}
