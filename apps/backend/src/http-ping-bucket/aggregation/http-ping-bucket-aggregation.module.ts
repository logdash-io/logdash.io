import { Module } from '@nestjs/common';
import { HttpPingBucketReadModule } from '../read/http-ping-bucket-read.module';
import { HttpPingBucketAggregationService } from './http-ping-bucket-aggregation.service';

@Module({
  imports: [HttpPingBucketReadModule],
  providers: [HttpPingBucketAggregationService],
  exports: [HttpPingBucketAggregationService],
})
export class HttpPingBucketAggregationModule {}
