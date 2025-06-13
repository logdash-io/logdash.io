import { Module } from '@nestjs/common';
import { HttpPingAggregationService } from './http-ping-aggregation.service';

@Module({
  providers: [HttpPingAggregationService],
  exports: [HttpPingAggregationService],
})
export class HttpPingAggregationModule {}
