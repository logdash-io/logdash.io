import { Module } from '@nestjs/common';
import { HttpPingAggregationModule } from 'src/http-ping/aggregation/http-ping-aggregation.module';
import { HttpPingBucketReadModule } from '../read/http-ping-bucket-read.module';
import { HttpPingBucketAggregationService } from './http-ping-bucket-aggregation.service';

@Module({
  imports: [HttpPingBucketReadModule, HttpPingAggregationModule],
  providers: [HttpPingBucketAggregationService],
  exports: [HttpPingBucketAggregationService],
})
export class HttpPingBucketAggregationModule {}
