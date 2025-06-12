import { Module } from '@nestjs/common';
import { HttpPingBucketAggregationModule } from '../aggregation/http-ping-bucket-aggregation.module';
import { HttpPingBucketWriteModule } from '../write/http-ping-bucket-write.module';
import { HttpPingBucketSchedulerService } from './http-ping-bucket-scheduler.service';

@Module({
  imports: [HttpPingBucketWriteModule, HttpPingBucketAggregationModule],
  providers: [HttpPingBucketSchedulerService],
})
export class HttpPingBucketSchedulerModule {}
